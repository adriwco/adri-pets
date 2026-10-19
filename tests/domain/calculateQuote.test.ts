import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  occupiedDates,
  type QuoteInput,
  type QuotePetInput,
} from "../../src/domain/calculateQuote";
import { siteConfig } from "../../src/config/site.config";
import type { PetSize } from "../../src/domain/types";
import { SPEC_TODAY, specQuoteConfig } from "./fixtures";

const pet = (size: PetSize, specialCare = false): QuotePetInput => ({ name: size, size, specialCare });

function input(overrides: Partial<QuoteInput>): QuoteInput {
  return {
    serviceType: "HOSPEDAGEM",
    checkInDate: "2026-03-10",
    checkOutDate: "2026-03-13",
    checkOutMinutes: 600,
    pets: [pet("PEQUENO")],
    today: SPEC_TODAY,
    ...overrides,
  };
}

interface Expected {
  subtotal: number;
  longStay: number;
  late: number;
  specialCare: number;
  total: number;
  deposit: number;
  balance: number;
}

const scenarios: [string, Partial<QuoteInput>, Expected][] = [
  ["C01", { checkInDate: "2026-03-10", checkOutDate: "2026-03-13", pets: [pet("PEQUENO")] }, { subtotal: 16500, longStay: 0, late: 0, specialCare: 0, total: 16500, deposit: 8250, balance: 8250 }],
  ["C02", { checkInDate: "2026-03-10", checkOutDate: "2026-03-12", pets: [pet("PEQUENO"), pet("GRANDE")] }, { subtotal: 26000, longStay: 0, late: 0, specialCare: 0, total: 26000, deposit: 13000, balance: 13000 }],
  ["C03", { checkInDate: "2026-03-10", checkOutDate: "2026-03-11", pets: [pet("MEDIO"), pet("PEQUENO"), pet("GIGANTE")] }, { subtotal: 20000, longStay: 0, late: 0, specialCare: 0, total: 20000, deposit: 10000, balance: 10000 }],
  ["C04", { checkInDate: "2026-03-01", checkOutDate: "2026-03-08", pets: [pet("MEDIO")] }, { subtotal: 45500, longStay: 2275, late: 0, specialCare: 0, total: 43225, deposit: 21613, balance: 21612 }],
  ["C05", { checkInDate: "2026-03-01", checkOutDate: "2026-03-07", pets: [pet("MEDIO")] }, { subtotal: 39000, longStay: 0, late: 0, specialCare: 0, total: 39000, deposit: 19500, balance: 19500 }],
  ["C06", { checkInDate: "2026-03-01", checkOutDate: "2026-03-16", pets: [pet("GRANDE")] }, { subtotal: 120000, longStay: 12000, late: 0, specialCare: 0, total: 108000, deposit: 54000, balance: 54000 }],
  ["C07", { checkInDate: "2026-03-01", checkOutDate: "2026-03-15", pets: [pet("GRANDE")] }, { subtotal: 112000, longStay: 5600, late: 0, specialCare: 0, total: 106400, deposit: 53200, balance: 53200 }],
  ["C08", { checkInDate: "2026-12-20", checkOutDate: "2026-12-24", pets: [pet("PEQUENO")] }, { subtotal: 25300, longStay: 0, late: 0, specialCare: 0, total: 25300, deposit: 12650, balance: 12650 }],
  ["C09", { checkInDate: "2026-12-16", checkOutDate: "2026-12-23", pets: [pet("PEQUENO")] }, { subtotal: 40150, longStay: 1650, late: 0, specialCare: 0, total: 38500, deposit: 19250, balance: 19250 }],
  ["C11", { checkInDate: "2026-12-30", checkOutDate: "2027-01-03", pets: [pet("PEQUENO")] }, { subtotal: 29700, longStay: 0, late: 0, specialCare: 0, total: 29700, deposit: 14850, balance: 14850 }],
  ["C12", { checkInDate: "2026-12-24", checkOutDate: "2026-12-25", pets: [pet("PEQUENO")] }, { subtotal: 7150, longStay: 0, late: 0, specialCare: 0, total: 7150, deposit: 3575, balance: 3575 }],
  ["C13", { checkInDate: "2026-03-10", checkOutDate: "2026-03-12", checkOutMinutes: 720, pets: [pet("MEDIO")] }, { subtotal: 13000, longStay: 0, late: 0, specialCare: 0, total: 13000, deposit: 6500, balance: 6500 }],
  ["C14", { checkInDate: "2026-03-10", checkOutDate: "2026-03-12", checkOutMinutes: 721, pets: [pet("MEDIO")] }, { subtotal: 13000, longStay: 0, late: 3250, specialCare: 0, total: 16250, deposit: 8125, balance: 8125 }],
  ["C15", { checkInDate: "2026-03-10", checkOutDate: "2026-03-12", checkOutMinutes: 1080, pets: [pet("MEDIO")] }, { subtotal: 13000, longStay: 0, late: 3250, specialCare: 0, total: 16250, deposit: 8125, balance: 8125 }],
  ["C16", { checkInDate: "2026-03-10", checkOutDate: "2026-03-12", checkOutMinutes: 1081, pets: [pet("MEDIO")] }, { subtotal: 13000, longStay: 0, late: 6500, specialCare: 0, total: 19500, deposit: 9750, balance: 9750 }],
  ["C17", { checkInDate: "2026-12-22", checkOutDate: "2026-12-24", checkOutMinutes: 900, pets: [pet("PEQUENO")] }, { subtotal: 14300, longStay: 0, late: 3575, specialCare: 0, total: 17875, deposit: 8938, balance: 8937 }],
  ["C18", { checkInDate: "2026-03-10", checkOutDate: "2026-03-13", pets: [pet("PEQUENO", true)] }, { subtotal: 16500, longStay: 0, late: 0, specialCare: 3000, total: 19500, deposit: 9750, balance: 9750 }],
  ["C19", { serviceType: "CRECHE", checkInDate: "2026-03-10", checkOutDate: "2026-03-10", pets: [pet("GRANDE")] }, { subtotal: 4000, longStay: 0, late: 0, specialCare: 0, total: 4000, deposit: 2000, balance: 2000 }],
  ["C20", { serviceType: "CRECHE", checkInDate: "2026-03-10", checkOutDate: "2026-03-10", pets: [pet("PEQUENO"), pet("GRANDE"), pet("MEDIO")] }, { subtotal: 10500, longStay: 0, late: 0, specialCare: 0, total: 10500, deposit: 5250, balance: 5250 }],
  ["C21", { checkInDate: "2026-03-10", checkOutDate: "2026-03-11", pets: [pet("MEDIO"), pet("MEDIO")] }, { subtotal: 12500, longStay: 0, late: 0, specialCare: 0, total: 12500, deposit: 6250, balance: 6250 }],
  ["C22", { checkInDate: "2026-03-01", checkOutDate: "2026-03-16", pets: [pet("PEQUENO"), pet("PEQUENO"), pet("PEQUENO")] }, { subtotal: 225000, longStay: 22500, late: 0, specialCare: 0, total: 202500, deposit: 101250, balance: 101250 }],
];

