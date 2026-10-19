import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { checkAvailability, type AvailabilityCheck } from "../domain/availability";
import { buildBookingMessage, buildWaitlistMessage, type WhatsAppLink } from "../domain/buildWhatsAppMessage";
import { calculateQuote, occupiedDates, type Quote, type QuoteOutcome } from "../domain/calculateQuote";
import { cardOptions, installmentOptions, optionsForMessage, singlePaymentOptions, type CardOption } from "../domain/cardSurcharge";
import { addDays, timeToMinutes, todayInTimeZone } from "../domain/dates";
import {
  evaluateNotices,
  needsSpecialCare,
  shouldAskHeat,
  visibleNotices,
  type Notice,
  type PetAnswers,
} from "../domain/evaluateNotices";
import { foodAmount, type FoodAmount } from "../domain/foodAmount";
import { quoteErrorMessage } from "../domain/quoteErrorMessage";
import type { CardBrand, ServiceType, SiteConfig } from "../domain/types";

const STORAGE_KEY = "adri-pets:simulador:v1";

export interface SimulatorForm {
  serviceType: ServiceType;
  checkInDate: string;
  checkOutDate: string;
  checkOutTime: string;
  pets: PetAnswers[];
  wantsBath: boolean;
  wantsDeposit: boolean;
  notes: string;
  installments: number | null;
  cardBrandId: string | null;
}

export function emptyPet(): PetAnswers {
  return {
    name: "",
    size: "PEQUENO",
    sex: null,
    neutered: null,
    inHeat: null,
    socialWithDogs: null,
    vaccines: null,
    aggressionHistory: null,
    medication: null,
    isPuppy: false,
    foodGramsPerDay: null,
  };
}

export function initialForm(): SimulatorForm {
  return {
    serviceType: "HOSPEDAGEM",
    checkInDate: "",
    checkOutDate: "",
    checkOutTime: "10:00",
    pets: [emptyPet()],
    wantsBath: false,
    wantsDeposit: false,
    notes: "",
    installments: null,
    cardBrandId: null,
  };
}

function readStoredForm(): SimulatorForm | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<SimulatorForm>;
    if (!Array.isArray(parsed.pets) || parsed.pets.length === 0) {
      return null;
    }
    return {
      ...initialForm(),
      ...parsed,
      pets: parsed.pets.map((pet) => ({ ...emptyPet(), ...pet })),
    };
  } catch {
    return null;
  }
}

function storeForm(form: SimulatorForm): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    return;
  }
}

export interface PetView {
  pet: PetAnswers;
  askHeat: boolean;
  notices: Notice[];
  food: FoodAmount | null;
}

export interface QuoteView {
  quote: Quote;
  singlePayments: CardOption[];
  installments: CardOption[];
  chosenInstallment: CardOption | null;
  cardBrand: CardBrand | null;
  availability: AvailabilityCheck;
  message: WhatsAppLink;
  waitlistMessage: WhatsAppLink | null;
}

export type ActionStatus = "idle" | "copied" | "copy-failed" | "shared";

export type SimulatorStep = 1 | 2 | 3;

export const SIMULATOR_STEPS: { step: SimulatorStep; label: string }[] = [
  { step: 1, label: "Datas" },
  { step: 2, label: "Pets" },
  { step: 3, label: "Valor" },
];

