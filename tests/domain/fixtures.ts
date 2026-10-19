import type { QuoteConfig } from "../../src/domain/calculateQuote";
import type { PetAnswers } from "../../src/domain/evaluateNotices";
import type { CardFee } from "../../src/domain/types";

export const specQuoteConfig: QuoteConfig = {
  maxPetsPerBooking: 3,
  prices: {
    rateCents: { PEQUENO: 5500, MEDIO: 6500, GRANDE: 8000, GIGANTE: 9500 },
    daycareRateCents: 4000,
    lateCheckoutPct: 50,
    secondPetDiscountCents: 500,
    thirdPetDiscountCents: 1000,
    specialCareDailyCents: 1000,
    longStayTiers: [
      { minNights: 7, pct: 5 },
      { minNights: 15, pct: 10 },
    ],
    depositPct: 50,
  },
  rules: {
    minNights: 1,
    maxNights: 60,
    bookingHorizonDays: 365,
    checkInStartMinutes: 480,
    checkInEndMinutes: 1080,
    checkOutLimitMinutes: 720,
    lateCheckoutLimitMinutes: 1080,
    daycareEnabled: true,
    daycareStartMinutes: 450,
    daycareEndMinutes: 1110,
    puppyMaxAgeMonths: 8,
  },
  seasonalRules: [
    { name: "Natal", startDate: "2026-12-22", endDate: "2026-12-26", multiplierPct: 30, blocksLongStayDiscount: true },
    {
      name: "Réveillon",
      startDate: "2026-12-29",
      endDate: "2027-01-02",
      multiplierPct: 35,
      blocksLongStayDiscount: true,
    },
    { name: "Véspera", startDate: "2026-12-24", endDate: "2026-12-24", multiplierPct: 20, blocksLongStayDiscount: false },
  ],
};

export const specCardFees: CardFee[] = [
  { id: "debito", label: "Débito", feeBasisPoints: 199, installments: 1 },
  { id: "credito-1x", label: "Crédito à vista", feeBasisPoints: 498, installments: 1 },
  { id: "credito-3x", label: "Crédito", feeBasisPoints: 899, installments: 3 },
  { id: "credito-6x", label: "Crédito", feeBasisPoints: 1299, installments: 6 },
];

export const SPEC_TODAY = "2026-01-15";

export function petAnswers(overrides: Partial<PetAnswers> = {}): PetAnswers {
  return {
    name: "Thor",
    size: "GRANDE",
    sex: "MACHO",
    neutered: true,
    inHeat: null,
    socialWithDogs: "SIM",
    vaccines: "SIM",
    aggressionHistory: false,
    medication: "NAO",
    isPuppy: false,
    foodGramsPerDay: null,
    ...overrides,
  };
}
