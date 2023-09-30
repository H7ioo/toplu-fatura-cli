import z from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  TRENDYOL_EMAIL: z.string().email().nonempty(),
  TRENDYOL_PASSWORD: z.string().nonempty(),
  HEPSIBURADA_EMAIL: z.string().email().nonempty(),
  HEPSIBURADA_PASSWORD: z.string().nonempty(),
  EARSIV_USERNAME: z.string().nonempty(),
  EARSIV_PASSWORD: z.string().nonempty(),
  LOG_LEVEL: z.string().optional(),
});

export const env = envSchema.parse({
  TRENDYOL_EMAIL: process.env.TRENDYOL_EMAIL,
  TRENDYOL_PASSWORD: process.env.TRENDYOL_PASSWORD,
  HEPSIBURADA_EMAIL: process.env.HEPSIBURADA_EMAIL,
  HEPSIBURADA_PASSWORD: process.env.HEPSIBURADA_PASSWORD,
  EARSIV_USERNAME: process.env.EARSIV_USERNAME,
  EARSIV_PASSWORD: process.env.EARSIV_PASSWORD,
  LOG_LEVEL: process.env.LOG_LEVEL,
});
