import { describe, expect, it } from "vitest";
import { parseCssColor } from "../../src/cinema/parseCssColor";

describe("parseCssColor", () => {
  it("converte hexadecimal longo e curto para canais entre 0 e 1", () => {
    expect(parseCssColor("#ff8000")).toEqual([1, 128 / 255, 0]);
    expect(parseCssColor(" #FFF ")).toEqual([1, 1, 1]);
  });

  it("converte rgb e rgba com vírgulas ou espaços", () => {
    expect(parseCssColor("rgb(255, 0, 51)")).toEqual([1, 0, 51 / 255]);
    expect(parseCssColor("rgba(0 255 0 / 50%)")).toEqual([0, 1, 0]);
  });

  it("limita canais acima de 255", () => {
    expect(parseCssColor("rgb(300, 0, 0)")).toEqual([1, 0, 0]);
  });

  it("devolve nulo para formatos que não sabe ler", () => {
    expect(parseCssColor("")).toBeNull();
    expect(parseCssColor("color-mix(in srgb, red, blue)")).toBeNull();
    expect(parseCssColor("#12345")).toBeNull();
  });
});
