import { describe, expect, it } from "vitest";
import { checkAvailability } from "../../src/domain/availability";

describe("checkAvailability", () => {
  it("separa datas lotadas e de última vaga", () => {
    expect(
      checkAvailability(["2026-12-23", "2026-12-24", "2026-12-25"], ["2026-12-24"], ["2026-12-23", "2026-12-24"]),
    ).toEqual({ fullDates: ["2026-12-24"], fewSlotsDates: ["2026-12-23"] });
  });

  it("não acusa nada quando não há interseção", () => {
    expect(checkAvailability(["2026-03-10"], ["2026-12-24"], [])).toEqual({ fullDates: [], fewSlotsDates: [] });
  });
});
