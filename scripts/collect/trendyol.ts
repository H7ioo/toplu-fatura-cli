import puppeteer from "puppeteer";
import {
  calcPriceWithoutVat,
  calcVat,
  createDirectory,
  getDate,
  sleep,
} from "../../lib/utils";
import { env } from "../../lib/env";
import * as fs from "fs";
import { TrendyolOrder } from "../../types/trendyol";
import { Order, OrderScheme } from "../../types";
import { ZodError } from "zod";
import { logger } from "../logger";

// TODO: Trendyol I can't manage to make a post request for some reason. It returns Unauthorized even though everything is identical.
// TODO: It's definitely better to use Trendyol Developer API but it's pain in the ass because it doesn't provide noInovice filtering.

const URL = "https://partner.trendyol.com/orders/shipment-packages/all";

const rawOrders: TrendyolOrder[] = [];
const orders: Order[] = [];

export async function trendyolCollect() {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./puppeteer/user_data",
  });

  const page = await browser.newPage();

  page.on("response", async (response) => {
    const request = response.request();

    // Listen for the noInvoice responses
    if (
      response.url().endsWith("hasInvoiceLink=false&channelId=1") &&
      request.method() === "GET"
    ) {
      // Fetch failed
      if (!response.ok())
        throw new Error(
          `Fetch request failed with ${response.status()} status code`
        );

      const ordersResponse = await response
        .json()
        .then((data) => data.content as Array<TrendyolOrder>);

      rawOrders.push(...ordersResponse);
    }
  });

  // Navigate the page to a URL
  await page.goto(URL);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // Login
  const emailInput =
    "#app-wrapper > div > div.auth.with-header-footer > div > div > div.login.g-d-flex > div.form > div.login-form > div > form > div.email-phone-input-wrapper.g-mt-20.g-mb-20 > div > div > div > div > input[type=text]";

  const emailInputExists = await page.$(emailInput);
  if (emailInputExists) {
    await page.waitForSelector(emailInput);
    await page.focus(emailInput);
    await page.keyboard.type(env.TRENDYOL_EMAIL);
    const passwordInput =
      "#app-wrapper > div > div.auth.with-header-footer > div > div > div.login.g-d-flex > div.form > div.login-form > div > form > div.password-input-wrapper.g-mb-20 > div.password.g-input > div > div > div > input[type=password]";
    await page.waitForSelector(passwordInput);
    await page.focus(passwordInput);
    await page.keyboard.type(env.TRENDYOL_PASSWORD);

    const loginButton =
      "#app-wrapper > div > div.auth.with-header-footer > div > div > div.login.g-d-flex > div.form > div.login-form > div > form > button > div";
    await page.waitForSelector(loginButton);
    await page.click(loginButton);
  }

  // Order amount
  const ordersAmountSelect =
    "#shipment-packages > div > div.order-list > div.new-dt.zebra.view-dt > div.table-operations.top > nav > div > div > select";
  // It might not exist if in page shown order count > order amount select box
  const ordersAmountSelectExists = await page.$(ordersAmountSelect);
  if (ordersAmountSelectExists) {
    await page.waitForSelector(ordersAmountSelect);
    await page.select(ordersAmountSelect, "100");
  }

  // Filter
  const filterButton = "#table-header-invoice-filter";
  await page.waitForSelector(filterButton);
  await page.click(filterButton);

  const noInvoiceCheckBox =
    "#table-header-invoice-filter > div.options.minor > ul > div:nth-child(5) > li";
  await page.waitForSelector(noInvoiceCheckBox);
  await page.click(noInvoiceCheckBox);

  // Wait for screen to update
  await sleep(3000);

  // Checks if there is more pages
  async function thereIsMore() {
    const checkIfDisabledLi = await page.$$eval(
      "#shipment-packages > div > div.order-list > div.new-dt.zebra.view-dt > div.table-operations.bottom > nav > ul > li",
      (el) => el[el.length - 2]
    );
    if (checkIfDisabledLi) {
      const isDisabled = await page.evaluate(() => {
        const checkIfDisabledLi = document.querySelectorAll(
          "#shipment-packages > div > div.order-list > div.new-dt.zebra.view-dt > div.table-operations.bottom > nav > ul > li"
        );
        const classNames =
          checkIfDisabledLi[checkIfDisabledLi.length - 2]?.getAttribute(
            "class"
          );
        return classNames?.includes("disabled") ? true : false;
      });
      if (isDisabled) return;
      const nextPageButton =
        "#shipment-packages > div > div.order-list > div.new-dt.zebra.view-dt > div.table-operations.bottom > nav > ul > li:nth-child(10) > a";

      await page.$eval(nextPageButton, (el) => el.click());

      // Wait for screen to update
      await sleep(3000);

      // Check if there is more
      await thereIsMore();
    }
  }

  await thereIsMore();

  await browser.close();

  const date = getDate();

  createDirectory(`./data/trendyol/${date}`);

  fs.writeFile(
    `./data/trendyol/${date}/rawOrders.json`,
    JSON.stringify(rawOrders),
    (err) => {
      if (err) {
        logger.error(err);
      }
    }
  );

  rawOrders.forEach((rawOrder) => {
    const exportType = rawOrder.exportType;
    const orderNumber = rawOrder.orderDetail.orderNumber;

    const packageNumber = rawOrder.id;
    const invoiceAddressObject = rawOrder.orderDetail.invoiceAddress;
    const firstName = invoiceAddressObject.firstName.trim();
    const lastName = invoiceAddressObject.lastName.trim();
    const fullName = invoiceAddressObject.fullName.trim();
    const fullAddress = `${invoiceAddressObject.address1} ${invoiceAddressObject.neighborhood} ${invoiceAddressObject.district} ${invoiceAddressObject.city}`;
    const isCommercial = rawOrder.commercial;
    const isExport = rawOrder.glocal && exportType === "Micro";
    const companyName = invoiceAddressObject.company;
    const VKN = invoiceAddressObject.taxNumber;
    const taxOffice = invoiceAddressObject.taxOffice;
    const orderTimestamp = rawOrder.orderDetail.orderDate;
    const orderDateObject = new Date(rawOrder.orderDetail.orderDate);

    const orderDate = {
      orderTimestamp,
      year: orderDateObject.getUTCFullYear(),
      month: orderDateObject.getMonth() + 1,
      day: orderDateObject.getDate(),
      hours: orderDateObject.getHours(),
      minutes: orderDateObject.getMinutes(),
      seconds: orderDateObject.getSeconds(),
      localDate: orderDateObject.toLocaleDateString("TR").replace(/\./gi, "/"),
    };

    if (!rawOrder.orderDetail.lines)
      throw new Error("Customer didn't purchase anything?");
    const ordersList = rawOrder.orderDetail.lines.map((orderLine) => {
      const vatRate = orderLine.vatBaseAmount;
      const priceWithVat = orderLine.price - (orderLine.discountAmount ?? 0);
      const priceWithoutVat = calcPriceWithoutVat(priceWithVat, vatRate);
      const vatAmount = calcVat(priceWithVat, vatRate);
      const quantity = orderLine.packageItems?.length;
      if (!quantity) throw new Error("Customer bought 0 items?");

      return { priceWithoutVat, priceWithVat, quantity, vatAmount, vatRate };
    });

    orders.push({
      packageNumber,
      fullName,
      firstName,
      lastName,
      fullAddress,
      isExport,
      companyName,
      VKN,
      taxOffice,
      orderDate,
      exportType,
      orderNumber,
      isCommercial,
      ordersList,
    });
  });

  try {
    OrderScheme.array().parse(orders);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(error.message);
    }
  }

  fs.writeFile(
    `./data/trendyol/${date}/orders.json`,
    JSON.stringify(orders),
    (err) => {
      if (err) {
        logger.error("Siparişleri yazınca hata oluştu.", err);
      }
    }
  );

  // TODAY-DATE/
  // rawOrders.json
  // orders.json
  // html/
  // pdf/
}
