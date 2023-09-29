import { Companies } from "../../types";
import { trendyolCollect } from "./trendyol";

export const collectWrapper: Record<Companies[number], () => Promise<void>> = {
  trendyol: trendyolCollect,
  hepsiburada: async () => undefined,
};
