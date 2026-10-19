import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: process.cwd() });

async function ruleIdsFor(code: string, filePath: string): Promise<(string | null)[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((message) => message.ruleId);
}

describe("regras de dependência do domain/", () => {
  it("bloqueia import de framework", async () => {
    expect(await ruleIdsFor('import { h } from "preact";\nexport const x = h;\n', "src/domain/x.ts")).toContain(
      "no-restricted-imports",
    );
  });

  it("bloqueia new Date() sem argumento e Date.now()", async () => {
    const ids = await ruleIdsFor("export const a = new Date();\nexport const b = Date.now();\n", "src/domain/x.ts");
    expect(ids.filter((id) => id === "no-restricted-syntax")).toHaveLength(2);
  });

  it("permite o mesmo código fora do domain/", async () => {
    expect(await ruleIdsFor("export const a = new Date();\n", "src/viewModels/x.ts")).toEqual([]);
  });
});
