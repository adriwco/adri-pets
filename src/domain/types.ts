export const PET_SIZES = ["PEQUENO", "MEDIO", "GRANDE", "GIGANTE"] as const;
export type PetSize = (typeof PET_SIZES)[number];

export type ServiceType = "HOSPEDAGEM" | "CRECHE";

export interface SeasonalRule {
  name: string;
  startDate: string;
  endDate: string;
  multiplierPct: number;
  blocksLongStayDiscount: boolean;
}

export interface LongStayTier {
  minNights: number;
  pct: number;
}

export interface CardFee {
  id: string;
  label: string;
  feeBasisPoints: number;
  installments: number;
}

export interface CardBrand {
  id: string;
  label: string;
  fees: CardFee[];
}

export interface PricesConfig {
  rateCents: Record<PetSize, number>;
  daycareRateCents: number;
  lateCheckoutPct: number;
  secondPetDiscountCents: number;
  thirdPetDiscountCents: number;
  specialCareDailyCents: number;
  longStayTiers: LongStayTier[];
  depositPct: number | null;
}

export interface RulesConfig {
  minNights: number;
  maxNights: number;
  bookingHorizonDays: number;
  checkInStartMinutes: number;
  checkInEndMinutes: number;
  checkOutLimitMinutes: number;
  lateCheckoutLimitMinutes: number;
  daycareEnabled: boolean;
  daycareStartMinutes: number;
  daycareEndMinutes: number;
  puppyMaxAgeMonths: number;
}

export interface BusinessConfig {
  name: string;
  city: string;
  state: string;
  neighborhood: string;
  whatsappE164: string;
  instagramHandle: string | null;
  googleReviewUrl: string | null;
  primaryColorHex: string;
  secondaryColorHex: string;
  timeZone: string;
}

export interface BathServiceConfig {
  enabled: boolean;
  partnerName: string | null;
  priceNote: string;
}

export interface SiteConfig {
  business: BusinessConfig;
  capacity: { maxPetsPerBooking: number };
  rules: RulesConfig;
  prices: PricesConfig;
  sizeLabels: Record<PetSize, string>;
  seasonalRules: SeasonalRule[];
  cardBrands: CardBrand[];
  bathService: BathServiceConfig;
  fullDates: string[];
  fewSlotsDates: string[];
}
