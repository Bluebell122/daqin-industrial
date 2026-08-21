import { localAnalyzer } from "./localAnalyzer";
import { RemoteAnalyzer, type RemoteAnalyzerOptions, RemoteAnalysisError } from "./remoteAnalyzer";
import type { AnalysisResult, Analyzer, Submission } from "../types";

export type AnalyzerMode = "local" | "remote";

export interface AnalyzerFactoryOptions {
  remote?: RemoteAnalyzerOptions;
  local?: Analyzer;
}

export interface AnalyzerRunResult extends AnalysisResult {
  /** A short, display-safe diagnostic for a fallback result. */
  fallbackReason?: string;
}

export class FallbackAnalyzer implements Analyzer {
  constructor(
    private readonly remote: Analyzer,
    private readonly local: Analyzer = localAnalyzer,
  ) {}

  async analyze(submission: Submission): Promise<AnalyzerRunResult> {
    try {
      return await this.remote.analyze(submission);
    } catch (error) {
      const localResult = await this.local.analyze(submission);
      return {
        ...localResult,
        provider: "fallback",
        fallbackReason:
          error instanceof RemoteAnalysisError || error instanceof Error
            ? error.message
            : "远端模型不可用",
      };
    }
  }
}

export function createAnalyzer(
  mode: AnalyzerMode = "local",
  options: AnalyzerFactoryOptions = {},
): Analyzer {
  if (mode === "remote") {
    return new FallbackAnalyzer(
      new RemoteAnalyzer(options.remote),
      options.local ?? localAnalyzer,
    );
  }
  return options.local ?? localAnalyzer;
}

export async function analyzeSubmission(
  submission: Submission,
  mode: AnalyzerMode = "local",
  options: AnalyzerFactoryOptions = {},
): Promise<AnalyzerRunResult> {
  return createAnalyzer(mode, options).analyze(submission);
}
