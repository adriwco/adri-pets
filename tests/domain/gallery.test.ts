import { describe, expect, it } from "vitest";
import { sortGallery, stepIndex, swipeDirection } from "../../src/domain/gallery";

const items = [
  { petName: "Thor", takenAt: "2026-06-27" },
  { petName: "Jack", takenAt: "2026-01-10", order: 2 },
  { petName: "Ruffos", takenAt: "2026-11-02" },
  { petName: "Kiara", takenAt: "2025-03-01", order: 1 },
  { petName: "Bolt", takenAt: "2026-08-01" },
  { petName: "Chico e Juju", takenAt: "2026-08-01" },
];

describe("sortGallery", () => {
  it("coloca primeiro as fotos com ordem fixa e depois as mais recentes, desempatando pelo nome", () => {
    expect(sortGallery(items).map((item) => item.petName)).toEqual(["Kiara", "Jack", "Ruffos", "Bolt", "Chico e Juju", "Thor"]);
  });

  it("não altera a lista original", () => {
    const copy = [...items];
    sortGallery(items);
    expect(items).toEqual(copy);
  });
});

describe("stepIndex", () => {
  it("avança e volta dando a volta nas pontas", () => {
    expect([stepIndex(0, 1, 5), stepIndex(4, 1, 5), stepIndex(0, -1, 5), stepIndex(2, -1, 5)]).toEqual([1, 0, 4, 1]);
  });

  it("fica no zero com a lista vazia", () => {
    expect(stepIndex(0, 1, 0)).toBe(0);
  });
});

describe("swipeDirection", () => {
  it("arrastar para a esquerda mostra a próxima e para a direita a anterior", () => {
    expect([swipeDirection(-80, 10), swipeDirection(80, -10)]).toEqual([1, -1]);
  });

  it("ignora toque curto e arrasto mais vertical que horizontal", () => {
    expect([swipeDirection(-30, 0), swipeDirection(-80, 120)]).toEqual([0, 0]);
  });
});
