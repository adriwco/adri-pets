import { formatDateBR } from "../domain/dates";
import { formatCurrency } from "../domain/money";
import type { SiteConfig } from "../domain/types";
import type { QuoteSimulatorViewModel } from "../viewModels/useQuoteSimulator";
import { Icon } from "./Icon";

interface QuoteSummaryProps {
  vm: QuoteSimulatorViewModel;
  config: SiteConfig;
}

const ACTION_FEEDBACK = {
  idle: "",
  copied: "Orçamento copiado. Agora é só colar no WhatsApp.",
  "copy-failed": "Não consegui copiar. Use o botão do WhatsApp.",
  shared: "Orçamento compartilhado.",
} as const;

export function QuoteSummary({ vm, config }: QuoteSummaryProps) {
  const { quoteView, errorMessage, datesReady, petViews } = vm;

  if (!datesReady) {
    return (
      <div class="card flex items-center gap-3 text-faint" aria-live="polite">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="calendar" size={20} />
        </span>
        Escolha as datas para ver o orçamento na hora.
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div class="note" role="status" aria-live="polite">
        {errorMessage}
      </div>
    );
  }

  if (!quoteView) {
    return null;
  }

  const { quote, singlePayments, installments, chosenInstallment, cardBrand, availability, message, waitlistMessage } =
    quoteView;
  const petName = (inputIndex: number) =>
    petViews[inputIndex]?.pet.name.trim() || `Pet ${inputIndex + 1}`;
  const conversationNotices = petViews.flatMap((view, index) =>
    view.notices.filter((notice) => notice.level !== "INFORMATIVO").map((notice) => ({ notice, index })),
  );
  const foods = petViews.flatMap((view, index) => (view.food ? [{ food: view.food, index }] : []));

  const names = petViews.map((view, index) => view.pet.name.trim() || `Pet ${index + 1}`);
  const ticketTitle = names.length === 1 ? `Reserva do ${names[0]}` : `Reserva de ${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
  const stayLabel =
    quote.serviceType === "CRECHE" ? "Creche" : `${quote.nights} ${quote.nights === 1 ? "diária" : "diárias"}`;

  return (
    <div class="overflow-hidden rounded-3xl bg-white shadow-[0_10px_28px_rgba(122,78,45,0.14)]" aria-live="polite">
      <div class="flex items-center justify-between gap-3 bg-accent px-5 py-3.5 text-white">
        <span class="font-display text-lg font-semibold">{ticketTitle}</span>
        <span class="shrink-0 text-sm font-bold">{stayLabel}</span>
      </div>
      <dl class="space-y-1.5 px-5 py-4 text-sm">
        <div class="flex justify-between gap-4">
          <dt class="text-faint">{quote.serviceType === "CRECHE" ? "Dia" : "Chegada"}</dt>
          <dd class="font-bold">{formatDateBR(vm.form.checkInDate)}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-faint">Saída</dt>
          <dd class="font-bold">
            {quote.serviceType === "CRECHE" ? "" : `${formatDateBR(vm.form.checkOutDate)}, `}
            às {vm.form.checkOutTime}
          </dd>
        </div>
      </dl>
      <div class="mx-5 border-t-2 border-dashed border-line" aria-hidden="true"></div>

      <div class="space-y-5 px-5 pb-5 pt-4">
      <div>
        <p class="flex flex-wrap items-baseline gap-x-2">
          <span class="font-display text-[38px] font-bold leading-tight text-brand">{formatCurrency(quote.totalCents)}</span>
          <span class="font-bold text-faint">no PIX</span>
        </p>
        {quote.depositCents !== null && quote.balanceCents !== null && config.prices.depositPct !== null && (
          <label class="mt-3 flex items-start gap-3 rounded-2xl bg-paper p-3 text-sm text-ink">
            <input
              type="checkbox"
              class="mt-0.5 size-5 accent-brand"
              checked={vm.form.wantsDeposit}
              onChange={(event) => vm.update({ wantsDeposit: event.currentTarget.checked })}
            />
            <span>
              Quero garantir a vaga já com o sinal de {config.prices.depositPct}%:{" "}
              <strong>{formatCurrency(quote.depositCents)}</strong> no PIX
              <span class="block text-faint">O restante ({formatCurrency(quote.balanceCents)}) você paga na entrega do pet.</span>
            </span>
          </label>
        )}
      </div>

      {(singlePayments.length > 0 || installments.length > 0) && (
        <div class="space-y-2">
          <p class="text-sm font-bold text-ink">No cartão (com a taxa da maquininha)</p>
          {config.cardBrands.length > 1 && (
            <fieldset>
              <legend class="sr-only">Bandeira do cartão</legend>
              <div class="flex flex-wrap gap-2">
                {config.cardBrands.map((brand) => (
                  <label key={brand.id} class="choice">
                    <input
                      type="radio"
                      class="sr-only"
                      name="cardBrand"
                      value={brand.id}
                      checked={cardBrand?.id === brand.id}
                      onChange={() => vm.update({ cardBrandId: brand.id })}
                    />
                    <span>{brand.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <ul class="space-y-1 text-sm text-ink">
            {singlePayments.map((card) => (
              <li key={card.id} class="flex justify-between gap-4">
                <span>{card.label}</span>
                <span>{formatCurrency(card.totalCents)}</span>
              </li>
            ))}
          </ul>
          {installments.length > 0 && (
            <label class="field">
              <span>Quer parcelar?</span>
              <select
                value={chosenInstallment?.installments ?? ""}
                onChange={(event) => {
                  const raw = event.currentTarget.value;
                  vm.update({ installments: raw === "" ? null : Number(raw) });
                }}
              >
                <option value="">Ver opções de parcelamento</option>
                {installments.map((card) => (
                  <option key={card.id} value={card.installments}>
                    {`${card.installments}x de ~${formatCurrency(card.installmentCents)} (total ${formatCurrency(card.totalCents)})`}
                  </option>
                ))}
              </select>
              <small class="text-xs font-normal text-faint">O valor exato da parcela é o da maquininha.</small>
            </label>
          )}
        </div>
      )}

      <details class="text-sm text-ink">
        <summary class="min-h-8 cursor-pointer font-bold text-brand">Ver detalhes do cálculo</summary>
        <ul class="mt-2 space-y-1">
          {quote.pets.map((pet) => {
            const total = quote.lines
              .filter((line) => line.inputIndex === pet.inputIndex)
              .reduce((sum, line) => sum + line.cents, 0);
            return (
              <li key={pet.inputIndex} class="flex justify-between gap-4">
                <span>
                  {petName(pet.inputIndex)} ({config.sizeLabels[pet.size].split(" (")[0]?.toLowerCase()})
                  {pet.multiPetDiscountCents > 0 && ` · ${formatCurrency(pet.multiPetDiscountCents)} a menos por dia`}
                </span>
                <span>{formatCurrency(total)}</span>
              </li>
            );
          })}
          {quote.seasonNames.length > 0 && (
            <li class="text-faint">Inclui valores de temporada: {quote.seasonNames.join(", ")}</li>
          )}
          {quote.longStayDiscountCents > 0 && (
            <li class="flex justify-between gap-4">
              <span>Desconto de estadia longa ({quote.longStayPct}%)</span>
              <span>-{formatCurrency(quote.longStayDiscountCents)}</span>
            </li>
          )}
          {quote.lateFeeCents > 0 && (
            <li class="flex justify-between gap-4">
              <span>Saída depois do meio-dia ({quote.lateCheckoutKind === "MEIA" ? "meia diária" : "diária cheia"})</span>
              <span>{formatCurrency(quote.lateFeeCents)}</span>
            </li>
          )}
          {quote.specialCareCents > 0 && (
            <li class="flex justify-between gap-4">
              <span>Remédio (comprimido ou pomada)</span>
              <span>{formatCurrency(quote.specialCareCents)}</span>
            </li>
          )}
        </ul>
      </details>

      {foods.length > 0 && (
        <ul class="space-y-1 text-sm text-ink">
          {foods.map(({ food, index }) => (
            <li key={index}>
              Ração para {petName(index)}: cerca de <strong>{food.kgLabel}</strong>
            </li>
          ))}
        </ul>
      )}

      {availability.fullDates.length > 0 && (
        <p class="note">
          Estou sem vaga em {availability.fullDates.map(formatDateBR).join(", ")}. Posso te avisar se abrir uma vaga.
        </p>
      )}
      {availability.fullDates.length === 0 && availability.fewSlotsDates.length > 0 && (
        <p class="note">Última vaga em {availability.fewSlotsDates.map(formatDateBR).join(", ")}.</p>
      )}

      {conversationNotices.length > 0 && (
        <div class="note space-y-1">
          <p class="font-bold">Para conversarmos:</p>
          <ul class="list-disc space-y-1 pl-5">
            {conversationNotices.map(({ notice, index }) => (
              <li key={`${index}-${notice.code}`}>
                {petName(index)}: {notice.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div class="space-y-3">
        {waitlistMessage ? (
          <a class="btn-brand" href={waitlistMessage.url} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={20} />
            Entrar na lista de espera pelo WhatsApp
          </a>
        ) : (
          <a class="btn-brand" href={message.url} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={20} />
            Quero reservar pelo WhatsApp
          </a>
        )}
        <p class="text-center text-xs text-faint">
          Você será levado ao WhatsApp com o orçamento pronto. É só enviar.
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <button type="button" class="btn-secondary" onClick={vm.copyQuote}>
            Copiar orçamento
          </button>
          {vm.canShare && (
            <button type="button" class="btn-secondary" onClick={vm.shareQuote}>
              Compartilhar
            </button>
          )}
        </div>
        <p class="min-h-5 text-center text-sm text-ink" role="status">
          {ACTION_FEEDBACK[vm.actionStatus]}
        </p>
      </div>

      <p class="text-xs text-faint">Orçamento estimado. A vaga é confirmada pelo WhatsApp.</p>
      </div>
    </div>
  );
}
