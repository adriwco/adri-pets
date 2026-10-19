import type { MedicationAnswer, PetAnswers, PetSex, TriState, VaccineAnswer } from "../domain/evaluateNotices";
import { PET_SIZES, type PetSize } from "../domain/types";
import type { PetView } from "../viewModels/useQuoteSimulator";
import { ChoiceGroup } from "./ChoiceGroup";
import { Icon } from "./Icon";

interface PetFieldsProps {
  index: number;
  view: PetView;
  sizeLabels: Record<PetSize, string>;
  puppyMaxAgeMonths: number;
  canRemove: boolean;
  onChange: (patch: Partial<PetAnswers>) => void;
  onRemove: () => void;
}

const YES_NO = [
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Não" },
] as const;

const PAW_SIZE: Record<PetSize, number> = { PEQUENO: 16, MEDIO: 22, GRANDE: 30, GIGANTE: 38 };

function booleanToChoice(value: boolean | null): "SIM" | "NAO" | null {
  return value === null ? null : value ? "SIM" : "NAO";
}

function splitSizeLabel(label: string): { name: string; detail: string } {
  const match = /^(.*?)\s*\((.*)\)$/.exec(label);
  return match ? { name: match[1] ?? label, detail: match[2] ?? "" } : { name: label, detail: "" };
}

export function PetFields({ index, view, sizeLabels, puppyMaxAgeMonths, canRemove, onChange, onRemove }: PetFieldsProps) {
  const { pet, askHeat, notices, food } = view;
  const prefix = `pet-${index}`;
  const displayName = pet.name.trim() || `Pet ${index + 1}`;

  return (
    <section class="card space-y-5" aria-labelledby={`${prefix}-title`}>
      <div class="flex items-center justify-between gap-3">
        <h3 id={`${prefix}-title`} class="flex items-center gap-2 text-xl font-semibold">
          <span class="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Icon name="paw" size={20} />
          </span>
          {displayName}
        </h3>
        {canRemove && (
          <button type="button" class="min-h-11 text-sm text-faint underline underline-offset-4" onClick={onRemove}>
            Remover
          </button>
        )}
      </div>

      <label class="field">
        <span>Nome</span>
        <input
          type="text"
          maxLength={40}
          autocomplete="off"
          value={pet.name}
          onInput={(event) => onChange({ name: event.currentTarget.value })}
        />
      </label>

      <fieldset>
        <legend class="mb-2 text-sm font-bold text-ink">Porte</legend>
        <div class="grid grid-cols-4 gap-2">
          {PET_SIZES.map((size) => {
            const { name, detail } = splitSizeLabel(sizeLabels[size]);
            return (
              <label key={size} class="size-card">
                <input
                  type="radio"
                  class="sr-only"
                  name={`${prefix}-size`}
                  value={size}
                  checked={pet.size === size}
                  onChange={() => onChange({ size })}
                />
                <span>
                  <Icon name="paw" size={PAW_SIZE[size]} />
                  {name}
                  {detail && <small class="-mt-1 text-[10px] font-semibold text-faint">{detail}</small>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <ChoiceGroup<PetSex>
        name={`${prefix}-sex`}
        legend="Sexo"
        value={pet.sex}
        options={[
          { value: "MACHO", label: "Macho" },
          { value: "FEMEA", label: "Fêmea" },
        ]}
        onChange={(sex) => onChange({ sex })}
      />

      <ChoiceGroup
        name={`${prefix}-neutered`}
        legend={pet.sex === "FEMEA" ? "É castrada?" : "É castrado?"}
        value={booleanToChoice(pet.neutered)}
        options={[...YES_NO]}
        onChange={(value) => onChange({ neutered: value === "SIM" })}
      />

      {askHeat && (
        <ChoiceGroup<TriState>
          name={`${prefix}-heat`}
          legend="Está no cio ou perto do cio?"
          value={pet.inHeat}
          options={[...YES_NO, { value: "NAO_SEI", label: "Não sei" }]}
          onChange={(inHeat) => onChange({ inHeat })}
        />
      )}

      <ChoiceGroup<TriState>
        name={`${prefix}-social`}
        legend="Convive bem com outros cães?"
        value={pet.socialWithDogs}
        options={[...YES_NO, { value: "NAO_SEI", label: "Não sei" }]}
        onChange={(socialWithDogs) => onChange({ socialWithDogs })}
      />

      <ChoiceGroup<VaccineAnswer>
        name={`${prefix}-vaccines`}
        legend="Vacinas e antipulgas em dia?"
        value={pet.vaccines}
        options={[...YES_NO, { value: "VOU_CONFIRMAR", label: "Vou confirmar" }]}
        onChange={(vaccines) => onChange({ vaccines })}
      />

      <ChoiceGroup
        name={`${prefix}-aggression`}
        legend="Já teve algum episódio de agressividade?"
        value={booleanToChoice(pet.aggressionHistory)}
        options={[...YES_NO]}
        onChange={(value) => onChange({ aggressionHistory: value === "SIM" })}
      />

      <ChoiceGroup<MedicationAnswer>
        name={`${prefix}-medication`}
        legend="Precisa de remédio durante a estadia?"
        value={pet.medication}
        options={[
          { value: "NAO", label: "Não" },
          { value: "COMPRIMIDO", label: "Comprimido" },
          { value: "POMADA", label: "Pomada" },
          { value: "INJECAO", label: "Injeção" },
        ]}
        onChange={(medication) => onChange({ medication })}
      />

      <label class="flex min-h-11 items-center gap-3 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          class="size-5 accent-brand"
          checked={pet.isPuppy}
          onChange={(event) => onChange({ isPuppy: event.currentTarget.checked })}
        />
        É filhote (menos de {puppyMaxAgeMonths} meses)
      </label>

      <label class="field">
        <span>Quantas gramas de ração ele come por dia? (opcional)</span>
        <input
          type="number"
          inputMode="numeric"
          min={10}
          max={2000}
          step={10}
          value={pet.foodGramsPerDay ?? ""}
          onInput={(event) => {
            const raw = event.currentTarget.value;
            onChange({ foodGramsPerDay: raw === "" ? null : Math.round(Number(raw)) });
          }}
        />
        {food && (
          <small class="text-sm font-normal text-ink">
            Traga cerca de <strong>{food.kgLabel}</strong> de ração para {displayName} (já com 15% de folga).
          </small>
        )}
      </label>

      {notices.length > 0 && (
        <ul class="space-y-2" aria-live="polite">
          {notices.map((notice) => (
            <li key={notice.code} class="note">
              {notice.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
