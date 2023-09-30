import { Companies } from "../../types";
import { hepsiburadaCollect } from "./hepsiburada";
import { trendyolCollect } from "./trendyol";

export const collectWrapper: Record<Companies[number], () => Promise<void>> = {
  trendyol: trendyolCollect,
  hepsiburada: hepsiburadaCollect,
};