export function useQuoteSimulator(config: SiteConfig) {
  const [form, setForm] = useState<SimulatorForm>(initialForm);
  const [restored, setRestored] = useState(false);
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
  const [step, setStep] = useState<SimulatorStep>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const today = useMemo(() => todayInTimeZone(new Date(), config.business.timeZone), [config.business.timeZone]);

  useEffect(() => {
    const stored = readStoredForm();
    if (stored) {
      setForm(stored);
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) {
      storeForm(form);
    }
  }, [form, restored]);

  const update = useCallback((patch: Partial<SimulatorForm>) => {
    setActionStatus("idle");
    setForm((current) => {
      const next = { ...current, ...patch };
      if (next.serviceType === "CRECHE" && next.checkInDate) {
        next.checkOutDate = next.checkInDate;
      }
      if (next.serviceType === "HOSPEDAGEM" && next.checkInDate && next.checkOutDate <= next.checkInDate) {
        next.checkOutDate = patch.checkOutDate ?? addDays(next.checkInDate, 1);
      }
      return next;
    });
  }, []);

  const updatePet = useCallback((index: number, patch: Partial<PetAnswers>) => {
    setActionStatus("idle");
    setForm((current) => ({
      ...current,
      pets: current.pets.map((pet, petIndex) => {
        if (petIndex !== index) {
          return pet;
        }
        const next = { ...pet, ...patch };
        return shouldAskHeat(next) ? next : { ...next, inHeat: null };
      }),
    }));
  }, []);

  const addPet = useCallback(() => {
    setForm((current) =>
      current.pets.length >= config.capacity.maxPetsPerBooking
        ? current
        : { ...current, pets: [...current.pets, emptyPet()] },
    );
  }, [config.capacity.maxPetsPerBooking]);

  const removePet = useCallback((index: number) => {
    setForm((current) =>
      current.pets.length <= 1 ? current : { ...current, pets: current.pets.filter((_, petIndex) => petIndex !== index) },
    );
  }, []);

  const reset = useCallback(() => {
    setActionStatus("idle");
    setStepError(null);
    setStep(1);
    setForm(initialForm());
  }, []);

  const checkOutMinutes = timeToMinutes(form.checkOutTime) ?? -1;
  const datesReady =
    form.checkInDate !== "" && (form.serviceType === "CRECHE" || form.checkOutDate !== "");
  const checkOutDate = form.serviceType === "CRECHE" ? form.checkInDate : form.checkOutDate;

  const outcome: QuoteOutcome | null = useMemo(() => {
    if (!datesReady) {
      return null;
    }
    return calculateQuote(
      {
        serviceType: form.serviceType,
        checkInDate: form.checkInDate,
        checkOutDate,
        checkOutMinutes,
        pets: form.pets.map((pet) => ({
          name: pet.name,
          size: pet.size,
          specialCare: needsSpecialCare(pet),
        })),
        today,
      },
      {
        prices: config.prices,
        rules: config.rules,
        seasonalRules: config.seasonalRules,
        maxPetsPerBooking: config.capacity.maxPetsPerBooking,
      },
    );
  }, [datesReady, form, checkOutDate, checkOutMinutes, today, config]);

  const quoteView: QuoteView | null = useMemo(() => {
    if (!outcome?.ok) {
      return null;
    }
    const quote = outcome.quote;
    const cardBrand = config.cardBrands.find((brand) => brand.id === form.cardBrandId) ?? config.cardBrands[0] ?? null;
    const cards = cardBrand ? cardOptions(quote.totalCents, cardBrand.fees) : [];
    const installments = installmentOptions(cards);
    const chosenInstallment = installments.find((option) => option.installments === form.installments) ?? null;
    const availability = checkAvailability(
      occupiedDates(quote, form.checkInDate, checkOutDate),
      config.fullDates,
      config.fewSlotsDates,
    );
    const message = buildBookingMessage({
      businessName: config.business.name,
      whatsappE164: config.business.whatsappE164,
      checkInDate: form.checkInDate,
      checkOutDate,
      checkOutMinutes,
      quote,
      pets: form.pets,
      cardOptions: optionsForMessage(cards, chosenInstallment?.installments ?? null),
      cardBrandLabel: config.cardBrands.length > 1 && cardBrand ? cardBrand.label : null,
      depositPct: config.prices.depositPct,
      wantsDeposit: form.wantsDeposit,
      wantsBath: config.bathService.enabled && form.wantsBath,
      notes: form.notes,
    });
    const waitlistMessage =
      availability.fullDates.length > 0
        ? buildWaitlistMessage({
            whatsappE164: config.business.whatsappE164,
            fullDates: availability.fullDates,
            checkInDate: form.checkInDate,
            checkOutDate,
            pets: form.pets,
          })
        : null;
    return {
      quote,
      singlePayments: singlePaymentOptions(cards),
      installments,
      chosenInstallment,
      cardBrand,
      availability,
      message,
      waitlistMessage,
    };
  }, [outcome, form, checkOutDate, checkOutMinutes, config]);

  const errorMessage =
    outcome && !outcome.ok
      ? quoteErrorMessage(outcome.code, config.rules, config.capacity.maxPetsPerBooking)
      : null;

  const petViews: PetView[] = useMemo(
    () =>
      form.pets.map((pet) => ({
        pet,
        askHeat: shouldAskHeat(pet),
        notices: visibleNotices(evaluateNotices(pet)),
        food:
          pet.foodGramsPerDay === null
            ? null
            : foodAmount(pet.foodGramsPerDay, outcome?.ok ? outcome.quote.nights : 0, form.serviceType),
      })),
    [form.pets, form.serviceType, outcome],
  );

  const copyQuote = useCallback(async () => {
    if (!quoteView) {
      return;
    }
    try {
      await navigator.clipboard.writeText(quoteView.message.text);
      setActionStatus("copied");
    } catch {
      setActionStatus("copy-failed");
    }
  }, [quoteView]);

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const shareQuote = useCallback(async () => {
    if (!quoteView || !canShare) {
      return;
    }
    try {
      await navigator.share({ text: quoteView.message.text });
      setActionStatus("shared");
    } catch {
      setActionStatus("idle");
    }
  }, [quoteView, canShare]);

  const datesError = datesReady && outcome && !outcome.ok && outcome.code !== "SEM_PETS" && outcome.code !== "MAX_PETS";

  const goToStep = useCallback(
    (target: SimulatorStep) => {
      if (target > 1 && !datesReady) {
        setStepError("Escolha as datas para continuar.");
        setStep(1);
        return;
      }
      if (target > 1 && datesError) {
        setStepError(null);
        setStep(1);
        return;
      }
      setStepError(null);
      setStep(target);
    },
    [datesReady, datesError],
  );

  const nextStep = useCallback(() => goToStep(Math.min(step + 1, 3) as SimulatorStep), [goToStep, step]);
  const previousStep = useCallback(() => goToStep(Math.max(step - 1, 1) as SimulatorStep), [goToStep, step]);

  return {
    form,
    step,
    stepError,
    goToStep,
    nextStep,
    previousStep,
    today,
    maxCheckInDate: addDays(today, config.rules.bookingHorizonDays),
    canAddPet: form.pets.length < config.capacity.maxPetsPerBooking,
    petViews,
    quoteView,
    errorMessage,
    datesReady,
    actionStatus,
    canShare,
    update,
    updatePet,
    addPet,
    removePet,
    reset,
    copyQuote,
    shareQuote,
  };
}

export type QuoteSimulatorViewModel = ReturnType<typeof useQuoteSimulator>;
