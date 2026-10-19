import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  cardOptions,
  cardTotalCents,
  installmentOptions,
  optionsForMessage,
  singlePaymentOptions,
} from "../../src/domain/cardSurcharge";
import { specCardFees } from "./fixtures";

const table = [
  { pix: 16500, totals: [16836, 17365, 18130, 18964], installment3x: 6044, installment6x: 3161 },
  { pix: 25350, totals: [25865, 26679, 27855, 29135] },
  { pix: 19425, totals: [19820, 20444, 21344, 22326] },
  { pix: 4000, totals: [4082, 4210, 4396, 4598] },
];

describe("cardOptions: tabela da §5.7", () => {
  it.each(table)("total PIX $pix", ({ pix, totals, installment3x, installment6x }) => {
    const options = cardOptions(pix, specCardFees);
    expect(options.map((option) => option.totalCents)).toEqual(totals);
    if (installment3x !== undefined) {
      expect(options[2]?.installmentCents).toBe(installment3x);
    }
    if (installment6x !== undefined) {
      expect(options[3]?.installmentCents).toBe(installment6x);
    }
  });
});

describe("cardTotalCents", () => {
  it("sem taxa, cobra o mesmo valor do PIX", () => {
    expect(cardTotalCents(16500, 0)).toBe(16500);
  });

  it("o líquido nunca fica abaixo do PIX e 1 centavo a menos já ficaria", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5_000_000 }), fc.integer({ min: 1, max: 5000 }), (pix, bp) => {
        const gross = cardTotalCents(pix, bp);
        const netTimes10k = (value: number) => value * (10_000 - bp);
        return netTimes10k(gross) >= pix * 10_000 && netTimes10k(gross - 1) < pix * 10_000;
      }),
      { numRuns: 500 },
    );
  });
});

describe("seleção de opções", () => {
  const options = cardOptions(16500, specCardFees);

  it("separa pagamento único de parcelado", () => {
    expect(singlePaymentOptions(options).map((option) => option.id)).toEqual(["debito", "credito-1x"]);
    expect(installmentOptions(options).map((option) => option.id)).toEqual(["credito-3x", "credito-6x"]);
  });

  it("na mensagem vão o débito, o crédito à vista e só o parcelamento escolhido", () => {
    expect(optionsForMessage(options, null).map((option) => option.id)).toEqual(["debito", "credito-1x"]);
    expect(optionsForMessage(options, 6).map((option) => option.id)).toEqual(["debito", "credito-1x", "credito-6x"]);
  });
});
