import { describe, expect, it } from "vitest";
import { shouldStartCinema } from "../../src/cinema/shouldStartCinema";

describe("shouldStartCinema", () => {
  it("liga a camada cinematográfica quando não há restrição", () => {
    expect(shouldStartCinema({ prefersReducedMotion: false, saveData: false })).toBe(true);
  });

  it("respeita quem pediu menos movimento", () => {
    expect(shouldStartCinema({ prefersReducedMotion: true, saveData: false })).toBe(false);
  });

  it("respeita a economia de dados", () => {
    expect(shouldStartCinema({ prefersReducedMotion: false, saveData: true })).toBe(false);
  });
});
