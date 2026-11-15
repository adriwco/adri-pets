import { shouldStartCinema } from "./shouldStartCinema";

interface NetworkInformationLike {
  saveData?: boolean;
}

function readEnvironment() {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  return {
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: connection?.saveData === true,
  };
}

function whenIdle(callback: () => void) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1500 });
  } else {
    setTimeout(callback, 300);
  }
}

export function scheduleCinema(): void {
  if (!shouldStartCinema(readEnvironment())) return;
  const start = () =>
    whenIdle(() => {
      import("./startCinema").then(({ startCinema }) => startCinema()).catch(() => undefined);
    });
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
