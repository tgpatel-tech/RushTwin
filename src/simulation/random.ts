import type { Distribution } from "../types/model";
// Mulberry32: fixed 32-bit arithmetic, with strictly interior uniforms for logs.
export class SeededRandom {
  constructor(private state: number) {}
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296;
  }
  uniform(min: number, max: number) {
    return min + (max - min) * this.next();
  }
  normal(mean: number, std: number) {
    return (
      mean +
      std *
        Math.sqrt(-2 * Math.log(this.next())) *
        Math.cos(2 * Math.PI * this.next())
    );
  }
  triangular(min: number, mode: number, max: number) {
    if (min === max) return min;
    const u = this.next(),
      f = (mode - min) / (max - min);
    return u < f
      ? min + Math.sqrt(u * (max - min) * (mode - min))
      : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
  choiceWeighted(weights: number[]) {
    let u = this.next() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < weights.length; i++) {
      u -= weights[i];
      if (u < 0) return i;
    }
    return weights.length - 1;
  }
}
export function subSeed(seed: number, key: string) {
  let h = seed >>> 0;
  for (const c of key) {
    h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  }
  return h >>> 0;
}
export function sample(d: Distribution, r: SeededRandom) {
  const lo = Math.max(0.001, d.mean - d.variation),
    hi = d.mean + d.variation;
  switch (d.kind) {
    case "fixed":
      return d.mean;
    case "uniform":
      return r.uniform(lo, hi);
    case "normal":
      return Math.max(0.001, r.normal(d.mean, d.variation));
    case "triangular":
      return r.triangular(lo, d.mean, hi);
  }
}
