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
