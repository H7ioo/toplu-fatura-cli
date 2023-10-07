import axios from "axios";
import EInvoice, {
  CreateDraftInvoicePayload,
  EInvoiceApiError,
  EInvoiceApiErrorCode,
  EInvoiceCountry,
  EInvoiceCurrencyType,
  EInvoiceTypeError,
  EInvoiceUnitType,
  InvoiceProduct,
  InvoiceType, // Fatura türü
} from "e-fatura";
import * as fs from "fs";
import { env } from "../../lib/env";
import { calcMatrah, createDirectory, pad, sleep } from "../../lib/utils";
import { Companies, Invoice, InvoiceScheme, Order } from "../../types";
import { logger } from "../logger";
import { ZodError } from "zod";

export async function createInvoice({
  orders,
  date,
  isTestMode = false,
  company,
}: {
  orders: Order[];
  date: string;
  isTestMode?: boolean;
  company: Companies[number];
}) {
  const invoices: Invoice[] = [];
  const errors: string[] = [];

  logger.info(
    `${orders.length} orders invoice for ${company} company will be created.`
  );

  if (isTestMode) {
    // Test modunu aktif/deaktif eder.
    EInvoice.setTestMode(true); // varsayılan olarak false

    // Anonim kullanıcı bilgileri atar.
    await EInvoice.setAnonymousCredentials();
  } else {
    EInvoice.setTestMode(false); // varsayılan olarak false

    // Muhasebecinizden aldığınız giriş bilgileri.
    EInvoice.setCredentials({
      username: env.EARSIV_USERNAME,
      password: env.EARSIV_PASSWORD,
    });
  }

  // e-Arşive bağlanır.
  await EInvoice.connect(); // veya EInvoice.getAccessToken()
  await EInvoice.getAccessToken();

  const folderPath = `./data/${company}/${date}`;
  const htmlFolderPath = `${folderPath}/html`;
  const pdfFolderPath = `${folderPath}/pdf`;
  createDirectory(htmlFolderPath);

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];

    if (!order?.ordersList) throw new Error("Order list doesn't exist");

    let payload: CreateDraftInvoicePayload;

    console.info(
      `Index: ${i + 1}\nPaket No: ${order.packageNumber}\nİsim soyisim: ${
        order.fullName
      }`
    );

    // Mikro Ihracat 0% Vat
    if (order?.isExport) {
      const totalPriceWithVat = order.ordersList.reduce(
        (acc, current) => acc + current.priceWithVat, // priceWithVat
        0
      );

      const ordersList: InvoiceProduct[] = order.ordersList.map((item) => {
        return {
          name: "Cep tel için kapak",
          quantity: item.quantity,
          unitPrice: item.priceWithVat,
          price: item.priceWithVat * item.quantity,
          unitType: EInvoiceUnitType.ADET,
          totalAmount: item.priceWithVat * item.quantity,
          vatAmount: 0,
        };
      });

      payload = {
        buyerFirstName: order.firstName,
        buyerLastName: order.lastName,
        fullAddress: order.fullAddress,
        base: totalPriceWithVat,
        paymentPrice: totalPriceWithVat,
        invoiceType: InvoiceType.ISTISNA,
        country: EInvoiceCountry.AZERBEYCAN,
        currency: EInvoiceCurrencyType.TURK_LIRASI,
        productsTotalPrice: totalPriceWithVat,
        includedTaxesTotalPrice: totalPriceWithVat,
        date: order.orderDate.localDate,
        time: `${pad(order.orderDate.hours)}:${pad(
          order.orderDate.minutes
        )}:${pad(order.orderDate.seconds)}`,
        taxOffice: order.taxOffice ? order.taxOffice : undefined,
        buyerTitle: order.companyName ? order.companyName : undefined,
        taxOrIdentityNumber: order.VKN ? order.VKN : undefined,
        note: "301-Mal İhracatı",
        products: ordersList,
      };
    } else {
      const totalPriceWithVat = order?.ordersList.reduce(
        (acc, current) => acc + current.priceWithVat,
        0
      );

      const totalPriceWithoutVat = order?.ordersList.reduce(
        (acc, current) => acc + current.priceWithoutVat,
        0
      );

      const ordersList: InvoiceProduct[] = order?.ordersList.map((item) => {
        return {
          name: "Cep tel için kapak",
          quantity: item.quantity,
          unitPrice: item.priceWithoutVat,
          price: item.priceWithoutVat * item.quantity,
          unitType: EInvoiceUnitType.ADET,
          totalAmount: item.priceWithoutVat * item.quantity,
          vatRate: item.vatRate,
          vatAmount: item.vatAmount,
        };
      });

      const totalNetVat = order?.ordersList.reduce(
        (acc, current) => acc + current.vatAmount,
        0
      );

      payload = {
        buyerFirstName: order.firstName,
        buyerLastName: order.lastName,
        fullAddress: order.fullAddress,
        base: calcMatrah(totalNetVat, order.ordersList[0]!.vatRate),
        paymentPrice: totalPriceWithVat,
        invoiceType: InvoiceType.SATIS,
        country: EInvoiceCountry.TURKIYE,
        currency: EInvoiceCurrencyType.TURK_LIRASI,
        productsTotalPrice: totalPriceWithoutVat,
        includedTaxesTotalPrice: totalPriceWithVat,
        date: order.orderDate.localDate,
        time: `${pad(order.orderDate.hours)}:${pad(
          order.orderDate.minutes
        )}:${pad(order.orderDate.seconds)}`,
        taxOffice: order.taxOffice ? order.taxOffice : undefined,
        buyerTitle: order.companyName ? order.companyName : undefined,
        taxOrIdentityNumber: order.VKN ? order.VKN : undefined,
        products: ordersList,
      };
    }

    try {
      const result = await EInvoice.createDraftInvoice(payload);

      // Just in case
      await sleep(500);

      console.log("Oluşturulan faturanın UUID'i:", result);

      const invoiceHTML: string = await EInvoice.getInvoiceHtml(
        result
        // false, // Faturanın onay durumu: varsayılan true
        // true // window.print() komutunu html çıktısına ekler: varsayılan false
      );

      const fileName = `${order.fullName}-${order.packageNumber}-${pad(
        order.orderDate.hours
      )}.${pad(order.orderDate.minutes)}`;

      fs.writeFile(`${htmlFolderPath}/${fileName}.html`, invoiceHTML, (err) => {
        if (err) {
          return console.log(err);
        }
      });

      invoices.push({
        id: result,
        packageNumber: order.packageNumber,
        fullName: order.fullName,
        isExport: order.isExport,
        orderTimestamp: order.orderDate.orderTimestamp,
        fileName: `${fileName}.pdf`,
        folderPath: `${pdfFolderPath}/`,
        filePath: `${pdfFolderPath}/${fileName}.pdf`,
        deliveryNumber: order.deliveryNumber,
      });
    } catch (e) {
      logger.error(`Fatura oluştururkan hata oluştu`, {
        error: e,
        order,
      });

      console.error(e, order);
      errors.push(`${order.fullName} - ${order.packageNumber} - ${e}`);

      if (e instanceof EInvoiceTypeError) {
        logger.error("Tür hatası meydana geldi:", e);
      } else if (e instanceof EInvoiceApiError) {
        const response = e.getResponse();

        console.error(response);

        switch (e.errorCode) {
          case EInvoiceApiErrorCode.UNKNOWN_ERROR:
            logger.error(`Bilinmeyen bir hata oluştu`, {
              response,
              order,
            });
            break;
          case EInvoiceApiErrorCode.INVALID_RESPONSE:
            logger.error(`Geçersiz API cevabı`, { response, order });
            break;
          case EInvoiceApiErrorCode.INVALID_ACCESS_TOKEN:
            logger.error(`Geçersiz erişim jetonu`, { response, order });
            break;
          case EInvoiceApiErrorCode.BASIC_INVOICE_NOT_CREATED:
            logger.error(`Basit fatura oluşturulamadı`, { response, order });
          // ...
        }
      } else if (axios.isAxiosError(e)) {
        logger.error(`Axios hatası meydana geldi`, e);
      } else {
        logger.error(`Bilinmeyen bir hata meydana geldi`, e);
      }
    } finally {
      if (errors.length > 0) {
        logger.info(`${errors.length} errors occured`, errors);
      } else {
        logger.info("No errors occured ;)");
      }
    }
  }

  // e-Arşiv oturumunu sonlandırır.
  await EInvoice.logout();

  await sleep(2000);

  try {
    InvoiceScheme.array().parse(invoices);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(error.message, error);
    }
  }

  fs.writeFile(
    `./data/${company}/${date}/invoices.json`,
    JSON.stringify(invoices),
    (err) => {
      if (err) {
        logger.error(err);
      }
    }
  );
}
