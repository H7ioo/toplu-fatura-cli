import { Companies } from "../../types";
import { hepsiburadaUpload } from "./hepsiburada";
import { trendyolUpload } from "./trendyol";

export const uploadWrapper: Record<
  Companies[number],
  (date: string) => Promise<void>
> = {
  trendyol: trendyolUpload,
  hepsiburada: hepsiburadaUpload,
};
