import { checkbox, select } from "@inquirer/prompts";
import * as fs from "fs";
import { ZodError } from "zod";
import { convertAllHTMLFilesToPDF, getDirectories } from "./lib/utils";
import { COMPANIES, TRANSACTIONS } from "./lib/variables";
import { collectWrapper } from "./scripts/collect";
import { createInvoice } from "./scripts/invoice/create";
import { logger } from "./scripts/logger";
import { Companies, Order, OrderScheme } from "./types";

(async () => {
  const transaction = await select({
    message: "Yapmak istediğiniz işlemi seçiniz",
    choices: TRANSACTIONS.map((transaction) => ({ value: transaction })),
  });

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

      const directories = getDirectories(`./data/${company}`).map(
        (directory) => ({
          value: directory,
        })
      );

      if (!company) throw new Error("Şirket bulunmadı!");
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
        const dataString = fs.readFileSync(
          `./data/${company}/${date}/orders.json`,
          "utf8"
        );

        const data: Order[] = JSON.parse(dataString);

        OrderScheme.array().parse(data);

        await createInvoice({ company, orders: data, date, isTestMode: true });
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
  }
})();
