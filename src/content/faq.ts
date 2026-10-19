import { formatCurrency } from "../domain/money";
import type { SiteConfig } from "../domain/types";

export interface FaqItem {
  question: string;
  answer: string;
}

export function buildFaq(config: SiteConfig): FaqItem[] {
  const maxPets = config.capacity.maxPetsPerBooking;
  const { specialCareDailyCents, depositPct } = config.prices;
  const medicationFee = specialCareDailyCents > 0 ? `, com acréscimo de ${formatCurrency(specialCareDailyCents)} por dia` : "";
  const depositSentence =
    depositPct === null ? "" : ` Se quiser garantir a vaga logo, dá para pagar um sinal de ${depositPct}% no PIX.`;
  return [
    {
      question: "Os cães ficam em baias ou gaiolas?",
      answer: "Não. Eles ficam soltos dentro de casa, como se fossem da família, com espaço para brincar e descansar.",
    },
    {
      question: "Quantos cães ficam ao mesmo tempo?",
      answer: `No máximo ${maxPets}. É isso que garante atenção de verdade para cada um.`,
    },
    {
      question: "Como são os passeios?",
      answer:
        "Todos os dias no fim da tarde, quando o chão já esfriou e não machuca as patinhas. Às vezes também bem cedo pela manhã.",
    },
    {
      question: "Vocês dão remédio?",
      answer:
        `Dou comprimidos e pomadas nos horários combinados com você${medicationFee}. Não aplico injeções.`,
    },
    {
      question: "O que preciso levar?",
      answer:
        "A ração do dia a dia e os potes são obrigatórios, além dos remédios e da carteira de vacinação. Brinquedos, petiscos, manta e caminha são bem-vindos para ele se sentir em casa.",
    },
    {
      question: "Recebem fêmea não castrada?",
      answer:
        "Depende das datas e dos outros hóspedes. Me chama no WhatsApp que a gente vê a disponibilidade, principalmente se ela estiver no cio.",
    },
    {
      question: "Como recebo notícias e fotos?",
      answer: "Pelo WhatsApp, durante a estadia.",
    },
    {
      question: "Como funciona o pagamento?",
      answer:
        `Por PIX ou no cartão. No cartão, o valor inclui a taxa da maquininha; o simulador já mostra as duas opções.${depositSentence}`,
    },
    {
      question: "Até que horas posso buscar?",
      answer: "No dia da saída, até meia-noite, sem custo extra.",
    },
    {
      question: "Tem banho?",
      answer: "Tem. Eu levo e busco no pet shop aqui perto, sem custo. Você paga só o banho.",
    },
  ];
}
