import { Guide } from "@/types/guide";
import { iberdrolaGuide } from "./iberdrola-guide";
// import { naturgyGuide } from "./naturgy-guide";
// import { endesaGuide } from "./endesa-guide";

export const guides: Record<number, Guide> = {
  1: iberdrolaGuide,
};
