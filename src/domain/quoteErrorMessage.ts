import type { QuoteErrorCode } from "./calculateQuote";
import { minutesToTime } from "./dates";
import type { RulesConfig } from "./types";

export function quoteErrorMessage(code: QuoteErrorCode, rules: RulesConfig, maxPets: number): string {
  switch (code) {
    case "DATAS_INVALIDAS":
      return "Confira as datas: a saída precisa ser depois da entrada.";
    case "MIN_NOITES":
      return rules.minNights === 1
        ? "A estadia mínima é de 1 diária."
        : `A estadia mínima é de ${rules.minNights} diárias.`;
    case "MAX_NOITES":
      return `Para estadias acima de ${rules.maxNights} diárias, me chama no WhatsApp que a gente combina.`;
    case "DATA_NO_PASSADO":
      return "A data de entrada já passou. Escolha uma data a partir de hoje.";
    case "FORA_DO_HORIZONTE":
      return "Essa data ainda está bem longe. Me chama no WhatsApp para combinarmos.";
    case "SEM_PETS":
      return "Adicione pelo menos um pet.";
    case "MAX_PETS":
      return `Recebo no máximo ${maxPets} pets por vez.`;
    case "HORARIO_INVALIDO":
      return "Confira o horário de saída.";
    case "CRECHE_INDISPONIVEL":
      return "A creche não está disponível no momento.";
    case "HORARIO_CRECHE":
      return rules.daycareEndMinutes >= 1439
        ? `Na creche, a saída é entre ${minutesToTime(rules.daycareStartMinutes)} e meia-noite.`
        : `Na creche, o horário é das ${minutesToTime(rules.daycareStartMinutes)} às ${minutesToTime(rules.daycareEndMinutes)}.`;
  }
}
