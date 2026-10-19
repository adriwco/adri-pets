import { minutesToTime } from "./dates";
import type { RulesConfig } from "./types";

const LAST_MINUTE_OF_DAY = 1439;

export function checkoutRuleText(rules: RulesConfig): string {
  if (rules.checkOutLimitMinutes >= LAST_MINUTE_OF_DAY) {
    return "Saída até meia-noite, sem custo extra.";
  }
  return `Saída até ${minutesToTime(rules.checkOutLimitMinutes)}; depois disso, até ${minutesToTime(rules.lateCheckoutLimitMinutes)} é meia diária.`;
}

export function arrivalRuleText(rules: RulesConfig): string {
  if (rules.checkInEndMinutes >= LAST_MINUTE_OF_DAY) {
    return `Chegada a partir das ${minutesToTime(rules.checkInStartMinutes)}, antes da meia-noite.`;
  }
  return `Chegada das ${minutesToTime(rules.checkInStartMinutes)} às ${minutesToTime(rules.checkInEndMinutes)}.`;
}

export function daycareRuleText(rules: RulesConfig): string {
  const end =
    rules.daycareEndMinutes >= LAST_MINUTE_OF_DAY ? "até meia-noite" : `até as ${minutesToTime(rules.daycareEndMinutes)}`;
  return `Creche: chegada a partir das ${minutesToTime(rules.daycareStartMinutes)} e saída ${end}.`;
}