describe("calculateQuote: cenários de referência da §5.6", () => {
  it.each(scenarios)("%s", (_id, overrides, expected) => {
    const outcome = calculateQuote(input(overrides), specQuoteConfig);
    if (!outcome.ok) {
      throw new Error(`erro inesperado: ${outcome.code}`);
    }
    const { quote } = outcome;
    expect({
      subtotal: quote.subtotalCents,
      longStay: quote.longStayDiscountCents,
      late: quote.lateFeeCents,
      specialCare: quote.specialCareCents,
      total: quote.totalCents,
      deposit: quote.depositCents,
      balance: quote.balanceCents,
    }).toEqual(expected);
  });
});

const realScenarios: [string, Partial<QuoteInput>, number, number][] = [
  ["R01", { checkInDate: "2026-03-10", checkOutDate: "2026-03-13", pets: [pet("GRANDE")] }, 13500, 0],
  ["R02", { checkInDate: "2026-03-10", checkOutDate: "2026-03-13", pets: [pet("GRANDE"), pet("PEQUENO")] }, 27000, 0],
  ["R03", { checkInDate: "2026-03-10", checkOutDate: "2026-03-11", pets: [pet("GRANDE"), pet("PEQUENO"), pet("MEDIO")] }, 13000, 0],
  ["R04", { checkInDate: "2026-03-01", checkOutDate: "2026-03-08", pets: [pet("GRANDE"), pet("PEQUENO"), pet("MEDIO")] }, 86450, 4550],
  ["R05", { checkInDate: "2026-03-01", checkOutDate: "2026-03-16", pets: [pet("GRANDE")] }, 60750, 6750],
  ["R06", { checkInDate: "2026-03-10", checkOutDate: "2026-03-12", checkOutMinutes: 1439, pets: [pet("GRANDE")] }, 9000, 0],
  ["R07", { checkInDate: "2026-03-10", checkOutDate: "2026-03-13", pets: [pet("GRANDE", true)] }, 16500, 0],
  ["R08", { checkInDate: "2026-12-23", checkOutDate: "2026-12-25", pets: [pet("GRANDE")] }, 11700, 0],
  ["R09", { checkInDate: "2026-12-31", checkOutDate: "2027-01-01", pets: [pet("GRANDE"), pet("PEQUENO"), pet("MEDIO")] }, 17550, 0],
  ["R10", { serviceType: "CRECHE", checkInDate: "2026-03-10", checkOutDate: "2026-03-10", pets: [pet("GRANDE")] }, 4000, 0],
  ["R11", { serviceType: "CRECHE", checkInDate: "2026-03-10", checkOutDate: "2026-03-10", pets: [pet("GRANDE"), pet("PEQUENO"), pet("MEDIO")] }, 11500, 0],
];

