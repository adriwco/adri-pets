import { ceilDiv } from "./money";
import type { ServiceType } from "./types";

export const FOOD_MIN_GRAMS_PER_DAY = 10;
export const FOOD_MAX_GRAMS_PER_DAY = 2000;
const SAFETY_MARGIN_PCT = 115;

export interface FoodAmount {
  grams: number;
  kgLabel: string;
}

export function foodAmount(gramsPerDay: number, nights: number, serviceType: ServiceType): FoodAmount | null {
  if (!Number.isInteger(gramsPerDay) || gramsPerDay < FOOD_MIN_GRAMS_PER_DAY || gramsPerDay > FOOD_MAX_GRAMS_PER_DAY) {
    return null;
  }
  const foodDays = serviceType === "CRECHE" ? 1 : nights + 1;
  const grams = ceilDiv(gramsPerDay * foodDays * SAFETY_MARGIN_PCT, 100);
  const tenthsOfKg = ceilDiv(grams, 100);
  const kgLabel = `${Math.floor(tenthsOfKg / 10)},${tenthsOfKg % 10} kg`;
  return { grams, kgLabel };
}
