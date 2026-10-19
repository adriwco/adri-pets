import { arrivalRuleText, checkoutRuleText, daycareRuleText } from "../domain/rulesText";
import type { SiteConfig } from "../domain/types";
import { useQuoteSimulator } from "../viewModels/useQuoteSimulator";
import { PetFields } from "./PetFields";
import { QuoteSummary } from "./QuoteSummary";

interface QuoteSimulatorProps {
  config: SiteConfig;
}

export function QuoteSimulator({ config }: QuoteSimulatorProps) {
  const vm = useQuoteSimulator(config);
  const form = vm.form;
  const rules = config.rules;
  const isDaycare = form.serviceType === "CRECHE";

  return (
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      <form class="space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
        {rules.daycareEnabled && (
          <div class="card">
            <fieldset class="space-y-2">
              <legend class="text-sm font-medium text-ink">Serviço</legend>
              <div class="flex flex-wrap gap-2">
                {(
                  [
                    ["HOSPEDAGEM", "Hospedagem (dorme aqui)"],
                    ["CRECHE", "Creche (passa o dia)"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} class="choice">
                    <input
                      type="radio"
                      class="sr-only"
                      name="serviceType"
                      value={value}
                      checked={form.serviceType === value}
                      onChange={() => vm.update({ serviceType: value })}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        <div class="card grid gap-4 sm:grid-cols-3">
          <label class="field">
            <span>{isDaycare ? "Dia" : "Entrada"}</span>
            <input
              type="date"
              min={vm.today}
              max={vm.maxCheckInDate}
              value={form.checkInDate}
              onChange={(event) => vm.update({ checkInDate: event.currentTarget.value })}
            />
          </label>
          {!isDaycare && (
            <label class="field">
              <span>Saída</span>
              <input
                type="date"
                min={form.checkInDate || vm.today}
                value={form.checkOutDate}
                onChange={(event) => vm.update({ checkOutDate: event.currentTarget.value })}
              />
            </label>
          )}
          <label class="field">
            <span>Horário de saída</span>
            <input
              type="time"
              step={900}
              value={form.checkOutTime}
              onChange={(event) => vm.update({ checkOutTime: event.currentTarget.value })}
            />
          </label>
          <p class="text-xs text-muted sm:col-span-3">
            {isDaycare ? daycareRuleText(rules) : `${arrivalRuleText(rules)} ${checkoutRuleText(rules)}`}
          </p>
        </div>

        <div class="space-y-4">
          {vm.petViews.map((view, index) => (
            <PetFields
              key={index}
              index={index}
              view={view}
              sizeLabels={config.sizeLabels}
              puppyMaxAgeMonths={rules.puppyMaxAgeMonths}
              canRemove={form.pets.length > 1}
              onChange={(patch) => vm.updatePet(index, patch)}
              onRemove={() => vm.removePet(index)}
            />
          ))}
          {vm.canAddPet ? (
            <button type="button" class="btn-secondary w-full" onClick={vm.addPet}>
              Adicionar outro pet
            </button>
          ) : (
            <p class="text-center text-sm text-muted">
              Recebo no máximo {config.capacity.maxPetsPerBooking} pets por vez, para que cada um tenha atenção de
              verdade.
            </p>
          )}
        </div>

        <div class="card space-y-4">
          {config.bathService.enabled && (
            <label class="flex items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                class="mt-0.5 size-5 accent-brand-strong"
                checked={form.wantsBath}
                onChange={(event) => vm.update({ wantsBath: event.currentTarget.checked })}
              />
              <span>
                Quero banho durante a estadia
                <span class="block text-muted">{config.bathService.priceNote}</span>
              </span>
            </label>
          )}
          <label class="field">
            <span>Alguma observação? (opcional)</span>
            <textarea
              rows={3}
              maxLength={200}
              value={form.notes}
              onInput={(event) => vm.update({ notes: event.currentTarget.value })}
            />
          </label>
          <button type="button" class="text-sm text-muted underline underline-offset-4" onClick={vm.reset}>
            Limpar simulação
          </button>
        </div>
      </form>

      <aside class="lg:sticky lg:top-6">
        <QuoteSummary vm={vm} config={config} />
      </aside>
    </div>
  );
}
