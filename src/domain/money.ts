export function roundDiv(numerator: number, denominator: number): number {
  return Math.floor((numerator * 2 + denominator) / (2 * denominator));
}

export function ceilDiv(numerator: number, denominator: number): number {
  return Math.floor((numerator + denominator - 1) / denominator);
}

export function formatCurrency(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const reais = Math.floor(absolute / 100).toString();
  const centavos = (absolute % 100).toString().padStart(2, "0");
  const reaisWithDots = reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}R$ ${reaisWithDots},${centavos}`;
}
