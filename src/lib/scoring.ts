// src/lib/scoring.ts
import model from "@/data/model.json";

export type Input = { symptoms: string[]; labs: Record<string, number | undefined> };
export type Item = { label: string; points: number };

// Python-style rounding (round half to even) so results match the Python model exactly.
function roundHalfEven(x: number): number {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 ? (r % 2 === 0 ? r : r - 1) : r;
}

export function labPoints(id: string, value: number) {
  const lab = model.labs.find(l => l.id === id)!;
  const ratio = lab.direction === "high"
    ? value / lab.high
    : value > 0 ? lab.low / value : 999;
  let frac = 0;
  for (const [limit, f] of model.severity_tiers) { if (ratio <= limit) { frac = f; break; } }
  const points = roundHalfEven(lab.max_points * frac);
  const status = ratio <= 1 ? "Normal" : lab.direction === "high" ? "High" : "Low";
  return { points, status, ratio: Math.round(ratio * 100) / 100 };
}

export function score(input: Input) {
  const items: Item[] = [];
  for (const id of input.symptoms) {
    const f = model.features.find(x => x.id === id);
    if (f && f.points !== 0) items.push({ label: f.label, points: f.points });
  }
  for (const [id, v] of Object.entries(input.labs)) {
    if (v === undefined || v === null || Number.isNaN(v)) continue;
    const lab = model.labs.find(l => l.id === id)!;
    const r = labPoints(id, v);
    if (r.points > 0) items.push({ label: `${lab.label} ${v} ${lab.unit} (${r.status}, ${r.ratio}× limit)`, points: r.points });
  }
  items.sort((a, b) => b.points - a.points);
  const total = items.reduce((s, i) => s + i.points, 0);
  const p0 = model.pretest_probability;
  const odds = (p0 / (1 - p0)) * Math.pow(2, total / 2);
  const probability = Math.min(odds / (1 + odds), model.probability_cap);
  const level = model.levels.find(l => probability >= l.min && probability < l.max)!.name;
  return { total, probability, level, items };
}

