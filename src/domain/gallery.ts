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
