import { z } from "zod";
import { isValidIsoDate } from "./dates";
import { PET_SIZES, type SiteConfig } from "./types";

const isoDate = z.string().refine(isValidIsoDate, { message: "Data inválida; use AAAA-MM-DD" });
const pct = z.number().int().min(0).max(100);
const cents = z.number().int().positive();
const minutesOfDay = z.number().int().min(0).max(1439);
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: "Cor inválida; use #RRGGBB" });

const sizeRecord = <T extends z.ZodType>(schema: T) =>
  z.object(Object.fromEntries(PET_SIZES.map((size) => [size, schema])) as Record<(typeof PET_SIZES)[number], T>);

export const siteConfigSchema = z
  .object({
    business: z.object({
      name: z.string().min(2).max(60),
      city: z.string().min(2),
      state: z.string().length(2),
      neighborhood: z.string().min(2),
      whatsappE164: z.string().regex(/^55\d{10,11}$/, { message: "Use 55 + DDD + número, só dígitos" }),
      instagramHandle: z.string().regex(/^[A-Za-z0-9._]{1,30}$/).nullable(),
      googleReviewUrl: z.url().nullable(),
      primaryColorHex: hexColor,
      secondaryColorHex: hexColor,
      timeZone: z.string().min(3),
    }),
    capacity: z.object({ maxPetsPerBooking: z.number().int().min(1).max(3) }),
    rules: z.object({
      minNights: z.number().int().min(1),
      maxNights: z.number().int().min(1).max(365),
      bookingHorizonDays: z.number().int().min(1).max(730),
      checkInStartMinutes: minutesOfDay,
      checkInEndMinutes: minutesOfDay,
      checkOutLimitMinutes: minutesOfDay,
      lateCheckoutLimitMinutes: minutesOfDay,
      daycareEnabled: z.boolean(),
      daycareStartMinutes: minutesOfDay,
      daycareEndMinutes: minutesOfDay,
      puppyMaxAgeMonths: z.number().int().min(1).max(24),
    }),
    prices: z.object({
      rateCents: sizeRecord(cents),
      daycareRateCents: cents,
      lateCheckoutPct: pct,
      secondPetDiscountCents: z.number().int().min(0),
      thirdPetDiscountCents: z.number().int().min(0),
      specialCareDailyCents: z.number().int().min(0),
      longStayTiers: z.array(z.object({ minNights: z.number().int().min(2), pct })),
      depositPct: pct.nullable(),
    }),
    sizeLabels: sizeRecord(z.string().min(3)),
    seasonalRules: z.array(
      z
        .object({
          name: z.string().min(2),
          startDate: isoDate,
          endDate: isoDate,
          multiplierPct: z.number().int().min(0).max(200),
          blocksLongStayDiscount: z.boolean(),
        })
        .refine((rule) => rule.startDate <= rule.endDate, { message: "startDate depois de endDate" }),
    ),
    cardBrands: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          label: z.string().min(2),
          fees: z
            .array(
              z.object({
                id: z.string().regex(/^[a-z0-9-]+$/),
                label: z.string().min(2),
                feeBasisPoints: z.number().int().min(0).max(5000),
                installments: z.number().int().min(1).max(24),
              }),
            )
            .min(1)
            .refine((fees) => new Set(fees.map((fee) => fee.id)).size === fees.length, {
              message: "taxa com id repetido",
            }),
        }),
      )
      .min(1)
      .refine((brands) => new Set(brands.map((brand) => brand.id)).size === brands.length, {
        message: "bandeira com id repetido",
      }),
    bathService: z.object({
      enabled: z.boolean(),
      partnerName: z.string().min(2).nullable(),
      priceNote: z.string().min(5),
    }),
    fullDates: z.array(isoDate),
    fewSlotsDates: z.array(isoDate),
  })
  .refine(
    (config) => {
      const lowest = Math.min(...Object.values(config.prices.rateCents), config.prices.daycareRateCents);
      return Math.max(config.prices.secondPetDiscountCents, config.prices.thirdPetDiscountCents) < lowest;
    },
    { message: "Desconto do 2º/3º pet maior ou igual à menor diária" },
  )
  .refine((config) => config.rules.minNights <= config.rules.maxNights, {
    message: "minNights maior que maxNights",
  })
  .refine((config) => config.rules.checkOutLimitMinutes <= config.rules.lateCheckoutLimitMinutes, {
    message: "checkOutLimitMinutes depois de lateCheckoutLimitMinutes",
  })
  .refine((config) => config.rules.daycareStartMinutes < config.rules.daycareEndMinutes, {
    message: "Horário da creche invertido",
  });

export function parseSiteConfig(raw: SiteConfig): SiteConfig {
  const result = siteConfigSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`site.config.ts inválido: ${details}`);
  }
  return raw;
}
