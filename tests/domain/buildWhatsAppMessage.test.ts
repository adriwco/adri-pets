import { describe, expect, it } from "vitest";
import {
  buildBookingMessage,
  buildGenericMessage,
  buildWaitlistMessage,
  describePet,
  type BookingMessageInput,
} from "../../src/domain/buildWhatsAppMessage";
import { calculateQuote, type Quote } from "../../src/domain/calculateQuote";
import { cardOptions } from "../../src/domain/cardSurcharge";
import { needsSpecialCare, type PetAnswers } from "../../src/domain/evaluateNotices";
import { SPEC_TODAY, petAnswers, specCardFees, specQuoteConfig } from "./fixtures";

function quoteFor(pets: PetAnswers[], checkOutMinutes = 600): Quote {
  const outcome = calculateQuote(
    {
      serviceType: "HOSPEDAGEM",
      checkInDate: "2026-03-10",
      checkOutDate: "2026-03-13",
      checkOutMinutes,
      pets: pets.map((pet) => ({ name: pet.name, size: pet.size, specialCare: needsSpecialCare(pet) })),
      today: SPEC_TODAY,
    },
    specQuoteConfig,
  );
  if (!outcome.ok) {
    throw new Error(outcome.code);
  }
  return outcome.quote;
}

function messageInput(pets: PetAnswers[], overrides: Partial<BookingMessageInput> = {}): BookingMessageInput {
  const quote = quoteFor(pets);
  return {
    businessName: "Adri Pets",
    whatsappE164: "5585999999999",
    checkInDate: "2026-03-10",
    checkOutDate: "2026-03-13",
    checkOutMinutes: 600,
    quote,
    pets,
    cardOptions: cardOptions(quote.totalCents, specCardFees),
    cardBrandLabel: null,
    depositPct: 50,
    wantsDeposit: false,
    wantsBath: false,
    notes: "",
    ...overrides,
  };
}

describe("describePet", () => {
  it.each<[Partial<PetAnswers>, string]>([
    [{}, "• Thor: macho, grande, castrado, sociável, vacinas em dia"],
    [{ neutered: false }, "• Thor: macho, grande, não castrado, sociável, vacinas em dia"],
    [
      { name: "Mel", size: "PEQUENO", sex: "FEMEA", neutered: false, inHeat: "NAO", vaccines: "VOU_CONFIRMAR", medication: "COMPRIMIDO" },
      "• Mel: fêmea, pequena, não castrada, cio: não, sociável, vacinas: vou confirmar, remédio: comprimido",
    ],
    [
      { name: "Bob", size: "MEDIO", isPuppy: true, socialWithDogs: "NAO", vaccines: "NAO", aggressionHistory: true },
      "• Bob: macho, médio, filhote, castrado, não convive bem com cães, vacinas atrasadas, já teve episódio de agressividade",
    ],
    [
      { name: "  ", sex: null, neutered: null, socialWithDogs: null, vaccines: null },
      "• Sem nome: grande, castração: não informado, sociabilidade: não sei, vacinas: vou confirmar",
    ],
  ])("%o", (overrides, expected) => {
    expect(describePet(petAnswers(overrides))).toBe(expected);
  });
});

