import { describe, expect, it, vi } from "vitest";
import { DEMO_CASES } from "../data/subjects";
import { RemoteAnalyzer } from "./remoteAnalyzer";
import { FallbackAnalyzer } from "./analyzer";
import { localAnalyzer } from "./localAnalyzer";

const submission = { ...DEMO_CASES[0], id: "test" };

describe("RemoteAnalyzer", () => {
  it("sends an OpenAI-compatible JSON request and parses the result", async () => {
    const remoteShape = await localAnalyzer.analyze(submission);
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ ...remoteShape, provider: "remote" }) } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const analyzer = new RemoteAnalyzer({ endpoint: "https://example.test/chat/completions", apiKey: "secret", model: "demo", fetchImpl });
    const result = await analyzer.analyze(submission);
    expect(result.provider).toBe("remote");
    expect(fetchImpl).toHaveBeenCalledWith("https://example.test/chat/completions", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body))).toMatchObject({ model: "demo", response_format: { type: "json_object" } });
  });

  it("falls back to local output when remote fails", async () => {
    const remote = new RemoteAnalyzer({ endpoint: "https://example.test/chat/completions", fetchImpl: vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")) });
    const result = await new FallbackAnalyzer(remote, localAnalyzer).analyze(submission);
    expect(result.provider).toBe("fallback");
    expect(result.fallbackReason).toContain("远端");
    expect(result.trace).toHaveLength(6);
  });
});