describe("calculateQuote: cenários com a configuração real (§5.6B)", () => {
  const realConfig = {
    prices: siteConfig.prices,
    rules: siteConfig.rules,
    seasonalRules: siteConfig.seasonalRules,
    maxPetsPerBooking: siteConfig.capacity.maxPetsPerBooking,
  };

  it.each(realScenarios)("%s", (_id, overrides, total, longStay) => {
    const outcome = calculateQuote(input({ checkOutMinutes: 600, ...overrides }), realConfig);
    if (!outcome.ok) {
      throw new Error(`erro inesperado: ${outcome.code}`);
    }
    expect([outcome.quote.totalCents, outcome.quote.longStayDiscountCents, outcome.quote.lateFeeCents]).toEqual([
      total,
      longStay,
      0,
    ]);
  });
});

describe("calculateQuote: detalhes", () => {
  it("ordena os pets pelo maior porte e aplica o desconto do 2º e do 3º", () => {
    const outcome = calculateQuote(input({ pets: [pet("PEQUENO"), pet("GIGANTE"), pet("MEDIO")] }), specQuoteConfig);
    expect(outcome.ok && outcome.quote.pets.map((p) => [p.size, p.multiPetDiscountCents, p.inputIndex])).toEqual([
      ["GIGANTE", 0, 1],
      ["MEDIO", 500, 2],
      ["PEQUENO", 1000, 0],
    ]);
  });

  it("classifica a saída tardia pelas faixas de horário", () => {
    const kind = (minutes: number) => {
      const outcome = calculateQuote(input({ checkOutMinutes: minutes }), specQuoteConfig);
      return outcome.ok ? outcome.quote.lateCheckoutKind : outcome.code;
    };
    expect([kind(720), kind(721), kind(1080), kind(1081)]).toEqual(["NENHUM", "MEIA", "MEIA", "INTEIRA"]);
  });

  it("lista as temporadas que afetaram o orçamento", () => {
    const outcome = calculateQuote(input({ checkInDate: "2026-12-23", checkOutDate: "2026-12-25" }), specQuoteConfig);
    expect(outcome.ok && outcome.quote.seasonNames).toEqual(["Natal", "Véspera"]);
  });

  it("omite sinal e restante quando não há sinal configurado", () => {
    const config = { ...specQuoteConfig, prices: { ...specQuoteConfig.prices, depositPct: null } };
    const outcome = calculateQuote(input({}), config);
    expect(outcome.ok && [outcome.quote.depositCents, outcome.quote.balanceCents]).toEqual([null, null]);
  });

  it("dá as datas ocupadas, incluindo o dia de saída quando há saída tardia", () => {
    const base = input({ checkInDate: "2026-03-10", checkOutDate: "2026-03-12" });
    const normal = calculateQuote(base, specQuoteConfig);
    const late = calculateQuote({ ...base, checkOutMinutes: 900 }, specQuoteConfig);
    const daycare = calculateQuote(
      input({ serviceType: "CRECHE", checkInDate: "2026-03-10", checkOutDate: "2026-03-10" }),
      specQuoteConfig,
    );
    expect(normal.ok && occupiedDates(normal.quote, "2026-03-10", "2026-03-12")).toEqual(["2026-03-10", "2026-03-11"]);
    expect(late.ok && occupiedDates(late.quote, "2026-03-10", "2026-03-12")).toEqual([
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
    ]);
    expect(daycare.ok && occupiedDates(daycare.quote, "2026-03-10", "2026-03-10")).toEqual(["2026-03-10"]);
  });
});

