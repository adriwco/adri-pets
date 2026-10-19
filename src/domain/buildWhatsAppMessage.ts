import type { CardOption } from "./cardSurcharge";
import type { Quote } from "./calculateQuote";
import { formatDateBR, minutesToTime } from "./dates";
import { conversationNotices, evaluateNotices, type PetAnswers } from "./evaluateNotices";
import { formatCurrency } from "./money";
import type { PetSize } from "./types";

export interface WhatsAppLink {
  text: string;
  url: string;
}

const SIZE_WORDS: Record<PetSize, { male: string; female: string }> = {
  PEQUENO: { male: "pequeno", female: "pequena" },
  MEDIO: { male: "médio", female: "média" },
  GRANDE: { male: "grande", female: "grande" },
  GIGANTE: { male: "gigante", female: "gigante" },
};

const MEDICATION_WORDS = { COMPRIMIDO: "comprimido", POMADA: "pomada", INJECAO: "injeção" } as const;

export function whatsAppUrl(whatsappE164: string, text: string): string {
  return `https://wa.me/${whatsappE164}?text=${encodeURIComponent(text)}`;
}

function byGender(pet: PetAnswers, male: string, female: string): string {
  return pet.sex === "FEMEA" ? female : male;
}

export function describePet(pet: PetAnswers): string {
  const parts: string[] = [];
  if (pet.sex) {
    parts.push(pet.sex === "FEMEA" ? "fêmea" : "macho");
  }
  const sizeWords = SIZE_WORDS[pet.size];
  parts.push(byGender(pet, sizeWords.male, sizeWords.female));
  if (pet.isPuppy) {
    parts.push("filhote");
  }
  if (pet.neutered === null) {
    parts.push("castração: não informado");
  } else {
    parts.push(pet.neutered ? byGender(pet, "castrado", "castrada") : byGender(pet, "não castrado", "não castrada"));
  }
  if (pet.sex === "FEMEA" && pet.neutered === false && pet.inHeat) {
    parts.push(`cio: ${pet.inHeat === "SIM" ? "sim" : pet.inHeat === "NAO" ? "não" : "não sei"}`);
  }
  if (pet.socialWithDogs === "SIM") {
    parts.push("sociável");
  } else if (pet.socialWithDogs === "NAO") {
    parts.push("não convive bem com cães");
  } else {
    parts.push("sociabilidade: não sei");
  }
  if (pet.vaccines === "SIM") {
    parts.push("vacinas em dia");
  } else if (pet.vaccines === "NAO") {
    parts.push("vacinas atrasadas");
  } else {
    parts.push("vacinas: vou confirmar");
  }
  if (pet.aggressionHistory) {
    parts.push("já teve episódio de agressividade");
  }
  if (pet.medication && pet.medication !== "NAO") {
    parts.push(`remédio: ${MEDICATION_WORDS[pet.medication]}`);
  }
  return `• ${pet.name.trim() || "Sem nome"}: ${parts.join(", ")}`;
}

export interface BookingMessageInput {
  businessName: string;
  whatsappE164: string;
  checkInDate: string;
  checkOutDate: string;
  checkOutMinutes: number;
  quote: Quote;
  pets: PetAnswers[];
  cardOptions: CardOption[];
  cardBrandLabel: string | null;
  depositPct: number | null;
  wantsDeposit: boolean;
  wantsBath: boolean;
  notes: string;
}

export function cardSummary(options: CardOption[]): string {
  return options
    .map((option) =>
      option.installments > 1
        ? `${option.label} ${option.installments}x de ${formatCurrency(option.installmentCents)} (total ${formatCurrency(option.totalCents)})`
        : `${option.label} ${formatCurrency(option.totalCents)}`,
    )
    .join(" · ");
}

function stayLine(input: BookingMessageInput): string {
  const checkIn = formatDateBR(input.checkInDate);
  const time = minutesToTime(input.checkOutMinutes);
  if (input.quote.serviceType === "CRECHE") {
    return `*Creche:* ${checkIn}, saída às ${time}`;
  }
  const nights = input.quote.nights;
  const nightsLabel = nights === 1 ? "1 diária" : `${nights} diárias`;
  return `*Entrada:* ${checkIn} | *Saída:* ${formatDateBR(input.checkOutDate)} às ${time} (${nightsLabel})`;
}

function noticesBlock(pets: PetAnswers[]): string[] {
  const namesByText = new Map<string, string[]>();
  for (const pet of pets) {
    for (const notice of conversationNotices(evaluateNotices(pet))) {
      const names = namesByText.get(notice.text) ?? [];
      names.push(pet.name.trim() || "Sem nome");
      namesByText.set(notice.text, names);
    }
  }
  const items = [...namesByText].map(([text, names]) => `- ${names.join(", ")}: ${text}`);
  return items.length === 0 ? [] : ["*Para conversarmos:*", ...items];
}

export function buildBookingMessage(input: BookingMessageInput): WhatsAppLink {
  const notes = input.notes.trim().slice(0, 200);
  const lines = [
    `Olá! 🐾 Fiz uma simulação no site da ${input.businessName}:`,
    stayLine(input),
    "*Pets:*",
    ...input.pets.map(describePet),
    `*Total no PIX:* ${formatCurrency(input.quote.totalCents)}`,
    ...(input.cardOptions.length > 0
      ? [`*No cartão${input.cardBrandLabel ? ` (${input.cardBrandLabel})` : ""}:* ${cardSummary(input.cardOptions)}`]
      : []),
    ...(input.wantsDeposit && input.quote.depositCents !== null && input.depositPct !== null
      ? [`*Quero garantir a vaga já com o sinal:* ${formatCurrency(input.quote.depositCents)} no PIX`]
      : []),
    ...(input.wantsBath ? ["*Banho:* quero banho durante a estadia"] : []),
    ...noticesBlock(input.pets),
    ...(notes ? [`*Observação:* ${notes}`] : []),
    "Tem vaga para essas datas?",
  ];
  const text = lines.join("\n");
  return { text, url: whatsAppUrl(input.whatsappE164, text) };
}

export interface WaitlistMessageInput {
  whatsappE164: string;
  fullDates: string[];
  checkInDate: string;
  checkOutDate: string;
  pets: PetAnswers[];
}

export function buildWaitlistMessage(input: WaitlistMessageInput): WhatsAppLink {
  const dates = input.fullDates.map(formatDateBR).join(", ");
  const text = [
    `Olá! 🐾 Vi no site que ${input.fullDates.length === 1 ? "o dia" : "os dias"} ${dates} ${input.fullDates.length === 1 ? "está lotado" : "estão lotados"}. Pode me avisar se abrir vaga?`,
    `*Entrada:* ${formatDateBR(input.checkInDate)} | *Saída:* ${formatDateBR(input.checkOutDate)}`,
    "*Pets:*",
    ...input.pets.map(describePet),
  ].join("\n");
  return { text, url: whatsAppUrl(input.whatsappE164, text) };
}

export function buildGenericMessage(whatsappE164: string, businessName: string): WhatsAppLink {
  const text = `Olá! 🐾 Vim pelo site da ${businessName} e gostaria de saber mais sobre a hospedagem.`;
  return { text, url: whatsAppUrl(whatsappE164, text) };
}
