import { expect, test, type Page } from "@playwright/test";

function isoDaysFromToday(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days)).toISOString().slice(0, 10);
}

function firstOffSeasonDay(): number {
  for (let offset = 20; offset < 200; offset += 1) {
    const month = isoDaysFromToday(offset).slice(5, 7);
    if (month !== "12" && month !== "01") {
      return offset;
    }
  }
  return 20;
}

async function fillStay(page: Page, nights: number) {
  const start = firstOffSeasonDay();
  await page.getByLabel("Entrada").fill(isoDaysFromToday(start));
  await page.getByLabel("Saída", { exact: true }).fill(isoDaysFromToday(start + nights));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/orcamento/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("simular e levar o orçamento ao WhatsApp", async ({ page }) => {
  await fillStay(page, 3);
  await page.getByLabel("Nome").fill("Thor");
  await page.getByRole("group", { name: "Sexo" }).getByText("Macho").click();
  await page.getByRole("group", { name: "É castrado?" }).getByText("Sim").click();

  await expect(page.getByText("R$ 135,00", { exact: false }).first()).toBeVisible();

  const link = page.getByRole("link", { name: "Quero reservar pelo WhatsApp" });
  const href = (await link.getAttribute("href")) ?? "";
  const text = decodeURIComponent(href.split("?text=")[1] ?? "");
  expect(href.startsWith("https://wa.me/")).toBe(true);
  expect(text).toContain("*Total no PIX:* R$ 135,00");
  expect(text).toContain("*No cartão (Visa ou Mastercard):* Débito R$ 137,73 · Crédito à vista R$ 142,08");
  expect(text).not.toContain("x de");
  expect(text).toContain("• Thor: macho, pequeno, castrado");
});

test("parcelamento escolhido entra na mensagem", async ({ page }) => {
  await fillStay(page, 3);
  await page.getByLabel("Quer parcelar?").selectOption("3");
  const href = (await page.getByRole("link", { name: "Quero reservar pelo WhatsApp" }).getAttribute("href")) ?? "";
  const text = decodeURIComponent(href.split("?text=")[1] ?? "");
  expect(text).toContain("Crédito 3x de R$ 51,31 (total R$ 153,92)");
  expect(text).not.toContain("6x de");
});

test("bandeira Elo ou Amex usa as taxas dela", async ({ page }) => {
  await fillStay(page, 3);
  await page.getByText("Elo ou Amex").click();
  const href = (await page.getByRole("link", { name: "Quero reservar pelo WhatsApp" }).getAttribute("href")) ?? "";
  const text = decodeURIComponent(href.split("?text=")[1] ?? "");
  expect(text).toContain("*No cartão (Elo ou Amex):* Débito R$ 139,15 · Crédito à vista R$ 143,88");
  await expect(page.getByLabel("Quer parcelar?").locator("option")).toHaveCount(11);
});

test("fêmea não castrada mostra aviso sem bloquear o envio", async ({ page }) => {
  await fillStay(page, 2);
  await page.getByLabel("Nome").fill("Mel");
  await page.getByRole("group", { name: "Sexo" }).getByText("Fêmea").click();
  await page.getByRole("group", { name: "É castrada?" }).getByText("Não").click();
  await page.getByRole("group", { name: "Está no cio ou perto do cio?" }).getByText("Sim").click();

  await expect(page.getByText("Fêmeas no cio precisam de um combinado especial", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Quero reservar pelo WhatsApp" })).toBeVisible();
});

test("não deixa passar de 3 pets", async ({ page }) => {
  await page.getByRole("button", { name: "Adicionar outro pet" }).click();
  await page.getByRole("button", { name: "Adicionar outro pet" }).click();
  await expect(page.getByRole("button", { name: "Adicionar outro pet" })).toHaveCount(0);
  await expect(page.getByText("Recebo no máximo 3 pets por vez", { exact: false })).toBeVisible();
});

test("mantém a simulação ao recarregar a página", async ({ page }) => {
  await page.getByLabel("Nome").fill("Bob");
  await page.waitForTimeout(100);
  await page.reload();
  await expect(page.getByLabel("Nome")).toHaveValue("Bob");
});

test("captura de tela do simulador preenchido", async ({ page }, testInfo) => {
  await fillStay(page, 3);
  await page.getByLabel("Nome").fill("Thor");
  await page.getByRole("group", { name: "Sexo" }).getByText("Macho").click();
  await page.getByRole("group", { name: "É castrado?" }).getByText("Não").click();
  await page.screenshot({ path: testInfo.outputPath("simulador.png"), fullPage: true });
});
