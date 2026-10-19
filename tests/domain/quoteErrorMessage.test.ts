import { describe, expect, it } from "vitest";
import type { QuoteErrorCode } from "../../src/domain/calculateQuote";
import { quoteErrorMessage } from "../../src/domain/quoteErrorMessage";
import { specQuoteConfig } from "./fixtures";

const rules = specQuoteConfig.rules;

describe("quoteErrorMessage", () => {
  it.each<[QuoteErrorCode, string]>([
    ["DATAS_INVALIDAS", "Confira as datas: a saída precisa ser depois da entrada."],
    ["MIN_NOITES", "A estadia mínima é de 1 diária."],
    ["MAX_NOITES", "Para estadias acima de 60 diárias, me chama no WhatsApp que a gente combina."],
    ["DATA_NO_PASSADO", "A data de entrada já passou. Escolha uma data a partir de hoje."],
    ["FORA_DO_HORIZONTE", "Essa data ainda está bem longe. Me chama no WhatsApp para combinarmos."],
    ["SEM_PETS", "Adicione pelo menos um pet."],
    ["MAX_PETS", "Recebo no máximo 3 pets por vez."],
    ["HORARIO_INVALIDO", "Confira o horário de saída."],
    ["CRECHE_INDISPONIVEL", "A creche não está disponível no momento."],
    ["HORARIO_CRECHE", "Na creche, o horário é das 07:30 às 18:30."],
  ])("%s", (code, expected) => {
    expect(quoteErrorMessage(code, rules, 3)).toBe(expected);
  });

  it("creche até meia-noite", () => {
    expect(quoteErrorMessage("HORARIO_CRECHE", { ...rules, daycareStartMinutes: 480, daycareEndMinutes: 1439 }, 3)).toBe(
      "Na creche, a saída é entre 08:00 e meia-noite.",
    );
  });

  it("usa plural quando a estadia mínima é maior que 1", () => {
    expect(quoteErrorMessage("MIN_NOITES", { ...rules, minNights: 2 }, 3)).toBe("A estadia mínima é de 2 diárias.");
  });
});
