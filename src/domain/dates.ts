const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function toUtcMs(isoDate: string): number {
  const match = ISO_DATE.exec(isoDate);
  if (!match) {
    return Number.NaN;
  }
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isValidIsoDate(value: string): boolean {
  const ms = toUtcMs(value);
  return !Number.isNaN(ms) && fromUtcMs(ms) === value;
}

export function addDays(isoDate: string, days: number): string {
  return fromUtcMs(toUtcMs(isoDate) + days * MS_PER_DAY);
}

export function diffDays(fromIsoDate: string, toIsoDate: string): number {
  return Math.round((toUtcMs(toIsoDate) - toUtcMs(fromIsoDate)) / MS_PER_DAY);
}

export function eachNight(checkInDate: string, checkOutDate: string): string[] {
  const nights = diffDays(checkInDate, checkOutDate);
  return Array.from({ length: Math.max(nights, 0) }, (_, index) => addDays(checkInDate, index));
}

export function todayInTimeZone(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const rest = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${rest}`;
}

export function timeToMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}
