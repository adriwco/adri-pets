import { describe, expect, it } from "vitest";
import {
  conversationNotices,
  evaluateNotices,
  needsSpecialCare,
  shouldAskHeat,
  visibleNotices,
  type PetAnswers,
} from "../../src/domain/evaluateNotices";
import { petAnswers } from "./fixtures";

const codes = (overrides: Partial<PetAnswers>) => evaluateNotices(petAnswers(overrides)).map((notice) => notice.code);

describe("evaluateNotices: tabela da §7", () => {
  it.each<[string, Partial<PetAnswers>, string[]]>([
    ["macho castrado, tudo em dia", {}, []],
    ["macho não castrado", { neutered: false }, ["MACHO_NAO_CASTRADO"]],
    ["fêmea castrada", { sex: "FEMEA", neutered: true, inHeat: "SIM" }, []],
    ["fêmea não castrada fora do cio", { sex: "FEMEA", neutered: false, inHeat: "NAO" }, ["FEMEA_NAO_CASTRADA"]],
    ["fêmea não castrada sem resposta do cio", { sex: "FEMEA", neutered: false, inHeat: null }, ["FEMEA_NAO_CASTRADA"]],
    ["fêmea no cio", { sex: "FEMEA", neutered: false, inHeat: "SIM" }, ["FEMEA_NAO_CASTRADA", "FEMEA_NO_CIO"]],
    ["fêmea não sabe do cio", { sex: "FEMEA", neutered: false, inHeat: "NAO_SEI" }, ["FEMEA_NAO_CASTRADA", "FEMEA_NO_CIO"]],
    ["não sociável", { socialWithDogs: "NAO" }, ["SOCIABILIDADE"]],
    ["sociabilidade desconhecida", { socialWithDogs: "NAO_SEI" }, ["SOCIABILIDADE"]],
    ["vacinas atrasadas", { vaccines: "NAO" }, ["VACINAS"]],
    ["vacinas a confirmar", { vaccines: "VOU_CONFIRMAR" }, ["VACINAS"]],
    ["agressividade", { aggressionHistory: true }, ["AGRESSIVIDADE"]],
    ["injeção", { medication: "INJECAO" }, ["INJECAO"]],
    ["comprimido", { medication: "COMPRIMIDO" }, ["REMEDIO_ORAL_OU_POMADA"]],
    ["pomada", { medication: "POMADA" }, ["REMEDIO_ORAL_OU_POMADA"]],
    ["respostas em branco", { sex: null, neutered: null, socialWithDogs: null, vaccines: null, aggressionHistory: null, medication: null }, []],
  ])("%s", (_name, overrides, expected) => {
    expect(codes(overrides)).toEqual(expected);
  });
});

describe("níveis de aviso", () => {
  it("macho não castrado não aparece na tela nem no bloco de conversa", () => {
    const notices = evaluateNotices(petAnswers({ neutered: false }));
    expect(notices.map((notice) => notice.level)).toEqual(["DISCRETO"]);
    expect(visibleNotices(notices)).toEqual([]);
    expect(conversationNotices(notices)).toEqual([]);
  });

  it("remédio por comprimido aparece na tela mas não no bloco de conversa", () => {
    const notices = evaluateNotices(petAnswers({ medication: "COMPRIMIDO" }));
    expect(visibleNotices(notices)).toHaveLength(1);
    expect(conversationNotices(notices)).toEqual([]);
  });

  it("nenhum texto de aviso usa emoji de alerta", () => {
    const all = evaluateNotices(
      petAnswers({
        sex: "FEMEA",
        neutered: false,
        inHeat: "SIM",
        socialWithDogs: "NAO",
        vaccines: "NAO",
        aggressionHistory: true,
        medication: "INJECAO",
      }),
    );
    expect(all.some((notice) => /[⚠❗❌✅]/u.test(notice.text))).toBe(false);
  });
});

describe("regras auxiliares", () => {
  it("só pergunta do cio para fêmea não castrada", () => {
    expect([
      shouldAskHeat({ sex: "FEMEA", neutered: false }),
      shouldAskHeat({ sex: "FEMEA", neutered: true }),
      shouldAskHeat({ sex: "MACHO", neutered: false }),
      shouldAskHeat({ sex: "FEMEA", neutered: null }),
    ]).toEqual([true, false, false, false]);
  });

  it("cuidado especial só para comprimido ou pomada; filhote e injeção não", () => {
    expect([
      needsSpecialCare({ medication: "NAO" }),
      needsSpecialCare({ medication: "COMPRIMIDO" }),
      needsSpecialCare({ medication: "POMADA" }),
      needsSpecialCare({ medication: "INJECAO" }),
      needsSpecialCare({ medication: null }),
    ]).toEqual([false, true, true, false, false]);
  });
});
