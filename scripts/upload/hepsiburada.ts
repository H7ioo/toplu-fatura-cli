import axios, { AxiosError } from "axios";
import * as fs from "fs";
import { readFile } from "fs/promises";
import puppeteer from "puppeteer";
import { env } from "../../lib/env";
import { sleep } from "../../lib/utils";
import { Invoice } from "../../types";
import { logger } from "../logger";

const GOTO_URL = "https://merchant.hepsiburada.com/fulfilment/to-be-packed";
// invoiceNumber
// invoiceDateTime
const invoiceURL = (invoiceId: string) =>
  `https://merchant.hepsiburada.com/fulfilment/api/v1/deliveries/${invoiceId}/upload`;

export async function hepsiburadaUpload(date: string) {
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

  await sleep(3000);

  // This format that I want the cookie in
  const cookies = await page.evaluate(() => document.cookie);
  if (!cookies) throw new Error("Auth token not found.");

  const invoicesFile = `./data/hepsiburada/${date}/invoices.json`;

  if (!fs.existsSync(invoicesFile)) {
    logger.error("Invoices JSON file doesn't exist!");
    return;
  }

  const file = await readFile(invoicesFile, "utf8");
  const invoices: Invoice[] = JSON.parse(file);

  for (let index = 0; index < invoices.length; index++) {
    const invoice = invoices[index];
    if (!invoice) throw new Error("Invoice doesn't exist?");

    if (!invoice.deliveryNumber)
      throw new Error("Delivery number doesn't exist?");

    try {
      const fileBuffer = fs.readFileSync(invoice.filePath);
      if (!fileBuffer) throw new Error("File doesn't exist");

      const base64Data = Buffer.from(fileBuffer).toString("base64");

      const res = await axios.put(
        invoiceURL(invoice.deliveryNumber),
        { InvoiceFileAsBase64: `data:application/pdf;base64,${base64Data}` },
        {
          headers: {
            cookie: cookies,
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
            authority: "merchant.hepsiburada.com",
            origin: "https://merchant.hepsiburada.com",
          },
        }
      );

      await sleep(1000 * (Math.random() * 5));

      if (res.status >= 200 && res.status < 300) {
        console.log(
          `${invoice.packageNumber} fatura başarıyla yüklendi. Index: ${
            index + 1
          }/${invoices.length}`
        );
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        logger.error(error.message, error);
      } else if (error instanceof Error) {
        logger.error(error.message, error);
      }
    }
  }

  await browser.close();
}
