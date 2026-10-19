import { useEffect, useRef } from "preact/hooks";
import { formatCurrency } from "../domain/money";
import { arrivalRuleText, checkoutRuleText, daycareRuleText } from "../domain/rulesText";
import type { SiteConfig } from "../domain/types";
import { SIMULATOR_STEPS, useQuoteSimulator } from "../viewModels/useQuoteSimulator";
import { Icon } from "./Icon";
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
  const topRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [vm.step]);

  const quote = vm.quoteView?.quote ?? null;
  const stayLabel = quote
    ? `${quote.serviceType === "CRECHE" ? "Creche" : `${quote.nights} ${quote.nights === 1 ? "diária" : "diárias"}`} · ${quote.pets.length} ${quote.pets.length === 1 ? "pet" : "pets"}`
    : "";

  return (
    <div ref={topRef} class="scroll-mt-4">
      <ol class="mb-6 flex items-center gap-2" aria-label="Etapas do orçamento">
        {SIMULATOR_STEPS.map(({ step, label }, index) => {
          const done = step < vm.step;
          const current = step === vm.step;
          return (
            <li key={step} class={`flex items-center gap-2 ${index < SIMULATOR_STEPS.length - 1 ? "flex-1" : ""}`}>
              <button
                type="button"
                class="flex min-h-11 items-center gap-1.5"
                aria-current={current ? "step" : undefined}
                onClick={() => vm.goToStep(step)}
              >
                <span
                  class={`flex size-8 items-center justify-center rounded-full text-sm font-extrabold ${
                    current ? "bg-accent text-white" : done ? "bg-brand text-white" : "bg-sand text-faint"
                  }`}
                >
                  {done ? <Icon name="check" size={16} /> : step}
                </span>
                <span class={`text-sm font-bold ${current ? "text-clay" : done ? "text-ink" : "text-faint"}`}>{label}</span>
              </button>
              {index < SIMULATOR_STEPS.length - 1 && (
                <span class={`h-[3px] flex-1 rounded-full ${done ? "bg-brand" : "bg-sand"}`} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <form class="space-y-5" onSubmit={(event) => event.preventDefault()} noValidate>
          {vm.step === 1 && (
            <>
              {rules.daycareEnabled && (
                <div class="card">
                  <fieldset>
                    <legend class="mb-2 text-sm font-bold text-ink">O que você precisa?</legend>
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
                <p class="text-xs text-faint sm:col-span-3">
                  {isDaycare ? daycareRuleText(rules) : `${arrivalRuleText(rules)} ${checkoutRuleText(rules)}`}
                </p>
              </div>

              {(vm.stepError || (vm.datesReady && vm.errorMessage)) && (
                <p class="note" role="status">
                  {vm.stepError ?? vm.errorMessage}
                </p>
              )}

              <button type="button" class="btn-primary" onClick={vm.nextStep}>
                Próximo: os pets
                <Icon name="arrow-right" size={20} />
              </button>
            </>
          )}

          {vm.step === 2 && (
            <>
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
                  <button
                    type="button"
                    class="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-sun-line bg-paper font-bold text-clay"
                    onClick={vm.addPet}
                  >
                    <Icon name="plus" size={18} />
                    Adicionar outro pet
                  </button>
                ) : (
                  <p class="text-center text-sm text-faint">
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
                      class="mt-0.5 size-5 accent-brand"
                      checked={form.wantsBath}
                      onChange={(event) => vm.update({ wantsBath: event.currentTarget.checked })}
                    />
                    <span>
                      <strong>Quero banho durante a estadia</strong>
                      <span class="block text-faint">{config.bathService.priceNote}</span>
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
              </div>

              <div class="flex gap-3">
                <button type="button" class="btn-secondary min-h-13 shrink-0" onClick={vm.previousStep}>
                  <Icon name="arrow-left" size={18} />
                  Voltar
                </button>
                <button type="button" class="btn-primary" onClick={vm.nextStep}>
                  Próximo: o valor
                  <Icon name="arrow-right" size={20} />
                </button>
              </div>
            </>
          )}

          {vm.step === 3 && (
            <>
              <QuoteSummary vm={vm} config={config} />
              <div class="flex flex-wrap items-center justify-between gap-3">
                <button type="button" class="btn-secondary" onClick={() => vm.goToStep(2)}>
                  <Icon name="arrow-left" size={18} />
                  Ajustar os pets
                </button>
                <button type="button" class="min-h-11 text-sm text-faint underline underline-offset-4" onClick={vm.reset}>
                  Começar de novo
                </button>
              </div>
            </>
          )}
        </form>

        {vm.step < 3 && (
          <aside class="hidden lg:sticky lg:top-6 lg:block">
            <QuoteSummary vm={vm} config={config} />
          </aside>
        )}
      </div>

      {vm.step < 3 && quote && (
        <div class="fixed inset-x-3 bottom-4 z-10 flex items-center justify-between gap-3 rounded-3xl bg-ink py-2.5 pl-5 pr-2.5 text-surface shadow-[0_12px_30px_rgba(43,36,32,0.35)] lg:hidden">
          <div class="flex flex-col">
            <span class="text-xs text-sand">{stayLabel}</span>
            <strong class="font-display text-xl">{formatCurrency(quote.totalCents)}</strong>
          </div>
          <button
            type="button"
            class="min-h-11 rounded-full bg-accent px-5 text-sm font-extrabold text-white"
            onClick={() => vm.goToStep(3)}
          >
            Ver orçamento
          </button>
        </div>
      )}
    </div>
  );
}
