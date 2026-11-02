import { describe, it, expect } from "vitest";
import { runEvaluations } from "../../../evals/eval-runner";

describe("Evaluation Benchmark (evals/dataset.json)", () => {
  it("should achieve target retrieval hit rate (>=90%) and citation correctness (>=95%)", () => {
    const results = runEvaluations();
    expect(results.totalQuestions).toBeGreaterThanOrEqual(5);
    expect(results.hitRate).toBeGreaterThanOrEqual(90);
    expect(results.citationAccuracy).toBeGreaterThanOrEqual(95);
  });
});
