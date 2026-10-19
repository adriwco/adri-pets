export type IconName =
  | "paw"
  | "whatsapp"
  | "sun"
  | "house"
  | "pill"
  | "bath"
  | "arrow-right"
  | "arrow-left"
  | "check"
  | "calendar"
  | "plus";

interface IconProps {
  name: IconName;
  size?: number;
  class?: string;
}

const STROKE_PATHS: Record<Exclude<IconName, "paw">, string[]> = {
  whatsapp: ["M21 12a8.5 8.5 0 0 1-12.4 7.5L3.5 21l1.5-5A8.5 8.5 0 1 1 21 12z"],
  sun: [
    "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z",
    "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  ],
  house: ["M3 11 12 4l9 7", "M5 10v10h14V10"],
  pill: ["M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7z", "m8.5 8.5 7 7"],
  bath: ["M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z", "M6 12V6a2 2 0 0 1 4 0", "M7 19l-1 2M17 19l1 2"],
  "arrow-right": ["M5 12h14M13 6l6 6-6 6"],
  "arrow-left": ["M19 12H5M11 6l-6 6 6 6"],
  check: ["M5 12l5 5 9-10"],
  calendar: ["M4 6h16v14H4z", "M4 10h16M8 3v4M16 3v4"],
  plus: ["M12 5v14M5 12h14"],
};

export function Icon({ name, size = 24, class: className }: IconProps) {
  if (name === "paw") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" class={className} fill="currentColor" aria-hidden="true">
        <ellipse cx="12" cy="15.5" rx="4.2" ry="3.6" />
        <circle cx="6.5" cy="9.5" r="1.9" />
        <circle cx="9.8" cy="5.8" r="1.9" />
        <circle cx="14.2" cy="5.8" r="1.9" />
        <circle cx="17.5" cy="9.5" r="1.9" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      class={className}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {STROKE_PATHS[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
