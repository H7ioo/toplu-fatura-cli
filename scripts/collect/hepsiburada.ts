import * as fs from "fs";
import puppeteer from "puppeteer";
import { ZodError } from "zod";
import { env } from "../../lib/env";
import {
  calcPriceWithoutVat,
  calcVat,
  createDirectory,
  getDate,
  sleep,
} from "../../lib/utils";
import { Order, OrderScheme } from "../../types";
import { HepsiburadaOrder } from "../../types/hepsiburada";
import { logger } from "../logger";

// TODO: https://stackoverflow.com/questions/55678095/bypassing-captchas-with-headless-chrome-using-puppeteer

const URL = "https://merchant.hepsiburada.com/fulfilment/to-be-packed";

// BECAUSE HEPSIBURADA SUCKS
const VAT_RATE = 20;

const rawOrders: HepsiburadaOrder["Data"] = [];
const orders: Order[] = [];

export async function hepsiburadaCollect() {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./puppeteer/user_data",
  });

  const page = await browser.newPage();

  const pages = [
    // "tobepacked", // We can't add invoice in this state
    "readytoship",
    "shipped",
    "delivered",
    // "undelivered",
  ] as const;

  const REQ_URL_STRUCTURE = (page: (typeof pages)[number]) => {
    return `https://merchant.hepsiburada.com/fulfilment/api/v2/deliveries/${page}?has_invoice=false&sort_by=optionType.asc,estimatedShippingDate.asc&offset=0&limit=100`;
  };

  // Allows you to intercept a request; must appear before
  // your first page.goto()
  // await page.setRequestInterception(true);

  // page.once("request", (interceptedRequest) => {
  //   if (interceptedRequest.isInterceptResolutionHandled()) return;

  //   console.log(interceptedRequest.response()?.status());

  //   const data: ContinueRequestOverrides = {
  //     method: "GET",
  //     headers: {
  //       ...interceptedRequest.headers(),
  //     },
  //     url: "https://merchant.hepsiburada.com/fulfilment/api/v2/deliveries/readytoship?has_invoice=false&sort_by=optionType.asc,estimatedShippingDate.asc&offset=0&limit=100",
  //   };

  //   interceptedRequest.continue(data);

  //   page.setRequestInterception(false);
  // });

  // Navigate the page to a URL
  await page.goto(URL);

  // Set screen size
  await page.setViewport({ width: 1080, height: 920 });

  const emailInput = "#username";
  const passwordInput = "#password";
  const loginBtn = "#merchant-sign-in-button";

  await sleep(2000);

  const emailInputExists = await page.$(emailInput);
  if (emailInputExists) {
    try {
      await page.waitForSelector(emailInput);
      await page.type(emailInput, env.HEPSIBURADA_EMAIL);
      await page.type(passwordInput, env.HEPSIBURADA_PASSWORD);
      await page.click(loginBtn);
      await page.waitForNavigation();
      // TODO: Captcha popup
    } catch (e) {
      logger.error(e);
    }
  }

  // Make five GET requests
  for (let i = 0; i < pages.length; i++) {
    const pageName = pages[i];
    if (!pageName) throw new Error("Page doesn't exist?");
    const response = await page.goto(REQ_URL_STRUCTURE(pageName));
    const responseBody = await response?.text();
    if (response?.ok() && responseBody) {
      const data = (JSON.parse(responseBody) as HepsiburadaOrder).Data;

      // Get more details because Hepsiburada sucks
      for (let index = 0; index < data.length; index++) {
        const dataItem = data[index];
        if (!dataItem) throw new Error("No data item?");
        const detailedDataResponse = await page.goto(
          `https://merchant.hepsiburada.com/fulfilment/api/v1/deliveries/code/${dataItem?.Code}`
        );
        const detailedDataResponseBody = await detailedDataResponse?.text();
        if (detailedDataResponse?.ok() && detailedDataResponseBody) {
          dataItem.DataDetailed = JSON.parse(detailedDataResponseBody);
        } else {
          logger.error(`Failed to get detailed data`, detailedDataResponse);
        }
      }

      // TODO: if total > (count + offset) create a new request with offset = count and repeat
      rawOrders.push(...data);
    } else {
      logger.info(`${pageName} failed.`, await response?.json());
    }
  }

  await browser.close();

  const date = getDate();

  createDirectory(`./data/hepsiburada/${date}`);

  fs.writeFile(
    `./data/hepsiburada/${date}/rawOrders.json`,
    JSON.stringify(rawOrders),
    (err) => {
      if (err) {
        logger.error(err);
      }
    }
  );

  rawOrders.forEach((rawOrder) => {
    const packageNumber = Number(rawOrder.DeliveryNumber);
    const ordersObject = rawOrder.Orders[0];
    if (!ordersObject) throw new Error("ordersObject doesn't exist?");
    const invoiceAddressObject = ordersObject?.Lines[0]?.BillingAddress;
    if (!invoiceAddressObject)
      throw new Error("invoiceAddressObject doesn't exist?");
    const shippingAddressObject = ordersObject?.Lines[0]?.BillingAddress;
    if (!shippingAddressObject)
      throw new Error("shippingAddressObject doesn't exist?");
    const firstName = invoiceAddressObject.UserName.split(" ")
      .slice(0, -1)
      .join(" ")
      .trim();
    const lastName = invoiceAddressObject.UserName.split(" ")
      .slice(-1)
      .join(" ")
      .trim();
    const fullName = invoiceAddressObject.UserName.trim();
    const fullAddress = `${invoiceAddressObject.AddressDetail} ${invoiceAddressObject.District} / ${invoiceAddressObject.County} / ${invoiceAddressObject.City}`;
    const isCommercial = ordersObject.IsCustomerCorporateIconShowable;
    const isExport = false; // Doesn't support it yet
    const companyName = ordersObject.IsCustomerCorporateIconShowable
      ? shippingAddressObject.UserName
      : invoiceAddressObject.UserName;
    const VKN = invoiceAddressObject.TaxNumber;
    const taxOffice = invoiceAddressObject.TaxOffice;
    const orderTimestamp = new Date(rawOrder.OrderCreatedDateTime).getTime();
    const orderDateObject = new Date(rawOrder.OrderCreatedDateTime);

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

    const exportType = "None";
    const orderNumber = ordersObject.OrderNumber;

    const detailedOrderObject = rawOrder.DataDetailed.Orders[0];

    // Note: Discount is calculated from Hepsiburada. Good boy Hepsiburada good boy.

    if (!detailedOrderObject?.Lines)
      throw new Error("Customer didn't purchase anything?");
    const ordersList = detailedOrderObject?.Lines.map((orderLine) => {
      const vatRate = VAT_RATE;
      const priceWithVat = orderLine.UnitPriceBeforeLateInterest.Value;
      const priceWithoutVat = calcPriceWithoutVat(priceWithVat, vatRate);
      const vatAmount = calcVat(priceWithVat, vatRate);
      const quantity = orderLine.Quantity;
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
    `./data/hepsiburada/${date}/orders.json`,
    JSON.stringify(orders),
    (err) => {
      if (err) {
        logger.error("Siparişleri yazınca hata oluştu.", err);
      }
    }
  );
}
