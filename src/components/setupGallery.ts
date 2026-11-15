export function setupGallery(root: Document) {
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

  const dialog = root.querySelector<HTMLDialogElement>("[data-gallery-dialog]");
  const image = root.querySelector<HTMLImageElement>("[data-gallery-dialog-image]");
  const caption = root.querySelector<HTMLElement>("[data-gallery-dialog-caption]");
  if (!dialog || !image || !caption) {
    return;
  }
  for (const link of root.querySelectorAll<HTMLAnchorElement>("[data-gallery-open]")) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      image.src = link.dataset["full"] ?? link.href;
      image.width = Number(link.dataset["fullWidth"]);
      image.height = Number(link.dataset["fullHeight"]);
      image.alt = link.querySelector("img")?.alt ?? "";
      caption.textContent = link.dataset["caption"] ?? "";
      dialog.showModal();
    });
  }
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}
