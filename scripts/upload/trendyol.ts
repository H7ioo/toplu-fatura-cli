import puppeteer from "puppeteer";
import { env } from "../../lib/env";
import axios, { AxiosError } from "axios";
import * as fs from "fs";
import FormData from "form-data";
import { logger } from "../logger";

const GOTO_URL = "https://partner.trendyol.com/orders/shipment-packages/all";
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

  // TODO: File doesn't exist

  const folderPath = `./data/trendyol/${date}/pdf`;

  // TODO: invoices.json

  try {
    fs.readdir(folderPath, async function (err, files) {
      if (err) {
        logger.error("Unable to scan directory: " + err);
        return;
      }

      for (let index = 0; index < files.length; index++) {
        const file = files[index];

        if (!file) throw new Error("File not found?");

        const filePath = `${folderPath}/${file}`; // Replace with the path to your file
        const fileStream = fs.createReadStream(filePath);
        // File path looks like this FIRST_NAME LAST_NAME-PACKAGE_NUBMER-HOURS.MINUTES.pdf
        const packageNumber = filePath.split("-")[1];

        if (!packageNumber) throw new Error("Packege number doesn't exist?");

        const formData = new FormData();
        formData.append("file", fileStream);
        await axios.post(invoiceURL(packageNumber), formData, {
          headers: {
            authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
            Accept: "application/json, text/plain, */*",
            authority: "sellerpublic-mars.trendyol.com",
            origin: "https://partner.trendyol.com",
          },
        });
      }
    });
  } catch (error) {
    logger.error(error);
    if (error instanceof AxiosError) {
      logger.error(`Axios Error occurred: ${error.message}`, error);
    }
  }
}

(async () => {
  await trendyolUpload("30-09-2023");
})();
