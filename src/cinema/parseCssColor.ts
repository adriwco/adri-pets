export type RgbUnit = [number, number, number];

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_COLOR = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i;

function toUnit(channel: number): number {
  return Math.min(255, Math.max(0, channel)) / 255;
}

export function parseCssColor(value: string): RgbUnit | null {
  const color = value.trim();
  const hex = HEX_COLOR.exec(color)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((digit) => digit + digit).join("") : hex;
    return [0, 2, 4].map((offset) => toUnit(Number.parseInt(full.slice(offset, offset + 2), 16))) as RgbUnit;
  }
  const rgb = RGB_COLOR.exec(color);
  if (rgb) {
    return [toUnit(Number(rgb[1])), toUnit(Number(rgb[2])), toUnit(Number(rgb[3]))];
  }
  return null;
}
