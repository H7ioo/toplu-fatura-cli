import { checkbox, select } from "@inquirer/prompts";
import { Companies, Order, OrderScheme } from "./types";
import { COMPANIES, TRANSACTIONS } from "./lib/variables";
import { collectWrapper } from "./scripts/collect";
import { createInvoice } from "./scripts/invoice/create";
import * as fs from "fs";
import { getDate, getDirectories } from "./lib/utils";
import { logger } from "./scripts/logger";
import { ZodError } from "zod";

(async () => {
  const transaction = await select({
    message: "Yapmak istediğiniz işlemi seçiniz",
    choices: TRANSACTIONS.map((transaction) => ({ value: transaction })),
  });

  // TODO: Collecting data will be presented as TODAY's date
  // TODO: Creating invoice will be a drop-down select instead of TODAY's date because you might collect than create invoice later. Also, PDF the same way

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

    const date = getDate();

    for (let index = 0; index < selectedCompanies.length; index++) {
      const company = selectedCompanies[index];
      if (!company) throw new Error("Şirket bulunmadı!");

      try {
        const dataString = fs.readFileSync(
          `./data/${company}/${date}/orders.json`,
          "utf8"
        );

        const data: Order[] = JSON.parse(dataString);

        OrderScheme.array().parse(data);

        await createInvoice({ company, orders: data, date });
      } catch (error) {
        logger.error(error);
        if (error instanceof ZodError) {
          logger.error(error.message, error);
        }
      }
    }
  } else if (transaction === "printPDF") {
    // TODO:
    console.log(getDirectories("./data/trendyol"));
  }
})();
