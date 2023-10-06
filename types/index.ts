import { z } from "zod";
import { COMPANIES, EXPORT_TYPE } from "../lib/variables";

// const OrderCommericalScheme = z.discriminatedUnion("isCommercial", [
//   z.object({
//     isCommercial: z.literal(false),
//   }),
//   z.object({
//     isCommercial: z.literal(true),
//     VKN: z.string(),
//     companyName: z.string(),
//     taxOffice: z.string(),
//   }),
// ]);

// TODO: .regex the string
// TODO: Refine

export const OrderScheme = z.object({
  packageNumber: z.number(),
  orderNumber: z.string(),
  deliveryNumber: z.string().optional(), // Hepsiburada
  orderDate: z.object({
    orderTimestamp: z.number(),
    year: z.number(),
    month: z.number(),
    day: z.number(),
    hours: z.number(),
    minutes: z.number(),
    seconds: z.number(),
    localDate: z.string(),
  }),
  fullName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullAddress: z.string(),
  isCommercial: z.boolean(),
  isExport: z.boolean(),
  exportType: z.enum(EXPORT_TYPE),
  ordersList: z.array(
    z.object({
      quantity: z.number(),
      vatRate: z.number(),
      priceWithVat: z.number(),
      priceWithoutVat: z.number(),
      vatAmount: z.number(),
    })
  ),
  // isCommercial
  VKN: z.string(),
  companyName: z.string(),
  taxOffice: z.string(),
});
// .and(OrderCommericalScheme);

export type Order = z.infer<typeof OrderScheme>;
export type Companies = typeof COMPANIES;

export const InvoiceScheme = z.object({
  id: z.string(),
  packageNumber: z.number(),
  orderTimestamp: z.number(),
  isExport: z.boolean(),
  fullName: z.string(),
  fileName: z.string(),
  folderPath: z.string(),
  filePath: z.string(),
  deliveryNumber: z.string().optional(),
});

export type Invoice = z.infer<typeof InvoiceScheme>;
