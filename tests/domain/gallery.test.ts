import { describe, expect, it } from "vitest";
import { sortGallery } from "../../src/domain/gallery";

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
