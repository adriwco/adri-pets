import { addDays, diffDays, eachNight, isValidIsoDate } from "./dates";
import { roundDiv } from "./money";
import type { PetSize, PricesConfig, RulesConfig, SeasonalRule, ServiceType } from "./types";

export interface QuotePetInput {
  name: string;
  size: PetSize;
  specialCare: boolean;
}

export interface QuoteInput {
  serviceType: ServiceType;
  checkInDate: string;
  checkOutDate: string;
  checkOutMinutes: number;
  pets: QuotePetInput[];
  today: string;
}

export interface QuoteConfig {
  prices: PricesConfig;
  rules: RulesConfig;
  seasonalRules: SeasonalRule[];
  maxPetsPerBooking: number;
}

export interface QuotedPet {
  name: string;
  size: PetSize;
  inputIndex: number;
  baseCents: number;
  multiPetDiscountCents: number;
  specialCare: boolean;
}

export interface QuoteLine {
  date: string;
  inputIndex: number;
  seasonalPct: number;
  cents: number;
  longStayEligible: boolean;
}

export type LateCheckoutKind = "NENHUM" | "MEIA" | "INTEIRA";

export interface Quote {
  serviceType: ServiceType;
  nights: number;
  pets: QuotedPet[];
  lines: QuoteLine[];
  subtotalCents: number;
  longStayPct: number;
  longStayDiscountCents: number;
  lateCheckoutKind: LateCheckoutKind;
  lateFeeCents: number;
  specialCareCents: number;
  totalCents: number;
  depositCents: number | null;
  balanceCents: number | null;
  seasonNames: string[];
}

export type QuoteErrorCode =
  | "DATAS_INVALIDAS"
  | "MIN_NOITES"
  | "MAX_NOITES"
  | "DATA_NO_PASSADO"
  | "FORA_DO_HORIZONTE"
  | "SEM_PETS"
  | "MAX_PETS"
  | "HORARIO_INVALIDO"
  | "CRECHE_INDISPONIVEL"
  | "HORARIO_CRECHE";

export type QuoteOutcome = { ok: true; quote: Quote } | { ok: false; code: QuoteErrorCode };

interface DaySeason {
  pct: number;
  blocksLongStay: boolean;
  names: string[];
}

function seasonFor(date: string, rules: SeasonalRule[]): DaySeason {
  const matching = rules.filter((rule) => rule.startDate <= date && date <= rule.endDate);
  return {
    pct: matching.reduce((max, rule) => Math.max(max, rule.multiplierPct), 0),
    blocksLongStay: matching.some((rule) => rule.blocksLongStayDiscount),
    names: matching.map((rule) => rule.name),
  };
}

function multiPetDiscountFor(position: number, prices: PricesConfig): number {
  if (position === 0) {
    return 0;
  }
  return position === 1 ? prices.secondPetDiscountCents : prices.thirdPetDiscountCents;
}

function orderPets(pets: QuotePetInput[], prices: PricesConfig, baseFor: (size: PetSize) => number): QuotedPet[] {
  return pets
    .map((pet, inputIndex) => ({ pet, inputIndex, baseCents: baseFor(pet.size) }))
    .sort((a, b) => b.baseCents - a.baseCents || a.inputIndex - b.inputIndex)
    .map(({ pet, inputIndex, baseCents }, position) => ({
      name: pet.name,
      size: pet.size,
      inputIndex,
      baseCents,
      multiPetDiscountCents: multiPetDiscountFor(position, prices),
      specialCare: pet.specialCare,
    }));
}

function lineCents(pet: QuotedPet, seasonalPct: number): number {
  return roundDiv(Math.max(pet.baseCents - pet.multiPetDiscountCents, 0) * (100 + seasonalPct), 100);
}

function longStayPctFor(nights: number, prices: PricesConfig): number {
  return prices.longStayTiers
    .filter((tier) => nights >= tier.minNights)
    .reduce((best, tier) => Math.max(best, tier.pct), 0);
}

function lateCheckoutKindFor(minutes: number, rules: RulesConfig): LateCheckoutKind {
  if (minutes <= rules.checkOutLimitMinutes) {
    return "NENHUM";
  }
  return minutes <= rules.lateCheckoutLimitMinutes ? "MEIA" : "INTEIRA";
}

function withPayment(
  quote: Omit<Quote, "depositCents" | "balanceCents">,
  prices: PricesConfig,
): Quote {
  if (prices.depositPct === null) {
    return { ...quote, depositCents: null, balanceCents: null };
  }
  const depositCents = roundDiv(quote.totalCents * prices.depositPct, 100);
  return { ...quote, depositCents, balanceCents: quote.totalCents - depositCents };
}

function validateCommon(input: QuoteInput, config: QuoteConfig): QuoteErrorCode | null {
  if (!isValidIsoDate(input.checkInDate) || !isValidIsoDate(input.checkOutDate) || !isValidIsoDate(input.today)) {
    return "DATAS_INVALIDAS";
  }
  if (input.pets.length === 0) {
    return "SEM_PETS";
  }
  if (input.pets.length > config.maxPetsPerBooking) {
    return "MAX_PETS";
  }
  if (!Number.isInteger(input.checkOutMinutes) || input.checkOutMinutes < 0 || input.checkOutMinutes >= 1440) {
    return "HORARIO_INVALIDO";
  }
  if (input.checkInDate < input.today) {
    return "DATA_NO_PASSADO";
  }
  if (diffDays(input.today, input.checkInDate) > config.rules.bookingHorizonDays) {
    return "FORA_DO_HORIZONTE";
  }
  return null;
}

