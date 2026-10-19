import type { MedicationAnswer, PetAnswers, PetSex, TriState, VaccineAnswer } from "../domain/evaluateNotices";
import { PET_SIZES, type PetSize } from "../domain/types";
import type { PetView } from "../viewModels/useQuoteSimulator";
import { ChoiceGroup } from "./ChoiceGroup";

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

function booleanToChoice(value: boolean | null): "SIM" | "NAO" | null {
  return value === null ? null : value ? "SIM" : "NAO";
}

export function PetFields({ index, view, sizeLabels, puppyMaxAgeMonths, canRemove, onChange, onRemove }: PetFieldsProps) {
  const { pet, askHeat, notices, food } = view;
  const prefix = `pet-${index}`;
  const displayName = pet.name.trim() || `Pet ${index + 1}`;

  return (
    <section class="card space-y-5" aria-labelledby={`${prefix}-title`}>
      <div class="flex items-center justify-between gap-3">
        <h3 id={`${prefix}-title`} class="text-lg font-semibold text-ink">
          {displayName}
        </h3>
        {canRemove && (
          <button type="button" class="text-sm text-muted underline underline-offset-4" onClick={onRemove}>
            Remover
          </button>
        )}
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
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
        <label class="field">
          <span>Porte</span>
          <select value={pet.size} onChange={(event) => onChange({ size: event.currentTarget.value as PetSize })}>
            {PET_SIZES.map((size) => (
              <option key={size} value={size}>
                {sizeLabels[size]}
              </option>
            ))}
          </select>
        </label>
      </div>

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

      <label class="flex items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          class="size-5 accent-brand-strong"
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
          <small class="text-sm text-ink">
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