describe("buildBookingMessage", () => {
  it("monta a mensagem completa sem linhas opcionais vazias", () => {
    const { text } = buildBookingMessage(messageInput([petAnswers()]));
    expect(text).toBe(
      [
        "Olá! 🐾 Fiz uma simulação no site da Adri Pets:",
        "*Entrada:* 10/03/2026 | *Saída:* 13/03/2026 às 10:00 (3 diárias)",
        "*Pets:*",
        "• Thor: macho, grande, castrado, sociável, vacinas em dia",
        "*Total no PIX:* R$ 240,00",
        "*No cartão:* Débito R$ 244,88 · Crédito à vista R$ 252,58 · Crédito 3x de R$ 87,91 (total R$ 263,71) · Crédito 6x de R$ 45,98 (total R$ 275,84)",
        "Tem vaga para essas datas?",
      ].join("\n"),
    );
  });

  it("inclui banho, observação e o bloco para conversarmos", () => {
    const pets = [
      petAnswers(),
      petAnswers({ name: "Mel", size: "PEQUENO", sex: "FEMEA", neutered: false, inHeat: "SIM", medication: "INJECAO" }),
    ];
    const { text } = buildBookingMessage(messageInput(pets, { wantsBath: true, notes: "  Ela tem medo de trovão  " }));
    const lines = text.split("\n");
    expect(lines).toContain("*Banho:* quero banho durante a estadia");
    expect(lines).toContain("*Observação:* Ela tem medo de trovão");
    expect(lines).toContain("*Para conversarmos:*");
    expect(lines.filter((line) => line.startsWith("- Mel:"))).toHaveLength(3);
    expect(text).not.toMatch(/\n\n/);
    expect(text).not.toMatch(/[⚠✅]/u);
  });

  it("agrupa o mesmo aviso de pets diferentes numa linha", () => {
    const female = (name: string) => petAnswers({ name, size: "PEQUENO", sex: "FEMEA", neutered: false, inHeat: "NAO" });
    const { text } = buildBookingMessage(messageInput([female("Mel"), female("Luna")]));
    expect(text).toContain(
      "- Mel, Luna: Para fêmeas não castradas, preciso conversar antes para ver a disponibilidade, por causa dos outros hóspedes.",
    );
  });

  it("macho não castrado não gera bloco para conversarmos", () => {
    const { text } = buildBookingMessage(messageInput([petAnswers({ neutered: false })]));
    expect(text).toContain("não castrado");
    expect(text).not.toContain("Para conversarmos");
  });

  it("cita a bandeira escolhida na linha do cartão", () => {
    const { text } = buildBookingMessage(messageInput([petAnswers()], { cardBrandLabel: "Elo ou Amex" }));
    expect(text).toContain("*No cartão (Elo ou Amex):* Débito");
  });

  it("inclui o sinal só quando o cliente quer garantir a vaga", () => {
    const { text } = buildBookingMessage(messageInput([petAnswers()], { wantsDeposit: true }));
    expect(text).toContain("*Quero garantir a vaga já com o sinal:* R$ 120,00 no PIX\n");
  });

  it("sem sinal configurado, omite a linha do sinal", () => {
    const input = messageInput([petAnswers()]);
    const { text } = buildBookingMessage({
      ...input,
      wantsDeposit: true,
      depositPct: null,
      quote: { ...input.quote, depositCents: null },
    });
    expect(text).not.toContain("Sinal");
  });

  it("limita a observação a 200 caracteres", () => {
    const { text } = buildBookingMessage(messageInput([petAnswers()], { notes: "a".repeat(300) }));
    expect(text).toContain(`*Observação:* ${"a".repeat(200)}\n`);
  });

  it("a URL do WhatsApp decodifica para o mesmo texto, com acentos e emojis", () => {
    const { text, url } = buildBookingMessage(messageInput([petAnswers({ name: "João" })]));
    expect(url.startsWith("https://wa.me/5585999999999?text=")).toBe(true);
    expect(decodeURIComponent(url.split("?text=")[1] ?? "")).toBe(text);
  });

  it("no pior caso (3 pets com todos os avisos e observação cheia) fica abaixo de 2.000 caracteres", () => {
    const heavyPet = (name: string) =>
      petAnswers({ name, sex: "FEMEA", neutered: false, inHeat: "NAO_SEI", socialWithDogs: "NAO_SEI", vaccines: "NAO", aggressionHistory: true, medication: "INJECAO" });
    const { text } = buildBookingMessage(
      messageInput([heavyPet("Mel"), heavyPet("Luna"), heavyPet("Nina")], { wantsBath: true, notes: "x".repeat(200) }),
    );
    expect(text.length).toBeLessThan(2000);
  });

  it("descreve a creche com o dia e o horário de saída", () => {
    const outcome = calculateQuote(
      {
        serviceType: "CRECHE",
        checkInDate: "2026-03-10",
        checkOutDate: "2026-03-10",
        checkOutMinutes: 1080,
        pets: [{ name: "Thor", size: "GRANDE", specialCare: false }],
        today: SPEC_TODAY,
      },
      specQuoteConfig,
    );
    if (!outcome.ok) {
      throw new Error(outcome.code);
    }
    const { text } = buildBookingMessage(
      messageInput([petAnswers()], { quote: outcome.quote, checkOutDate: "2026-03-10", checkOutMinutes: 1080 }),
    );
    expect(text.split("\n")[1]).toBe("*Creche:* 10/03/2026, saída às 18:00");
  });

  it("usa singular para uma diária", () => {
    const outcome = calculateQuote(
      {
        serviceType: "HOSPEDAGEM",
        checkInDate: "2026-03-10",
        checkOutDate: "2026-03-11",
        checkOutMinutes: 600,
        pets: [{ name: "Thor", size: "GRANDE", specialCare: false }],
        today: SPEC_TODAY,
      },
      specQuoteConfig,
    );
    if (!outcome.ok) {
      throw new Error(outcome.code);
    }
    const { text } = buildBookingMessage(messageInput([petAnswers()], { quote: outcome.quote, checkOutDate: "2026-03-11" }));
    expect(text).toContain("(1 diária)");
  });
});

describe("outras mensagens", () => {
  it("lista de espera cita as datas lotadas", () => {
    const { text } = buildWaitlistMessage({
      whatsappE164: "5585999999999",
      fullDates: ["2026-12-24", "2026-12-25"],
      checkInDate: "2026-12-23",
      checkOutDate: "2026-12-27",
      pets: [petAnswers()],
    });
    expect(text.split("\n")[0]).toBe(
      "Olá! 🐾 Vi no site que os dias 24/12/2026, 25/12/2026 estão lotados. Pode me avisar se abrir vaga?",
    );
  });

  it("lista de espera no singular", () => {
    const { text } = buildWaitlistMessage({
      whatsappE164: "5585999999999",
      fullDates: ["2026-12-24"],
      checkInDate: "2026-12-23",
      checkOutDate: "2026-12-27",
      pets: [petAnswers()],
    });
    expect(text).toContain("o dia 24/12/2026 está lotado");
  });

  it("mensagem genérica do botão flutuante", () => {
    expect(buildGenericMessage("5585999999999", "Adri Pets").text).toBe(
      "Olá! 🐾 Vim pelo site da Adri Pets e gostaria de saber mais sobre a hospedagem.",
    );
  });
});
