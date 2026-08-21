export type Subject = "math" | "science" | "language";

export type MisconceptionCode =
  | "prompt_misread"
  | "concept_confusion"
  | "ratio_as_difference"
  | "method_mismatch"
  | "transfer_failure"
  | "causal_leap"
  | "missing_variable"
  | "unsupported_claim"
  | "step_jump"
  | "calculation_error"
  | "expression_ambiguity"
  | "no_verification"
  | "undetermined";

export type TraceStatus = "clear" | "attention" | "blocked" | "not_started";

export type Provider = "local" | "remote" | "fallback";

export type DemoId =
  | "math-ratio"
  | "science-correlation"
  | "language-evidence";

export interface Submission {
  id: string;
  subject: Subject;
  question: string;
  draft: string;
  rationale: string;
  stuckAt: string;
  /** Optional shareable fixture identifier. It is never persisted with private student text. */
  demoId?: DemoId;
}

export interface TraceNode {
  id: string;
  label: string;
  status: TraceStatus;
  summary: string;
  evidence?: string;
  nextStep?: string;
}

export interface Misconception {
  code: MisconceptionCode;
  label: string;
  explanation: string;
  evidence: string;
}

export interface LearningPrescription {
  analogy: string;
  practices: [string, string];
  reflection: string;
}

export interface AnalysisResult {
  trace: TraceNode[];
  misconception: Misconception;
  socraticProbe: string;
  prescription: LearningPrescription;
  teacherIntervention: string;
  provider: Provider;
  /** Present when a remote provider failed and the local result was used. */
  fallbackReason?: string;
  /** Optional confidence hint for a future model-backed UI. */
  confidence?: "low" | "medium" | "high";
  createdAt?: string;
}

export interface Analyzer {
  analyze(submission: Submission): Promise<AnalysisResult>;
}

export interface SubjectDefinition {
  id: Subject;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
}

export interface DemoCase {
  id: DemoId;
  subject: Subject;
  title: string;
  question: string;
  draft: string;
  rationale: string;
  stuckAt: string;
}

export interface DraftFields {
  question: string;
  draft: string;
  rationale: string;
  stuckAt: string;
}

export type DraftsBySubject = Record<Subject, DraftFields>;

export type HeatmapCounts = Record<Subject, Partial<Record<MisconceptionCode, number>>>;

export interface HeatmapCell {
  subject: Subject;
  code: MisconceptionCode;
  count: number;
  percentage: number;
}

export interface MisconceptionDefinition {
  code: MisconceptionCode;
  label: string;
  shortLabel: string;
  description: string;
  classroomIntervention: string;
  representativeThought: string;
  probe: string;
}

export type Page = "student" | "teacher";
export type Theme = "light" | "dark";
