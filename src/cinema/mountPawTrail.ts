import { avoidObstacles, planPawTrail, type Obstacle } from "./pawTrail";

const PAW_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="15.5" rx="4.2" ry="3.6"/><circle cx="6.5" cy="9.5" r="1.9"/><circle cx="9.8" cy="5.8" r="1.9"/><circle cx="14.2" cy="5.8" r="1.9"/><circle cx="17.5" cy="9.5" r="1.9"/></svg>';
const STEP_INTERVAL_MS = 280;
const PRINT_LIFETIME_MS = 3000;
const MAX_ACTIVE_WALKS = 3;
const PAW_CLEARANCE = 22;
const SMALL_PAW_CLEARANCE = 4;
const DESKTOP_MIN_WIDTH = 768;
const CONTENT_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "p",
  "a",
  "button",
  "summary",
  "label",
  "input",
  "select",
  "textarea",
  "img",
  "li",
  ".card",
  ".chip",
  ".hero-art",
].join(",");

function collectContentBoxes(): Obstacle[] {
  const scrollTop = window.scrollY;
  const boxes: Obstacle[] = [];
  for (const element of document.querySelectorAll<HTMLElement>(CONTENT_SELECTOR)) {
    if (element.closest(".paw-trail")) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight) continue;
    boxes.push({ left: rect.left, right: rect.right, top: rect.top + scrollTop, bottom: rect.bottom + scrollTop });
  }
  return boxes;
}

export function mountPawTrail(): () => void {
  const layer = document.createElement("div");
  layer.className = "paw-trail";
  layer.setAttribute("aria-hidden", "true");
  document.body.prepend(layer);
  let timer = 0;

  const walk = () => {
    if (document.hidden || layer.childElementCount >= MAX_ACTIVE_WALKS) {
      timer = window.setTimeout(walk, 1500);
      return;
    }
    const offsetTop = window.scrollY;
    const isPhone = window.innerWidth < DESKTOP_MIN_WIDTH;
    const viewport = { width: window.innerWidth, height: window.innerHeight, random: Math.random };
    const planned = planPawTrail({ ...viewport, vertical: isPhone }).map((step) => ({
      ...step,
      y: step.y + offsetTop,
    }));
    const steps = avoidObstacles(planned, collectContentBoxes(), isPhone ? SMALL_PAW_CLEARANCE : PAW_CLEARANCE);
    const group = document.createElement("div");
    steps.forEach((step) => {
      const print = document.createElement("span");
      print.className = "paw-print";
      print.innerHTML = PAW_SVG;
      print.style.left = `${step.x}px`;
      print.style.top = `${step.y}px`;
      print.style.setProperty("--paw-rotation", `${step.rotation}deg`);
      print.style.animationDelay = `${planned.indexOf(step) * STEP_INTERVAL_MS}ms`;
      group.append(print);
    });
    layer.append(group);
    const walkDuration = planned.length * STEP_INTERVAL_MS;
    window.setTimeout(() => group.remove(), walkDuration + PRINT_LIFETIME_MS);
    timer = window.setTimeout(walk, 1500 + Math.random() * 2500);
  };
  timer = window.setTimeout(walk, 1200);

  return () => {
    window.clearTimeout(timer);
    layer.remove();
  };
}
