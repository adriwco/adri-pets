export interface AvailabilityCheck {
  fullDates: string[];
  fewSlotsDates: string[];
}

export function checkAvailability(
  dates: string[],
  fullDates: string[],
  fewSlotsDates: string[],
): AvailabilityCheck {
  const full = new Set(fullDates);
  const few = new Set(fewSlotsDates);
  return {
    fullDates: dates.filter((date) => full.has(date)),
    fewSlotsDates: dates.filter((date) => few.has(date) && !full.has(date)),
  };
}
