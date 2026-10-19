import { ceilDiv } from "./money";
import type { CardFee } from "./types";

export interface CardOption {
  id: string;
  label: string;
  installments: number;
  totalCents: number;
  installmentCents: number;
}

export function cardTotalCents(pixTotalCents: number, feeBasisPoints: number): number {
  return ceilDiv(pixTotalCents * 10_000, 10_000 - feeBasisPoints);
}

export function cardOptions(pixTotalCents: number, fees: CardFee[]): CardOption[] {
  return fees.map((fee) => {
    const totalCents = cardTotalCents(pixTotalCents, fee.feeBasisPoints);
    return {
      id: fee.id,
      label: fee.label,
      installments: fee.installments,
      totalCents,
      installmentCents: ceilDiv(totalCents, fee.installments),
    };
  });
}

export function singlePaymentOptions(options: CardOption[]): CardOption[] {
  return options.filter((option) => option.installments === 1);
}

export function installmentOptions(options: CardOption[]): CardOption[] {
  return options.filter((option) => option.installments > 1);
}

export function optionsForMessage(options: CardOption[], chosenInstallments: number | null): CardOption[] {
  return options.filter(
    (option) => option.installments === 1 || (chosenInstallments !== null && option.installments === chosenInstallments),
  );
}
