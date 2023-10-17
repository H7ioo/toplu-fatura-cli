import { checkbox, select } from "@inquirer/prompts";
import * as fs from "fs";
import { ZodError } from "zod";
import { convertAllHTMLFilesToPDF, getDirectories } from "./lib/utils";
import { COMPANIES, TRANSACTIONS } from "./lib/variables";
import { collectWrapper } from "./scripts/collect";
import { createInvoice } from "./scripts/invoice/create";
import { logger } from "./scripts/logger";
import { uploadWrapper } from "./scripts/upload";
import { Companies, Invoice, InvoiceScheme, Order, OrderScheme } from "./types";
import type { Choice } from "@inquirer/select/dist/cjs/types/index";

// TODO: PUSH THEN THROW ERROR, I DON'T WANT TO LOSE MY DATA (ZOD)
// TODO: PRINT PDF FASTER
// TODO: DELETE FOLDER AFTER 10 DAYS

// npm run start TRANSACTION_NAME

(async () => {
  const args = process.argv.slice(2);
  const TRANSACTION = args[0] as (typeof TRANSACTIONS)[number];

  let transaction: (typeof TRANSACTIONS)[number];

  if (TRANSACTION && TRANSACTIONS.includes(TRANSACTION)) {
    transaction = TRANSACTION;
  } else {
    transaction = await select({
      message: "Yapmak istediğiniz işlemi seçiniz",
      choices: TRANSACTIONS.map((transaction) => ({ value: transaction })),
    });
  }

  // TODO: Select date before the second company popup
  // TODO: All
  // TODO: Select specific order (by package name etc.)

  if (transaction === "collectData") {
    const selectedCompanies = await checkbox<Companies[number]>({
      message: "Fatura bilgilerini toplamak istediğiniz şirket/leri seçiniz",
      choices: COMPANIES.map((company) => ({ value: company })),
    });

    for (let index = 0; index < selectedCompanies.length; index++) {
      const company = selectedCompanies[index];
      if (!company) throw new Error("Şirket bulunmadı!");
      await collectWrapper[company]();
    }
  } else if (transaction === "createInvoice") {
    const selectedCompanies = await checkbox<Companies[number]>({
      message: "Fatura oluşturmak istediğiniz şirket/leri seçiniz",
      choices: COMPANIES.map((company) => ({ value: company })),
    });

    for (let index = 0; index < selectedCompanies.length; index++) {
      const company = selectedCompanies[index];
      if (!company) throw new Error("Şirket bulunmadı!");

      const directories = getDirectories(`./data/${company}`).map(
        (directory) => ({
          value: directory,
        })
      );

      if (directories.length === 0) {
        logger.info(
          "Tarih dosyası bulunmadı. İlk önce fatura bilgilerini toplamanız gerekiyor."
        );
        continue;
      }

      const date = await select({
        message: `${company} şirketi için tarih seçiniz`,
        choices: directories,
      });

      // TODO:
      const constraines: "none" | "packageNumber" | "Micro" = await select({
        message: "Darlama alanı seçiniz",
        choices: [
          { name: "istemiyorum", value: "none" },
          { value: "packageNumber", name: "Paket numarası ile" },
          { value: "Micro", name: "Mikro ihracat" },
        ],
      });

      try {
        const dataString = fs.readFileSync(
          `./data/${company}/${date}/orders.json`,
          "utf8"
        );

        const data: Order[] = JSON.parse(dataString);

        OrderScheme.array().parse(data);

        const constrainedData: Order[] = [];

        if (constraines === "Micro") {
          constrainedData.push(
            ...data.filter((order) => order.isExport === true)
          );
          // TODO: packageNumber input
        } else if (constraines === "packageNumber") {
          // constrainedData.push(...data.filter(order => order.isExport === true))
        } else if (constraines === "none") {
          constrainedData.push(...data);
        }

        await createInvoice({
          company,
          orders: constrainedData,
          date,
          isTestMode: false,
        });
      } catch (error) {
        logger.error(error);
        if (error instanceof ZodError) {
          logger.error(error.message, error);
        }
      }
    }
  } else if (transaction === "printPDF") {
    const selectedCompanies = await checkbox<Companies[number]>({
      message: "PDF oluşturmak istediğiniz şirket/leri seçiniz",
      choices: COMPANIES.map((company) => ({ value: company })),
    });

    for (let index = 0; index < selectedCompanies.length; index++) {
      const company = selectedCompanies[index];

      const directories = getDirectories(`./data/${company}`).map(
        (directory) => ({
          value: directory,
        })
      );

      if (!company) throw new Error("Şirket bulunmadı!");
      if (directories.length === 0) {
        logger.info(
          "Tarih/HTML dosyası bulunmadı. İlk önce fatura oluşturmanız gerekiyor."
        );
        continue;
      }

      const date = await select({
        message: `${company} şirketi için tarih seçiniz`,
        choices: directories,
      });

      try {
        const pdfFolderPath = `./data/${company}/${date}/pdf/`;
        const htmlFolderPath = `./data/${company}/${date}/html/`;
        await convertAllHTMLFilesToPDF({ htmlFolderPath, pdfFolderPath });
      } catch (error) {
        logger.error(error);
      }
    }
  } else if (transaction === "uploadInvoice") {
    const selectedCompanies = await checkbox<Companies[number]>({
      message: "Fatura yüklemek istediğiniz şirket/leri seçiniz",
      choices: COMPANIES.map((company) => ({ value: company })),
    });

    for (let index = 0; index < selectedCompanies.length; index++) {
      const company = selectedCompanies[index];

      if (!company) throw new Error("Şirket bulunmadı!");

      const directories = getDirectories(`./data/${company}`).map(
        (directory) => ({
          value: directory,
        })
      );

      if (directories.length === 0) {
        logger.info(
          "Tarih dosyası bulunmadı. İlk önce fatura bilgilerini toplamanız gerekiyor."
        );
        continue;
      }

      const date = await select({
        message: `${company} şirketi için tarih seçiniz`,
        choices: directories,
      });

      try {
        if (!fs.existsSync(`./data/${company}/${date}/pdf`)) {
          logger.info(
            "PDF dosyası mevcut değil. İlk önce faturaları PDF dönüştürünüz."
          );
          continue;
        }

        const dataString = fs.readFileSync(
          `./data/${company}/${date}/invoices.json`,
          "utf8"
        );

        const data: Invoice[] = JSON.parse(dataString);

        InvoiceScheme.array().parse(data);

        await uploadWrapper[company](date);
      } catch (error) {
        logger.error(error);
        if (error instanceof ZodError) {
          logger.error(error.message, error);
        }
      }
    }
  }
})();

// TODO: CONFIG
// TODO NOTION

// TODO: REMOVE DUPLACATED CODE
// TODO: Create invoice for 1 user or multiple users

// SAMPLE ERROR:
// https://sellerpublic-mars.trendyol.com/order-core-sellercenterordersbff-service/shipment-packages/X/customer-invoice
