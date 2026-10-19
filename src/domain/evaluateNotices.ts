import type { PetSize } from "./types";

export type PetSex = "MACHO" | "FEMEA";
export type TriState = "SIM" | "NAO" | "NAO_SEI";
export type VaccineAnswer = "SIM" | "NAO" | "VOU_CONFIRMAR";
export type MedicationAnswer = "NAO" | "COMPRIMIDO" | "POMADA" | "INJECAO";

export interface PetAnswers {
  name: string;
  size: PetSize;
  sex: PetSex | null;
  neutered: boolean | null;
  inHeat: TriState | null;
  socialWithDogs: TriState | null;
  vaccines: VaccineAnswer | null;
  aggressionHistory: boolean | null;
  medication: MedicationAnswer | null;
  isPuppy: boolean;
  foodGramsPerDay: number | null;
}

export type NoticeLevel = "DISCRETO" | "INFORMATIVO" | "ATENCAO" | "IMPORTANTE";

export type NoticeCode =
  | "MACHO_NAO_CASTRADO"
  | "FEMEA_NAO_CASTRADA"
  | "FEMEA_NO_CIO"
  | "SOCIABILIDADE"
  | "VACINAS"
  | "AGRESSIVIDADE"
  | "INJECAO"
  | "REMEDIO_ORAL_OU_POMADA";

export interface Notice {
  code: NoticeCode;
  level: NoticeLevel;
  text: string;
}

const NOTICES: Record<NoticeCode, Notice> = {
  MACHO_NAO_CASTRADO: { code: "MACHO_NAO_CASTRADO", level: "DISCRETO", text: "" },
  FEMEA_NAO_CASTRADA: {
    code: "FEMEA_NAO_CASTRADA",
    level: "ATENCAO",
    text: "Para fêmeas não castradas, preciso conversar antes para ver a disponibilidade, por causa dos outros hóspedes.",
  },
  FEMEA_NO_CIO: {
    code: "FEMEA_NO_CIO",
    level: "IMPORTANTE",
    text: "Fêmeas no cio precisam de um combinado especial. Me chama para vermos as datas.",
  },
  SOCIABILIDADE: {
    code: "SOCIABILIDADE",
    level: "ATENCAO",
    text: "Como a casa recebe outros cães, vamos conversar sobre a adaptação.",
  },
  VACINAS: {
    code: "VACINAS",
    level: "ATENCAO",
    text: "Vou pedir a foto da carteira de vacinação na conversa.",
  },
  AGRESSIVIDADE: {
    code: "AGRESSIVIDADE",
    level: "IMPORTANTE",
    text: "Prefiro conversar antes para ver se consigo receber com segurança.",
  },
  INJECAO: {
    code: "INJECAO",
    level: "IMPORTANTE",
    text: "Não aplico injeções. Me chama para vermos uma alternativa.",
  },
  REMEDIO_ORAL_OU_POMADA: {
    code: "REMEDIO_ORAL_OU_POMADA",
    level: "INFORMATIVO",
    text: "Dou comprimidos e pomadas nos horários combinados.",
  },
};

export function shouldAskHeat(pet: Pick<PetAnswers, "sex" | "neutered">): boolean {
  return pet.sex === "FEMEA" && pet.neutered === false;
}

export function evaluateNotices(pet: PetAnswers): Notice[] {
  const codes: NoticeCode[] = [];
  if (pet.sex === "MACHO" && pet.neutered === false) {
    codes.push("MACHO_NAO_CASTRADO");
  }
  if (shouldAskHeat(pet)) {
    codes.push("FEMEA_NAO_CASTRADA");
    if (pet.inHeat === "SIM" || pet.inHeat === "NAO_SEI") {
      codes.push("FEMEA_NO_CIO");
    }
  }
  if (pet.socialWithDogs === "NAO" || pet.socialWithDogs === "NAO_SEI") {
    codes.push("SOCIABILIDADE");
  }
  if (pet.vaccines === "NAO" || pet.vaccines === "VOU_CONFIRMAR") {
    codes.push("VACINAS");
  }
  if (pet.aggressionHistory === true) {
    codes.push("AGRESSIVIDADE");
  }
  if (pet.medication === "INJECAO") {
    codes.push("INJECAO");
  }
  if (pet.medication === "COMPRIMIDO" || pet.medication === "POMADA") {
    codes.push("REMEDIO_ORAL_OU_POMADA");
  }
  return codes.map((code) => NOTICES[code]);
}

export function visibleNotices(notices: Notice[]): Notice[] {
  return notices.filter((notice) => notice.level !== "DISCRETO");
}

export function conversationNotices(notices: Notice[]): Notice[] {
  return notices.filter((notice) => notice.level === "ATENCAO" || notice.level === "IMPORTANTE");
}

export function needsSpecialCare(pet: Pick<PetAnswers, "medication">): boolean {
  return pet.medication === "COMPRIMIDO" || pet.medication === "POMADA";
}
