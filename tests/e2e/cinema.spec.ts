import { expect, test } from "@playwright/test";

test("home abre com a camada cinematográfica sem erros", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seu cão em casa de família, como se fosse daqui");
  await expect(page.locator("html")).toHaveClass(/cinema-ready/);
  const supportsWebGl = await page.evaluate(() => document.createElement("canvas").getContext("webgl") !== null);
  await expect(page.locator("[data-hero-light] canvas")).toHaveCount(supportsWebGl ? 1 : 0);
  expect(errors).toEqual([]);
});

test("os cartões da rotina aparecem ao rolar até eles", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/cinema-ready/);
  const firstRoutineCard = page.locator(".routine-card").first();
  await firstRoutineCard.scrollIntoViewIfNeeded();
  await expect(firstRoutineCard).toHaveCSS("opacity", "1", { timeout: 5000 });
});

test("o botão de orçamento leva ao simulador com o título da página", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Fazer orçamento agora" }).click();
  await expect(page).toHaveURL(/\/orcamento/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Orçamento na hora");
});

test.describe("com movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  test("não carrega a camada cinematográfica e mostra todo o conteúdo", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.waitForTimeout(800);
    await expect(page.locator("html")).not.toHaveClass(/cinema-ready/);
    await expect(page.locator("[data-hero-light] canvas")).toHaveCount(0);
    await expect(page.locator(".routine-card").first()).toHaveCSS("opacity", "1");
  });
});
