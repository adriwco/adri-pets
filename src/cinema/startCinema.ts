import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { mountGoldenLight } from "./goldenLight";
import { buildHomeScene } from "./homeScene";

export function startCinema(): void {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("cinema-ready");

  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const hero = document.querySelector<HTMLElement>('[data-cinema-scene="home"]');
  if (hero) buildHomeScene(gsap, ScrollTrigger, hero);

  const lightHost = document.querySelector<HTMLElement>("[data-hero-light]");
  if (lightHost) mountGoldenLight(lightHost, document.querySelector<HTMLElement>(".hero-sun"));
}
