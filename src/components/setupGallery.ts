import { stepIndex, swipeDirection } from "../domain/gallery";

export function setupGalleryFilters(root: Document) {
  const filters = [...root.querySelectorAll<HTMLButtonElement>("[data-gallery-filter]")];
  const cards = [...root.querySelectorAll<HTMLElement>("[data-gallery-grid] [data-size]")];
  for (const filter of filters) {
    filter.addEventListener("click", () => {
      const size = filter.dataset["galleryFilter"] ?? "";
      for (const other of filters) {
        other.setAttribute("aria-pressed", String(other === filter));
      }
      for (const card of cards) {
        card.hidden = size !== "" && card.dataset["size"] !== size;
      }
    });
  }
}

function preload(link: HTMLAnchorElement | undefined) {
  if (link?.dataset["full"]) new Image().src = link.dataset["full"];
}

export function setupGalleryLightbox(root: Document) {
  const dialog = root.querySelector<HTMLDialogElement>("[data-gallery-dialog]");
  const image = root.querySelector<HTMLImageElement>("[data-gallery-dialog-image]");
  const caption = root.querySelector<HTMLElement>("[data-gallery-dialog-caption]");
  const counter = root.querySelector<HTMLElement>("[data-gallery-dialog-counter]");
  const previous = root.querySelector<HTMLButtonElement>("[data-gallery-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-gallery-next]");
  if (!dialog || !image || !caption || !counter || !previous || !next) {
    return;
  }
  const allLinks = [...root.querySelectorAll<HTMLAnchorElement>("[data-gallery-open]")];
  let links: HTMLAnchorElement[] = [];
  let current = 0;

  const show = (index: number) => {
    current = index;
    const link = links[current];
    if (!link) return;
    image.src = link.dataset["full"] ?? link.href;
    image.width = Number(link.dataset["fullWidth"]);
    image.height = Number(link.dataset["fullHeight"]);
    image.alt = link.querySelector("img")?.alt ?? "";
    caption.textContent = link.dataset["caption"] ?? "";
    counter.textContent = `${current + 1} de ${links.length}`;
    image.classList.remove("is-changing");
    void image.offsetWidth;
    image.classList.add("is-changing");
    preload(links[stepIndex(current, 1, links.length)]);
    preload(links[stepIndex(current, -1, links.length)]);
  };
  const move = (delta: number) => show(stepIndex(current, delta, links.length));

  for (const link of allLinks) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      links = allLinks.filter((candidate) => !candidate.closest("[hidden]"));
      const single = links.length < 2;
      previous.hidden = single;
      next.hidden = single;
      show(Math.max(0, links.indexOf(link)));
      dialog.showModal();
    });
  }
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") move(1);
    if (event.key === "ArrowLeft") move(-1);
  });

  let startX = 0;
  let startY = 0;
  image.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
  });
  image.addEventListener("pointerup", (event) => {
    const direction = swipeDirection(event.clientX - startX, event.clientY - startY);
    if (direction !== 0) move(direction);
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}
