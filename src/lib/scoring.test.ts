import { describe, it, expect } from "vitest";
import model from "@/data/model.json";
import { score, labPoints } from "./scoring";

describe("Sarcoidosis Likelihood Scoring Model", () => {
  it("matches all model.test_vectors for expected_total and expected_probability_pct", () => {
    for (const [idx, vec] of model.test_vectors.entries()) {
      const result = score({
        symptoms: vec.input.symptoms,
        labs: vec.input.labs as Record<string, number | undefined>,
      });
      expect(result.total, `Vector #${idx} total`).toBe(vec.expected_total);
      expect(Math.round(result.probability * 100), `Vector #${idx} probability %`).toBe(
        vec.expected_probability_pct
      );
    }
  });

  it("handles zero-point symptoms without adding them to items breakdown", () => {
    const result = score({
      symptoms: ["abdominal_pain", "jaundice"],
      labs: {},
    });
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
    expect(Math.round(result.probability * 100)).toBe(10);
  });

  it("correctly evaluates lab severity tiers and normal values", () => {
    const normalAce = labPoints("ace", 40);
    expect(normalAce.points).toBe(0);
    expect(normalAce.status).toBe("Normal");

    const highAce = labPoints("ace", 110);
    expect(highAce.points).toBe(5);
    expect(highAce.status).toBe("High");
    expect(highAce.ratio).toBe(2.12);
  });
});

