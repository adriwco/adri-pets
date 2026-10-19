import { describe, expect, it } from "vitest";
import { ceilDiv, formatCurrency, roundDiv } from "../../src/domain/money";

describe("money", () => {
  it("roundDiv arredonda meio para cima", () => {
    expect([roundDiv(5, 2), roundDiv(4, 2), roundDiv(7, 3), roundDiv(8, 3)]).toEqual([3, 2, 2, 3]);
  });

  it("ceilDiv arredonda sempre para cima", () => {
    expect([ceilDiv(10, 5), ceilDiv(11, 5), ceilDiv(0, 5)]).toEqual([2, 3, 0]);
  });

  it("formatCurrency usa o padrão brasileiro", () => {
    expect([formatCurrency(16500), formatCurrency(5), formatCurrency(123456789), formatCurrency(-250)]).toEqual([
      "R$ 165,00",
      "R$ 0,05",
      "R$ 1.234.567,89",
      "-R$ 2,50",
    ]);
  });
});