function quoteDaycare(input: QuoteInput, config: QuoteConfig): QuoteOutcome {
  const { prices, rules, seasonalRules } = config;
  if (!rules.daycareEnabled) {
    return { ok: false, code: "CRECHE_INDISPONIVEL" };
  }
  if (input.checkOutDate !== input.checkInDate) {
    return { ok: false, code: "DATAS_INVALIDAS" };
  }
  if (input.checkOutMinutes > rules.daycareEndMinutes || input.checkOutMinutes < rules.daycareStartMinutes) {
    return { ok: false, code: "HORARIO_CRECHE" };
  }
  const pets = orderPets(input.pets, prices, () => prices.daycareRateCents);
  const season = seasonFor(input.checkInDate, seasonalRules);
  const lines = pets.map((pet) => ({
    date: input.checkInDate,
    inputIndex: pet.inputIndex,
    seasonalPct: season.pct,
    cents: lineCents(pet, season.pct),
    longStayEligible: false,
  }));
  const subtotalCents = lines.reduce((sum, line) => sum + line.cents, 0);
  const specialCareCents = pets.filter((pet) => pet.specialCare).length * prices.specialCareDailyCents;
  return {
    ok: true,
    quote: withPayment(
      {
        serviceType: "CRECHE",
        nights: 0,
        pets,
        lines,
        subtotalCents,
        longStayPct: 0,
        longStayDiscountCents: 0,
        lateCheckoutKind: "NENHUM",
        lateFeeCents: 0,
        specialCareCents,
        totalCents: subtotalCents + specialCareCents,
        seasonNames: season.names,
      },
      prices,
    ),
  };
}

function quoteBoarding(input: QuoteInput, config: QuoteConfig): QuoteOutcome {
  const { prices, rules, seasonalRules } = config;
  if (input.checkOutDate <= input.checkInDate) {
    return { ok: false, code: "DATAS_INVALIDAS" };
  }
  const nights = diffDays(input.checkInDate, input.checkOutDate);
  if (nights < rules.minNights) {
    return { ok: false, code: "MIN_NOITES" };
  }
  if (nights > rules.maxNights) {
    return { ok: false, code: "MAX_NOITES" };
  }

  const pets = orderPets(input.pets, prices, (size) => prices.rateCents[size]);
  const seasonNames = new Set<string>();
  const lines: QuoteLine[] = eachNight(input.checkInDate, input.checkOutDate).flatMap((date) => {
    const season = seasonFor(date, seasonalRules);
    season.names.forEach((name) => seasonNames.add(name));
    return pets.map((pet) => ({
      date,
      inputIndex: pet.inputIndex,
      seasonalPct: season.pct,
      cents: lineCents(pet, season.pct),
      longStayEligible: !season.blocksLongStay,
    }));
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.cents, 0);
  const longStayPct = longStayPctFor(nights, prices);
  const eligibleCents = lines.filter((line) => line.longStayEligible).reduce((sum, line) => sum + line.cents, 0);
  const longStayDiscountCents = roundDiv(eligibleCents * longStayPct, 100);

  const lateCheckoutKind = lateCheckoutKindFor(input.checkOutMinutes, rules);
  const checkoutSeason = seasonFor(input.checkOutDate, seasonalRules);
  const lateFeeCents =
    lateCheckoutKind === "NENHUM"
      ? 0
      : pets.reduce((sum, pet) => {
          const fullLine = lineCents(pet, checkoutSeason.pct);
          return sum + (lateCheckoutKind === "MEIA" ? roundDiv(fullLine * prices.lateCheckoutPct, 100) : fullLine);
        }, 0);
  if (lateCheckoutKind !== "NENHUM") {
    checkoutSeason.names.forEach((name) => seasonNames.add(name));
  }

  const specialCareCents = pets.filter((pet) => pet.specialCare).length * prices.specialCareDailyCents * nights;

  return {
    ok: true,
    quote: withPayment(
      {
        serviceType: "HOSPEDAGEM",
        nights,
        pets,
        lines,
        subtotalCents,
        longStayPct,
        longStayDiscountCents,
        lateCheckoutKind,
        lateFeeCents,
        specialCareCents,
        totalCents: subtotalCents - longStayDiscountCents + lateFeeCents + specialCareCents,
        seasonNames: [...seasonNames],
      },
      prices,
    ),
  };
}

export function calculateQuote(input: QuoteInput, config: QuoteConfig): QuoteOutcome {
  const commonError = validateCommon(input, config);
  if (commonError) {
    return { ok: false, code: commonError };
  }
  return input.serviceType === "CRECHE" ? quoteDaycare(input, config) : quoteBoarding(input, config);
}

export function occupiedDates(quote: Quote, checkInDate: string, checkOutDate: string): string[] {
  if (quote.serviceType === "CRECHE") {
    return [checkInDate];
  }
  const nights = eachNight(checkInDate, checkOutDate);
  return quote.lateCheckoutKind === "NENHUM" ? nights : [...nights, addDays(checkInDate, quote.nights)];
}
