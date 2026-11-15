import type { gsap as GsapInstance } from "gsap";
import type { ScrollTrigger as ScrollTriggerInstance } from "gsap/ScrollTrigger";

type Gsap = typeof GsapInstance;
type ScrollTriggerApi = typeof ScrollTriggerInstance;

function revealOnEnter(gsap: Gsap, ScrollTrigger: ScrollTriggerApi, selector: string, from: GSAPTweenVars, to: GSAPTweenVars) {
  if (!document.querySelector(selector)) return;
  gsap.set(selector, from);
  ScrollTrigger.batch(selector, {
    start: "top bottom",
    once: true,
    onEnter: (batch) => gsap.to(batch, { ...to, overwrite: true }),
  });
}

export function buildHomeScene(gsap: Gsap, ScrollTrigger: ScrollTriggerApi, hero: HTMLElement): () => void {
  const context = gsap.context(() => {
    const leave = { trigger: hero, start: "top top+=24", end: "bottom top", scrub: true };
    gsap.to(".hero-sun", { yPercent: -38, scale: 1.12, ease: "none", scrollTrigger: leave });
    gsap.to(".hero-blob", { yPercent: 8, rotate: -4, ease: "none", scrollTrigger: leave });
    gsap.to(".hero-paw", { rotate: 16, yPercent: -10, ease: "none", scrollTrigger: leave });
    gsap.to(".hero-card", { yPercent: -70, ease: "none", scrollTrigger: leave });
    gsap.to(".hero-copy", { yPercent: -10, opacity: 0.4, ease: "none", scrollTrigger: leave });

    revealOnEnter(
      gsap,
      ScrollTrigger,
      ".routine-card",
      { opacity: 0, y: 44, rotate: (index: number) => (index % 2 === 0 ? -3 : 3) },
      { opacity: 1, y: 0, rotate: 0, duration: 0.9, stagger: 0.1, ease: "back.out(1.6)" },
    );
    revealOnEnter(
      gsap,
      ScrollTrigger,
      ".step-card",
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: "expo.out" },
    );
    revealOnEnter(
      gsap,
      ScrollTrigger,
      ".faq-card",
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.8, stagger: 0.07, ease: "expo.out" },
    );
  }, document.body);

  ScrollTrigger.refresh();
  let disposed = false;
  document.fonts?.ready.then(() => {
    if (!disposed) ScrollTrigger.refresh();
  });

  return () => {
    disposed = true;
    context.revert();
  };
}
