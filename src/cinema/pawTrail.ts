export interface PawStep {
  x: number;
  y: number;
  rotation: number;
}

export interface PawTrailOptions {
  width: number;
  height: number;
  random: () => number;
  stride?: number;
  gait?: number;
  vertical?: boolean;
}

export const MIN_STEPS = 16;
export const MAX_STEPS = 60;

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

export function planPawTrail({ width, height, random, stride = 70, gait = 18, vertical = false }: PawTrailOptions): PawStep[] {
  const fromStart = random() < 0.5;
  const length = vertical ? height : width;
  const across = vertical ? width : height;
  const crossing = Math.round((length * between(random, 0.8, 1.3)) / stride);
  const steps = Math.min(MAX_STEPS, Math.max(MIN_STEPS, crossing));
  const along = fromStart ? between(random, 0, length * 0.25) : between(random, length * 0.75, length);
  const lane = between(random, across * 0.15, across * 0.85);
  let x = vertical ? lane : along;
  let y = vertical ? along : lane;
  const forward = vertical ? Math.PI / 2 : 0;
  let heading = (fromStart ? forward : forward + Math.PI) + between(random, -0.45, 0.45);
  const sway = between(random, 0.14, 0.26);
  const frequency = between(random, 0.22, 0.4);
  const phase = between(random, 0, Math.PI * 2);
  const trail: PawStep[] = [];
  for (let index = 0; index < steps; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    trail.push({
      x: Math.round(x - Math.sin(heading) * gait * side),
      y: Math.round(y + Math.cos(heading) * gait * side),
      rotation: Math.round((heading * 180) / Math.PI + 90),
    });
    heading += sway * Math.sin(phase + index * frequency);
    x += Math.cos(heading) * stride;
    y += Math.sin(heading) * stride;
  }
  return trail;
}

export interface Obstacle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function avoidObstacles(steps: readonly PawStep[], obstacles: readonly Obstacle[], clearance: number): PawStep[] {
  return steps.filter(
    (step) =>
      !obstacles.some(
        (box) =>
          step.x + clearance > box.left &&
          step.x - clearance < box.right &&
          step.y + clearance > box.top &&
          step.y - clearance < box.bottom,
      ),
  );
}
