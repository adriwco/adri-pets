export interface CinemaEnvironment {
  prefersReducedMotion: boolean;
  saveData: boolean;
}

export function shouldStartCinema({ prefersReducedMotion, saveData }: CinemaEnvironment): boolean {
  return !prefersReducedMotion && !saveData;
}
