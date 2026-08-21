import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_HEATMAP_COUNTS } from "../data/heatmap";
import { clearDmtStorage, loadDrafts, loadHeatmap, recordHeatmapResult, saveDrafts } from "./storage";

describe("storage helpers", () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps drafts separated by subject", () => {
    const drafts = loadDrafts();
    drafts.math.question = "数学题";
    saveDrafts(drafts);
    expect(loadDrafts().math.question).toBe("数学题");
    expect(loadDrafts().science.question).toBe("");
  });

  it("merges an anonymous misconception count without changing defaults", () => {
    const before = loadHeatmap();
    const next = recordHeatmapResult("math", "ratio_as_difference");
    expect(next.math.ratio_as_difference).toBe((before.math.ratio_as_difference ?? 0) + 1);
    expect(next.science).toEqual(DEFAULT_HEATMAP_COUNTS.science);
  });

  it("clears persisted data", () => {
    window.localStorage.setItem("dmt:last-analysis", "{}" );
    clearDmtStorage();
    expect(window.localStorage.getItem("dmt:last-analysis")).toBeNull();
  });
});
