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
      expect(
        Math.round(result.probability * 100),
        `Vector #${idx} probability %`
      ).toBe(vec.expected_probability_pct);
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
    expect(result.level).toBe("Low");
  });

  it("correctly evaluates lab severity tiers and normal values", () => {
    const normalAce = labPoints("ace", 40);
    expect(normalAce.points).toBe(0);
    expect(normalAce.status).toBe("Normal");

    // 1.0x - 1.5x limit -> 1/3 of max points (5 * 0.34 = 1.7 -> 2)
    const mildAce = labPoints("ace", 60);
    expect(mildAce.points).toBe(2);
    expect(mildAce.status).toBe("High");

    // > 2.0x limit -> full max points (+5)
    const highAce = labPoints("ace", 110);
    expect(highAce.points).toBe(5);
    expect(highAce.status).toBe("High");
    expect(highAce.ratio).toBe(2.12);
  });

  it("enforces Low (<30%), Moderate (30-60%), High (>=60%) levels and 99% cap", () => {
    const low = score({ symptoms: ["shortness_of_breath"], labs: {} }); // +1 pt -> ~14%
    expect(low.level).toBe("Low");

    const moderate = score({
      symptoms: ["imaging_enlarged_chest_lymph_nodes", "dry_cough"], // +5 pts -> ~39%
      labs: {},
    });
    expect(moderate.level).toBe("Moderate");

    const capped = score({
      symptoms: [
        "imaging_enlarged_chest_lymph_nodes",
        "dry_cough",
        "skin_lesions_itching",
        "joint_back_pain",
      ],
      labs: {
        ace: 150,
        serum_calcium: 14,
        lymphocyte_count: 0.3,
        alp: 350,
      },
    });
    expect(capped.level).toBe("High");
    expect(capped.probability).toBeLessThanOrEqual(0.99);
    expect(Math.round(capped.probability * 100)).toBe(99);
  });

  it("supports custom lab ranges and custom symptom points from System Management", () => {
    const customResult = score(
      {
        symptoms: ["dry_cough"],
        labs: { ace: 90 },
      },
      {
        customFeatures: [{ id: "dry_cough", label: "Dry cough", points: 4 }],
        customLabs: [
          {
            id: "ace",
            label: "ACE",
            unit: "U/L",
            low: 8,
            high: 40, // lowered high threshold so 90 is >2x limit (2.25x -> +5 pts)
            direction: "high",
            max_points: 5,
          },
        ],
      }
    );
    expect(customResult.total).toBe(9);
    expect(Math.round(customResult.probability * 100)).toBe(72);
    expect(customResult.level).toBe("High");
  });

  it("safely handles edge cases: empty inputs, negative or huge lab values, NaN/Infinity, unknown labs, and duplicate symptoms", () => {
    const emptyResult = score({ symptoms: [], labs: {} });
    expect(emptyResult.total).toBe(0);
    expect(Math.round(emptyResult.probability * 100)).toBe(10);

    // Negative, huge (>100,000), NaN, Infinity, or unknown lab IDs must yield 0 points and not crash
    expect(labPoints("ace", -15).points).toBe(0);
    expect(labPoints("ace", 500000).points).toBe(0);
    expect(labPoints("ace", Number.NaN).points).toBe(0);
    expect(labPoints("ace", Number.POSITIVE_INFINITY).points).toBe(0);
    expect(labPoints("unknown_lab_id", 100).points).toBe(0);

    // Duplicate symptoms in array (e.g., double-click) are deduplicated
    const deduped = score({
      symptoms: ["dry_cough", "dry_cough", "dry_cough"],
      labs: {
        ace: -50,
        serum_calcium: 999999,
        non_existent: 42,
      },
    });
    expect(deduped.total).toBe(2); // dry_cough (+2) counted once; invalid labs ignored
    expect(deduped.items).toHaveLength(1);
  });
});
