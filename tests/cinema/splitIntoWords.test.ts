import { describe, expect, it } from "vitest";
import { splitIntoWords } from "../../src/cinema/splitIntoWords";

describe("splitIntoWords", () => {
  it("separa as palavras com a posição de cada uma", () => {
    expect(splitIntoWords("Seu cão em casa")).toEqual([
      { word: "Seu", index: 0 },
      { word: "cão", index: 1 },
      { word: "em", index: 2 },
      { word: "casa", index: 3 },
    ]);
  });

  it("ignora espaços repetidos e nas pontas", () => {
    expect(splitIntoWords("  como   se  ").map(({ word }) => word)).toEqual(["como", "se"]);
  });

  it("devolve lista vazia para texto vazio", () => {
    expect(splitIntoWords("   ")).toEqual([]);
  });
});
