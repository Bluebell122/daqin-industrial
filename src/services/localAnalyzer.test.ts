import { describe, expect, it } from "vitest";
import { DEMO_CASES } from "../data/subjects";
import { localAnalyzer } from "./localAnalyzer";

describe("localAnalyzer", () => {
  it("returns a six-stage fixture for every demo case", async () => {
    for (const demo of DEMO_CASES) {
      const result = await localAnalyzer.analyze({ ...demo, id: demo.id });
      expect(result.provider).toBe("local");
      expect(result.trace).toHaveLength(6);
      expect(result.misconception.code).not.toBe("undetermined");
      expect(result.prescription.practices).toHaveLength(2);
    }
  });

  it("classifies an incomplete generic submission as undetermined", async () => {
    const result = await localAnalyzer.analyze({
      id: "generic",
      subject: "math",
      question: "一道题",
      draft: "我写了一步。",
      rationale: "我不确定。",
      stuckAt: "这里卡住了。",
    });
    expect(result.misconception.code).toBe("undetermined");
    expect(result.confidence).toBe("low");
    expect(result.trace).toHaveLength(6);
  });
});
