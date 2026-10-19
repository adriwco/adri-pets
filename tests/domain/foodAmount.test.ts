import { describe, expect, it } from "vitest";
import { foodAmount } from "../../src/domain/foodAmount";

describe("foodAmount", () => {
  it("segue os casos de referência da §9.2", () => {
    expect(foodAmount(300, 3, "HOSPEDAGEM")).toEqual({ grams: 1380, kgLabel: "1,4 kg" });
    expect(foodAmount(250, 7, "HOSPEDAGEM")).toEqual({ grams: 2300, kgLabel: "2,3 kg" });
  });

  it("na creche conta um dia", () => {
    expect(foodAmount(200, 0, "CRECHE")).toEqual({ grams: 230, kgLabel: "0,3 kg" });
  });

  it("recusa valores fora da faixa", () => {
    expect([foodAmount(9, 3, "HOSPEDAGEM"), foodAmount(2001, 3, "HOSPEDAGEM"), foodAmount(10.5, 3, "HOSPEDAGEM")]).toEqual(
      [null, null, null],
    );
  });
});
