import { expect, test, type Page } from "@playwright/test";

function isoDaysFromToday(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days)).toISOString().slice(0, 10);
}

function firstOffSeasonDay(): number {
  for (let offset = 20; offset < 200; offset += 1) {
    const month = isoDaysFromToday(offset).slice(5, 7);
    if (!["12", "01", "02"].includes(month)) {
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

async function goToPets(page: Page, nights: number) {
  await fillStay(page, nights);
  await page.getByRole("button", { name: "Próximo: os pets" }).click();
}

async function goToValue(page: Page) {
  await page.getByRole("button", { name: "Próximo: o valor" }).click();
}

async function whatsAppText(page: Page): Promise<string> {
  const href = (await page.getByRole("link", { name: "Quero reservar pelo WhatsApp" }).first().getAttribute("href")) ?? "";
  return decodeURIComponent(href.split("?text=")[1] ?? "");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/orcamento/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("simular em etapas e levar o orçamento ao WhatsApp", async ({ page }) => {
  await goToPets(page, 3);
  await page.getByLabel("Nome").fill("Thor");
  await page.getByRole("group", { name: "Porte" }).getByText("Grande").click();
  await page.getByRole("group", { name: "Sexo" }).getByText("Macho").click();
  await page.getByRole("group", { name: "É castrado?" }).getByText("Sim").click();
  await goToValue(page);

  await expect(page.getByText("Reserva do Thor")).toBeVisible();
  await expect(page.getByText("R$ 135,00", { exact: false }).first()).toBeVisible();

  const text = await whatsAppText(page);
  expect(text).toContain("*Total no PIX:* R$ 135,00");
  expect(text).toContain("*No cartão (Visa ou Mastercard):* Débito R$ 137,73 · Crédito à vista R$ 142,08");
  expect(text).toContain("• Thor: macho, grande, castrado");
  expect(text).not.toContain("x de");
});

test("não avança para os pets sem as datas", async ({ page }) => {
  await page.getByRole("button", { name: "Próximo: os pets" }).click();
  await expect(page.getByText("Escolha as datas para continuar.")).toBeVisible();
  await expect(page.getByLabel("Nome")).toHaveCount(0);
});

test("parcelamento escolhido entra na mensagem", async ({ page }) => {
  await goToPets(page, 3);
  await goToValue(page);
  await page.getByLabel("Quer parcelar?").selectOption("3");
  const text = await whatsAppText(page);
  expect(text).toContain("Crédito 3x de R$ 51,31 (total R$ 153,92)");
  expect(text).not.toContain("6x de");
});

test("bandeira Elo ou Amex usa as taxas dela", async ({ page }) => {
  await goToPets(page, 3);
  await goToValue(page);
  await page.getByText("Elo ou Amex").click();
  const text = await whatsAppText(page);
  expect(text).toContain("*No cartão (Elo ou Amex):* Débito R$ 139,15 · Crédito à vista R$ 143,88");
  await expect(page.getByLabel("Quer parcelar?").locator("option")).toHaveCount(11);
});

test("fêmea não castrada mostra aviso sem bloquear o envio", async ({ page }) => {
  await goToPets(page, 2);
  await page.getByLabel("Nome").fill("Mel");
  await page.getByRole("group", { name: "Sexo" }).getByText("Fêmea").click();
  await page.getByRole("group", { name: "É castrada?" }).getByText("Não").click();
  await page.getByRole("group", { name: "Está no cio ou perto do cio?" }).getByText("Sim").click();

  await expect(page.getByText("Fêmeas no cio precisam de um combinado especial", { exact: false }).first()).toBeVisible();
  await goToValue(page);
  await expect(page.getByRole("link", { name: "Quero reservar pelo WhatsApp" }).first()).toBeVisible();
});

test("não deixa passar de 3 pets", async ({ page }) => {
  await goToPets(page, 1);
  await page.getByRole("button", { name: "Adicionar outro pet" }).click();
  await page.getByRole("button", { name: "Adicionar outro pet" }).click();
  await expect(page.getByRole("button", { name: "Adicionar outro pet" })).toHaveCount(0);
  await expect(page.getByText("Recebo no máximo 3 pets por vez", { exact: false })).toBeVisible();
});

test("mantém a simulação ao recarregar a página", async ({ page }) => {
  await goToPets(page, 2);
  await page.getByLabel("Nome").fill("Bob");
  await page.waitForTimeout(100);
  await page.reload();
  await page.getByRole("button", { name: "Próximo: os pets" }).click();
  await expect(page.getByLabel("Nome")).toHaveValue("Bob");
});

test("capturas de tela das etapas e da home", async ({ page }, testInfo) => {
  await goToPets(page, 3);
  await page.getByLabel("Nome").fill("Thor");
  await page.getByRole("group", { name: "Porte" }).getByText("Grande").click();
  await page.getByRole("group", { name: "Sexo" }).getByText("Macho").click();
  await page.getByRole("group", { name: "É castrado?" }).getByText("Sim").click();
  await page.screenshot({ path: testInfo.outputPath("etapa-pets.png"), fullPage: true });
  await goToValue(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: testInfo.outputPath("etapa-valor.png"), fullPage: true });
  await page.goto("/");
  await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });
});
