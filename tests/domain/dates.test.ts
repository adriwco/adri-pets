import { describe, expect, it } from "vitest";
import {
  addDays,
  diffDays,
  eachNight,
  formatDateBR,
  isValidIsoDate,
  minutesToTime,
  timeToMinutes,
  todayInTimeZone,
} from "../../src/domain/dates";

describe("dates", () => {
  it("valida datas reais", () => {
    expect([isValidIsoDate("2026-02-28"), isValidIsoDate("2026-02-29"), isValidIsoDate("2028-02-29")]).toEqual([
      true,
      false,
      true,
    ]);
    expect([isValidIsoDate("2026-1-01"), isValidIsoDate("")]).toEqual([false, false]);
  });

  it("soma e subtrai dias atravessando o ano", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(diffDays("2026-12-30", "2027-01-03")).toBe(4);
    expect(eachNight("2026-12-30", "2027-01-02")).toEqual(["2026-12-30", "2026-12-31", "2027-01-01"]);
    expect(eachNight("2026-03-10", "2026-03-10")).toEqual([]);
  });

  it("calcula o hoje no fuso de Fortaleza", () => {
    expect(todayInTimeZone(new Date("2026-03-11T02:30:00Z"), "America/Fortaleza")).toBe("2026-03-10");
    expect(todayInTimeZone(new Date("2026-03-11T03:00:00Z"), "America/Fortaleza")).toBe("2026-03-11");
  });

  it("formata data e horário", () => {
    expect(formatDateBR("2026-03-05")).toBe("05/03/2026");
    expect([minutesToTime(450), minutesToTime(1081)]).toEqual(["07:30", "18:01"]);
    expect([timeToMinutes("12:01"), timeToMinutes("24:00"), timeToMinutes("9:00")]).toEqual([721, null, null]);
  });
});
