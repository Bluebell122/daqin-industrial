import type {
  AnalysisResult,
  Analyzer,
  MisconceptionCode,
  Submission,
  TraceStatus,
} from "../types";

export interface RemoteAnalyzerOptions {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class RemoteAnalysisError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "RemoteAnalysisError";
  }
}

function envValue(name: string): string | undefined {
  // `import.meta.env` is provided by Vite. Keeping access behind a function makes
  // the analyzer straightforward to instantiate with explicit options in tests.
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.[name];
}

export function getRemoteAnalyzerOptions(
  options: RemoteAnalyzerOptions = {},
): Required<Pick<RemoteAnalyzerOptions, "endpoint" | "model" | "timeoutMs">> &
  Pick<RemoteAnalyzerOptions, "apiKey" | "fetchImpl"> {
  return {
    endpoint: options.endpoint ?? envValue("VITE_AI_ENDPOINT") ?? "",
    apiKey: options.apiKey ?? envValue("VITE_AI_API_KEY"),
    model: options.model ?? envValue("VITE_AI_MODEL") ?? "gpt-4o-mini",
    timeoutMs: options.timeoutMs ?? 30_000,
    fetchImpl: options.fetchImpl,
  };
}

const TRACE_STATUSES: TraceStatus[] = ["clear", "attention", "blocked", "not_started"];
const TRACE_STAGE_IDS = ["understand", "concept", "method", "reasoning", "execution", "reflection"];
const MISCONCEPTION_CODES: MisconceptionCode[] = [
  "prompt_misread",
  "concept_confusion",
  "ratio_as_difference",
  "method_mismatch",
  "transfer_failure",
  "causal_leap",
  "missing_variable",
  "unsupported_claim",
  "step_jump",
  "calculation_error",
  "expression_ambiguity",
  "no_verification",
  "undetermined",
];

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<AnalysisResult>;
  if (!Array.isArray(result.trace) || result.trace.length !== 6) return false;
  if (!result.misconception || typeof result.misconception !== "object") return false;
  if (typeof result.socraticProbe !== "string" || typeof result.teacherIntervention !== "string") return false;
  if (!result.prescription || typeof result.prescription !== "object") return false;
  const prescription = result.prescription as Partial<AnalysisResult["prescription"]>;
  return (
    typeof result.misconception.code === "string" &&
    MISCONCEPTION_CODES.includes(result.misconception.code as MisconceptionCode) &&
    typeof result.misconception.label === "string" &&
    typeof result.misconception.explanation === "string" &&
    typeof result.misconception.evidence === "string" &&
    typeof prescription.analogy === "string" &&
    Array.isArray(prescription.practices) &&
    prescription.practices.length === 2 &&
    prescription.practices.every((practice) => typeof practice === "string") &&
    typeof prescription.reflection === "string" &&
    result.trace.every(
      (node) =>
        node &&
        typeof node.id === "string" &&
        TRACE_STAGE_IDS.includes(node.id) &&
        typeof node.label === "string" &&
        TRACE_STATUSES.includes(node.status as TraceStatus) &&
        typeof node.summary === "string",
    ) &&
    new Set(result.trace.map((node) => node.id)).size === TRACE_STAGE_IDS.length
  );
}

function contentFromResponse(payload: unknown): string {
  const choices = (payload as { choices?: Array<{ message?: { content?: unknown } }> } | null)?.choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "object" && part && "text" in part ? String((part as { text: unknown }).text) : ""))
      .join("");
  }
  throw new RemoteAnalysisError("远端响应缺少 choices[0].message.content");
}

export class RemoteAnalyzer implements Analyzer {
  private readonly options: ReturnType<typeof getRemoteAnalyzerOptions>;

  constructor(options: RemoteAnalyzerOptions = {}) {
    this.options = getRemoteAnalyzerOptions(options);
  }

  async analyze(submission: Submission): Promise<AnalysisResult> {
    if (!this.options.endpoint) {
      throw new RemoteAnalysisError("未配置 VITE_AI_ENDPOINT");
    }

    const fetchImpl = this.options.fetchImpl ?? globalThis.fetch;
    if (!fetchImpl) throw new RemoteAnalysisError("当前环境不支持 fetch");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
    try {
      const response = await fetchImpl(this.options.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.options.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "你是认知调试器。只返回符合 AnalysisResult 的 JSON，不要 markdown，不要直接给学生最终答案。trace 必须有六个节点，provider 字段由客户端覆盖为 remote。",
            },
            {
              role: "user",
              content: JSON.stringify({ ...submission, id: undefined }),
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new RemoteAnalysisError(`远端模型请求失败（HTTP ${response.status}）`);
      }
      const payload = await response.json();
      let parsed: unknown;
      try {
        parsed = JSON.parse(contentFromResponse(payload));
      } catch (error) {
        if (error instanceof RemoteAnalysisError) throw error;
        throw new RemoteAnalysisError("远端模型返回的内容不是合法 JSON", error);
      }
      if (!isAnalysisResult(parsed)) {
        throw new RemoteAnalysisError("远端模型 JSON 不符合 AnalysisResult 结构");
      }
      return {
        ...parsed,
        provider: "remote",
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof RemoteAnalysisError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new RemoteAnalysisError("远端模型请求超时", error);
      }
      throw new RemoteAnalysisError("远端模型请求失败，请检查网络或端点配置", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createRemoteAnalyzer(options: RemoteAnalyzerOptions = {}): RemoteAnalyzer {
  return new RemoteAnalyzer(options);
}
