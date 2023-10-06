import puppeteer from "puppeteer";
import { env } from "../../lib/env";
import axios, { AxiosError, AxiosResponse } from "axios";
import * as fs from "fs";
import FormData from "form-data";
import { logger } from "../logger";
import { Invoice } from "../../types";
import { invoicePostError } from "../../types/trendyol";

const GOTO_URL = "https://partner.trendyol.com/orders/shipment-packages/all";
// invoiceNumber
// invoiceDateTime
const invoiceURL = (invoiceId: string) =>
  `https://sellerpublic-mars.trendyol.com/order-core-sellercenterordersbff-service/shipment-packages/${invoiceId}/customer-invoice`;

export async function trendyolUpload(date: string) {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./puppeteer/user_data",
  });

  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(GOTO_URL);

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

  const authToken = (await page.cookies()).filter(
    (c) => c.domain === "partner.trendyol.com" && c.name === "auth_token"
  )[0]?.value;
  if (!authToken) throw new Error("Auth token not found.");

  const invoicesFile = `./data/trendyol/${date}/invoices.json`;

  if (!fs.existsSync(invoicesFile)) {
    logger.error("Invoices JSON file doesn't exist!");
    return;
  }

  fs.readFile(invoicesFile, "utf8", async (err, data) => {
    if (err) {
      logger.error(err.message, err);
    }

    const invoices: Invoice[] = JSON.parse(data);

    for (let index = 0; index < invoices.length; index++) {
      const invoice = invoices[index];
      if (!invoice) throw new Error("Invoice doesn't exist?");

      try {
        const fileStream = fs.createReadStream(invoice.filePath);
        if (!fileStream) throw new Error("File doesn't exist");

        const formData = new FormData();
        formData.append("file", fileStream);

        const res = await axios.post(
          invoiceURL(invoice.packageNumber.toString()),
          formData,
          {
            headers: {
              authorization: `Bearer ${authToken}`,
              "Content-Type": "multipart/form-data",
              Accept: "application/json, text/plain, */*",
              authority: "sellerpublic-mars.trendyol.com",
              origin: "https://partner.trendyol.com",
            },
            params: invoice.isExport
              ? {
                  invoiceNumber: invoice.id,
                  invoiceDateTime: invoice.orderTimestamp,
                }
              : undefined,
          }
        );

        if (res.status >= 200 && res.status < 300) {
          console.log(
            `${invoice.packageNumber} invoice uploaded successfully. Index: ${
              index + 1
            }/${invoices.length}`
          );
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          logger.error(error.message, error);
          if (error.status === 400) {
            const err: AxiosError<invoicePostError> = error;
            logger.error(
              `Error uploading invoice: ${err.response?.data.errors[0]?.message}`,
              err
            );
          }
        } else if (error instanceof Error) {
          logger.error(error.message, error);
        }
      }
    }
  });

  await browser.close();
}
