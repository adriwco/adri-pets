import { describe, expect, it } from "vitest";
import { avoidObstacles, MAX_STEPS, MIN_STEPS, planPawTrail } from "../../src/cinema/pawTrail";

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
}

function headings(trail: { rotation: number }[]) {
  return trail.map((step) => step.rotation);
}

describe("planPawTrail", () => {
  it("entra pela esquerda e atravessa a tela com passos proporcionais à largura", () => {
    const trail = planPawTrail({ width: 1600, height: 800, random: sequence([0.1, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0]) });
    expect(trail).toHaveLength(Math.round((1600 * 0.8) / 70));
    expect(trail[0]?.x).toBeLessThan(400);
    expect(trail.at(-1)?.x).toBeGreaterThan(trail[0]?.x ?? 0);
    expect(trail[0]?.rotation).toBe(90);
  });

  it("entra pela direita e anda para a esquerda", () => {
    const trail = planPawTrail({ width: 1000, height: 800, random: sequence([0.9, 1, 1, 0.5, 0.5, 0.5, 0.5, 0]) });
    expect(trail).toHaveLength(Math.round((1000 * 1.3) / 70));
    expect(trail[0]?.x).toBeGreaterThan(750);
    expect(trail.at(-1)?.x).toBeLessThan(trail[0]?.x ?? 0);
    expect(trail[0]?.rotation).toBe(270);
  });

  it("respeita o mínimo em tela estreita e o máximo em tela larga", () => {
    const narrow = planPawTrail({ width: 300, height: 800, random: sequence([0.1, 0, 0.5, 0.5]) });
    const wide = planPawTrail({ width: 6000, height: 800, random: sequence([0.1, 1, 0.5, 0.5]) });
    expect([narrow.length, wide.length]).toEqual([MIN_STEPS, MAX_STEPS]);
  });

  it("na vertical desce pela tela com a pata virada para baixo", () => {
    const trail = planPawTrail({ width: 412, height: 900, random: sequence([0.1, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0]), vertical: true });
    expect(trail).toHaveLength(Math.max(MIN_STEPS, Math.round((900 * 0.8) / 70)));
    expect(trail[0]?.y).toBeLessThan(225);
    expect(trail.at(-1)?.y).toBeGreaterThan(trail[0]?.y ?? 0);
    expect(trail[0]?.rotation).toBe(180);
  });

  it("serpenteia, virando para um lado e depois para o outro", () => {
    const trail = planPawTrail({ width: 1600, height: 800, random: sequence([0.1, 0, 0.5, 0.5, 0.5, 1, 1, 0.25]) });
    const turns = headings(trail)
      .slice(1)
      .map((rotation, index) => rotation - (headings(trail)[index] ?? 0));
    expect(turns.some((turn) => turn > 0)).toBe(true);
    expect(turns.some((turn) => turn < 0)).toBe(true);
  });

  it("alterna as patas de um lado e do outro da linha do caminho", () => {
    const trail = planPawTrail({ width: 1600, height: 800, random: sequence([0.1, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0]), gait: 10 });
    expect(trail.slice(0, 2).map((step) => step.y - 400)).toEqual([-10, 10]);
  });
});

describe("avoidObstacles", () => {
  const steps = [
    { x: 10, y: 10, rotation: 90 },
    { x: 100, y: 100, rotation: 90 },
    { x: 140, y: 100, rotation: 90 },
    { x: 300, y: 300, rotation: 90 },
  ];
  const card = { left: 90, top: 90, right: 120, bottom: 110 };

  it("tira as pegadas que cairiam dentro de um elemento e mantém o resto do caminho", () => {
    expect(avoidObstacles(steps, [card], 0).map((step) => step.x)).toEqual([10, 140, 300]);
  });

  it("considera o tamanho da pata como folga em volta do elemento", () => {
    expect(avoidObstacles(steps, [card], 25).map((step) => step.x)).toEqual([10, 300]);
  });

  it("sem obstáculos mantém todas", () => {
    expect(avoidObstacles(steps, [], 25)).toHaveLength(4);
  });
});
