import { expect, test } from "@playwright/test";

test("a galeria abre com a Kiara e o Jack, filtra por porte e amplia a foto", async ({ page }) => {
  await page.goto("/galeria");
  await expect(page.getByRole("heading", { name: "Quem já passou por aqui" })).toBeVisible();
  await expect(page.locator("[data-gallery-grid] li strong").first()).toHaveText("Kiara");
  await expect(page.locator("[data-gallery-grid] li strong").nth(1)).toHaveText("Jack");

  const cards = page.locator("[data-gallery-grid] li");
  const total = await cards.count();
  expect(total).toBeGreaterThanOrEqual(12);

  await page.getByRole("button", { name: /^Grande/ }).click();
  const visible = page.locator("[data-gallery-grid] li:visible");
  await expect(visible).not.toHaveCount(total);
  for (const size of await visible.evaluateAll((items) => items.map((item) => item.getAttribute("data-size")))) {
    expect(size).toBe("GRANDE");
  }

  await page.getByRole("button", { name: "Todos" }).click();
  await expect(visible).toHaveCount(total);

  await cards.first().getByRole("link").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("img")).toHaveAttribute("src", /\.webp$/);
  await dialog.getByRole("button", { name: "Fechar" }).click();
  await expect(dialog).toBeHidden();
});

test("a home mostra 8 hóspedes e leva para a galeria", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("section", { has: page.getByRole("heading", { name: "Quem já passou por aqui" }) });
  await expect(section.locator("li")).toHaveCount(8);
  await section.getByRole("link", { name: "Ver a galeria completa" }).click();
  await expect(page).toHaveURL(/\/galeria/);
});

test("na foto ampliada dá para passar para a próxima e voltar sem fechar", async ({ page }) => {
  await page.goto("/galeria");
  const total = await page.locator("[data-gallery-grid] li").count();
  await page.locator("[data-gallery-grid] a").first().click();
  const dialog = page.getByRole("dialog");
  const counter = dialog.locator("[data-gallery-dialog-counter]");
  await expect(counter).toHaveText(`1 de ${total}`);
  await expect(dialog.locator("[data-gallery-dialog-caption]")).toContainText("Kiara");

  await dialog.getByRole("button", { name: "Próxima foto" }).click();
  await expect(counter).toHaveText(`2 de ${total}`);
  await expect(dialog.locator("[data-gallery-dialog-caption]")).toContainText("Jack");

  await page.keyboard.press("ArrowRight");
  await expect(counter).toHaveText(`3 de ${total}`);

  await dialog.getByRole("button", { name: "Foto anterior" }).click();
  await dialog.getByRole("button", { name: "Foto anterior" }).click();
  await dialog.getByRole("button", { name: "Foto anterior" }).click();
  await expect(counter).toHaveText(`${total} de ${total}`);

  const box = await dialog.locator("[data-gallery-dialog-image]").boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
  }
  await expect(counter).toHaveText(`${total - 1} de ${total}`);
});

test("com filtro, a foto ampliada só passa pelas fotos do porte escolhido", async ({ page }) => {
  await page.goto("/galeria");
  await page.getByRole("button", { name: /^Grande/ }).click();
  const visible = await page.locator("[data-gallery-grid] li:visible").count();
  await page.locator("[data-gallery-grid] li:visible a").first().click();
  await expect(page.getByRole("dialog").locator("[data-gallery-dialog-counter]")).toHaveText(`1 de ${visible}`);
});

test("na home a foto também abre ampliada e passa para a próxima", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("section", { has: page.getByRole("heading", { name: "Quem já passou por aqui" }) });
  await section.locator("[data-gallery-grid] a").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("[data-gallery-dialog-counter]")).toHaveText("1 de 8");
  await dialog.getByRole("button", { name: "Próxima foto" }).click();
  await expect(dialog.locator("[data-gallery-dialog-counter]")).toHaveText("2 de 8");
  await dialog.getByRole("button", { name: "Fechar" }).click();
  await expect(dialog).toBeHidden();
});