describe("calculateQuote: erros", () => {
  const errorCases: [string, Partial<QuoteInput>, typeof specQuoteConfig | undefined, string][] = [
    ["4 pets", { pets: [pet("PEQUENO"), pet("PEQUENO"), pet("PEQUENO"), pet("PEQUENO")] }, undefined, "MAX_PETS"],
    ["sem pets", { pets: [] }, undefined, "SEM_PETS"],
    ["saída igual à entrada", { checkOutDate: "2026-03-10" }, undefined, "DATAS_INVALIDAS"],
    ["saída antes da entrada", { checkOutDate: "2026-03-09" }, undefined, "DATAS_INVALIDAS"],
    ["data inexistente", { checkInDate: "2026-02-30" }, undefined, "DATAS_INVALIDAS"],
    ["entrada no passado", { checkInDate: "2026-01-14", checkOutDate: "2026-01-16" }, undefined, "DATA_NO_PASSADO"],
    ["além do horizonte", { checkInDate: "2027-01-16", checkOutDate: "2027-01-18" }, undefined, "FORA_DO_HORIZONTE"],
    ["noites acima do máximo", { checkInDate: "2026-03-01", checkOutDate: "2026-05-01" }, undefined, "MAX_NOITES"],
    [
      "noites abaixo do mínimo",
      { checkInDate: "2026-03-10", checkOutDate: "2026-03-11" },
      { ...specQuoteConfig, rules: { ...specQuoteConfig.rules, minNights: 2 } },
      "MIN_NOITES",
    ],
    ["horário inválido", { checkOutMinutes: 1440 }, undefined, "HORARIO_INVALIDO"],
    [
      "creche fora do horário",
      { serviceType: "CRECHE", checkOutDate: "2026-03-10", checkOutMinutes: 1140 },
      undefined,
      "HORARIO_CRECHE",
    ],
    ["creche em dias diferentes", { serviceType: "CRECHE", checkOutMinutes: 1000 }, undefined, "DATAS_INVALIDAS"],
    [
      "creche desativada",
      { serviceType: "CRECHE", checkOutDate: "2026-03-10", checkOutMinutes: 1000 },
      { ...specQuoteConfig, rules: { ...specQuoteConfig.rules, daycareEnabled: false } },
      "CRECHE_INDISPONIVEL",
    ],
  ];

  it.each(errorCases)("%s", (_name, overrides, config, code) => {
    expect(calculateQuote(input(overrides), config ?? specQuoteConfig)).toEqual({ ok: false, code });
  });

  it("aceita a entrada no último dia do horizonte", () => {
    expect(calculateQuote(input({ checkInDate: "2027-01-15", checkOutDate: "2027-01-16" }), specQuoteConfig).ok).toBe(
      true,
    );
  });
});

