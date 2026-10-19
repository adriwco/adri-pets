import { describe, expect, it } from "vitest";
import { arrivalRuleText, checkoutRuleText, daycareRuleText } from "../../src/domain/rulesText";
import { specQuoteConfig } from "./fixtures";

describe("checkoutRuleText", () => {
  it("sem cobrança de saída tardia, diz que a saída vai até meia-noite", () => {
    expect(
      checkoutRuleText({ ...specQuoteConfig.rules, checkOutLimitMinutes: 1439, lateCheckoutLimitMinutes: 1439 }),
    ).toBe("Saída até meia-noite, sem custo extra.");
  });

  it("com meia diária, explica as faixas de horário", () => {
    expect(checkoutRuleText(specQuoteConfig.rules)).toBe("Saída até 12:00; depois disso, até 18:00 é meia diária.");
  });
});

describe("textos de chegada e creche", () => {
  const anytime = { ...specQuoteConfig.rules, checkInStartMinutes: 480, checkInEndMinutes: 1439, daycareStartMinutes: 480, daycareEndMinutes: 1439 };

  it("chegada até antes da meia-noite", () => {
    expect(arrivalRuleText(anytime)).toBe("Chegada a partir das 08:00, antes da meia-noite.");
    expect(arrivalRuleText(specQuoteConfig.rules)).toBe("Chegada das 08:00 às 18:00.");
  });

  it("creche com saída até meia-noite ou até um horário", () => {
    expect(daycareRuleText(anytime)).toBe("Creche: chegada a partir das 08:00 e saída até meia-noite.");
    expect(daycareRuleText(specQuoteConfig.rules)).toBe("Creche: chegada a partir das 07:30 e saída até as 18:30.");
  });
});
