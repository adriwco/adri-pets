export const MIXED_BREED = "SRD";

export interface GalleryFacts {
  petName: string;
  takenAt: string;
  order?: number | undefined;
}

function compareByOrder(first: GalleryFacts, second: GalleryFacts): number {
  if (first.order !== undefined && second.order !== undefined) {
    return first.order - second.order;
  }
  if (first.order !== undefined || second.order !== undefined) {
    return first.order !== undefined ? -1 : 1;
  }
  return 0;
}

export function sortGallery<T extends GalleryFacts>(items: readonly T[]): T[] {
  return [...items].sort(
    (first, second) =>
      compareByOrder(first, second) ||
      second.takenAt.localeCompare(first.takenAt) ||
      first.petName.localeCompare(second.petName, "pt-BR"),
  );
}

export function stepIndex(current: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return (((current + delta) % length) + length) % length;
}

export const SWIPE_MIN_DISTANCE = 50;

export function swipeDirection(deltaX: number, deltaY: number): -1 | 0 | 1 {
  if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE || Math.abs(deltaX) <= Math.abs(deltaY)) return 0;
  return deltaX < 0 ? 1 : -1;
}