describe("calculateQuote: propriedades", () => {
  const sizeArb = fc.constantFrom<PetSize>("PEQUENO", "MEDIO", "GRANDE", "GIGANTE");
  const stayArb = fc.record({
    offset: fc.integer({ min: 0, max: 360 }),
    nights: fc.integer({ min: 1, max: 60 }),
    minutes: fc.integer({ min: 0, max: 1439 }),
    pets: fc.array(fc.record({ size: sizeArb, specialCare: fc.boolean() }), { minLength: 1, maxLength: 3 }),
  });

  interface Stay {
    offset: number;
    nights: number;
    minutes: number;
    pets: { size: PetSize; specialCare: boolean }[];
  }

  const build = (stay: Stay): QuoteInput => {
    const checkIn = new Date(Date.UTC(2026, 0, 15 + stay.offset)).toISOString().slice(0, 10);
    const checkOut = new Date(Date.UTC(2026, 0, 15 + stay.offset + stay.nights)).toISOString().slice(0, 10);
    return input({
      checkInDate: checkIn,
      checkOutDate: checkOut,
      checkOutMinutes: stay.minutes,
      pets: stay.pets.map((p) => ({ name: p.size, ...p })),
    });
  };

  it("sinal + restante = total, total ≥ 0 e desconto ≤ subtotal", () => {
    fc.assert(
      fc.property(stayArb, (stay) => {
        const outcome = calculateQuote(build(stay), specQuoteConfig);
        if (!outcome.ok) {
          return false;
        }
        const { quote } = outcome;
        return (
          (quote.depositCents ?? 0) + (quote.balanceCents ?? 0) === quote.totalCents &&
          quote.totalCents >= 0 &&
          quote.longStayDiscountCents <= quote.subtotalCents
        );
      }),
      { numRuns: 200 },
    );
  });

  it("a ordem em que os pets são informados não muda o total", () => {
    fc.assert(
      fc.property(stayArb, (stay) => {
        const forward = calculateQuote(build(stay), specQuoteConfig);
        const reversed = calculateQuote(build({ ...stay, pets: [...stay.pets].reverse() }), specQuoteConfig);
        return forward.ok && reversed.ok && forward.quote.totalCents === reversed.quote.totalCents;
      }),
      { numRuns: 200 },
    );
  });

  it("é determinístico", () => {
    fc.assert(
      fc.property(stayArb, (stay) => {
        expect(calculateQuote(build(stay), specQuoteConfig)).toEqual(calculateQuote(build(stay), specQuoteConfig));
      }),
      { numRuns: 200 },
    );
  });

  it("uma noite a mais fora de temporada nunca diminui o subtotal", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 59 }), sizeArb, (nights, size) => {
        const shorter = calculateQuote(
          input({ checkInDate: "2026-02-01", checkOutDate: addIso("2026-02-01", nights), pets: [pet(size)] }),
          specQuoteConfig,
        );
        const longer = calculateQuote(
          input({ checkInDate: "2026-02-01", checkOutDate: addIso("2026-02-01", nights + 1), pets: [pet(size)] }),
          specQuoteConfig,
        );
        return shorter.ok && longer.ok && longer.quote.subtotalCents >= shorter.quote.subtotalCents;
      }),
      { numRuns: 200 },
    );
  });
});

function addIso(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days)).toISOString().slice(0, 10);
}
