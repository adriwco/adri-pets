import { describe, expect, it } from "vitest";
import { siteConfig } from "../../src/config/site.config";
import { parseSiteConfig } from "../../src/domain/configSchema";
import type { SiteConfig } from "../../src/domain/types";

function broken(mutate: (config: SiteConfig) => void): () => SiteConfig {
  const copy = structuredClone(siteConfig);
  mutate(copy);
  return () => parseSiteConfig(copy);
}

describe("site.config.ts", () => {
  it("a configuração atual é válida", () => {
    expect(() => parseSiteConfig(structuredClone(siteConfig))).not.toThrow();
  });

  it.each<[string, (config: SiteConfig) => void]>([
    ["preço negativo", (c) => (c.prices.rateCents.PEQUENO = -5500)],
    ["preço com centavos quebrados", (c) => (c.prices.rateCents.MEDIO = 65.5)],
    ["percentual acima de 100", (c) => (c.prices.lateCheckoutPct = 150)],
    ["desconto do 3º pet maior que a diária", (c) => (c.prices.thirdPetDiscountCents = 4500)],
    ["creche sem valor", (c) => (c.prices.daycareRateCents = 0)],
    ["telefone com +", (c) => (c.business.whatsappE164 = "+5585999999999")],
    ["telefone sem DDI", (c) => (c.business.whatsappE164 = "85999999999")],
    ["cor inválida", (c) => (c.business.primaryColorHex = "verde")],
    ["data lotada inexistente", (c) => (c.fullDates = ["2026-02-30"])],
    ["data em formato brasileiro", (c) => (c.fewSlotsDates = ["24/12/2026"])],
    [
      "temporada invertida",
      (c) =>
        (c.seasonalRules = [
          { name: "Natal", startDate: "2026-12-26", endDate: "2026-12-22", multiplierPct: 30, blocksLongStayDiscount: true },
        ]),
    ],
    [
      "taxa da maquininha acima de 50%",
      (c) => (c.cardBrands = [{ id: "b", label: "B", fees: [{ id: "x", label: "X", feeBasisPoints: 5001, installments: 1 }] }]),
    ],
    [
      "taxa com id repetido",
      (c) =>
        (c.cardBrands = [
          {
            id: "b",
            label: "B",
            fees: [
              { id: "x", label: "X", feeBasisPoints: 100, installments: 1 },
              { id: "x", label: "Y", feeBasisPoints: 200, installments: 1 },
            ],
          },
        ]),
    ],
    [
      "bandeira com id repetido",
      (c) => (c.cardBrands = [...c.cardBrands, { ...c.cardBrands[0]!, label: "Outra" }]),
    ],
    ["sem bandeira", (c) => (c.cardBrands = [])],
    ["mais de 3 pets", (c) => (c.capacity.maxPetsPerBooking = 4)],
    ["mínimo de noites maior que o máximo", (c) => (c.rules.minNights = 90)],
    ["horário da creche invertido", (c) => (c.rules.daycareStartMinutes = c.rules.daycareEndMinutes)],
  ])("falha com %s", (_name, mutate) => {
    expect(broken(mutate)).toThrow(/site\.config\.ts inválido/);
  });
});
