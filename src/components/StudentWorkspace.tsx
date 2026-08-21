import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  FileText,
  FlaskConical,
  Lightbulb,
  Loader2,
  MessageCircleQuestion,
  PencilLine,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { SUBJECTS } from "../data/subjects";
import type {
  AnalysisResult,
  DemoCase,
  DraftsBySubject,
  Subject,
} from "../types";
import { ThinkingTrace } from "./ThinkingTrace";

type DraftFields = DraftsBySubject[Subject];
type DraftField = keyof DraftFields;

export interface StudentWorkspaceProps {
  subject: Subject;
  draft: DraftFields;
  onSubjectChange: (subject: Subject) => void;
  onDraftChange: (field: DraftField, value: string) => void;
  onAnalyze: () => void;
  analysis?: AnalysisResult | null;
  isAnalyzing?: boolean;
  revealCount?: number;
  onSkipReveal?: () => void;
  onReflection?: (value: string) => void;
  reflectionRecorded?: boolean;
  error?: string | null;
  mode?: "local" | "remote";
  demoCases?: DemoCase[];
  onLoadDemo?: (demoId: DemoCase["id"]) => void;
}

const fieldConfig: Array<{
  field: DraftField;
  label: string;
  hint: string;
  placeholder: string;
  icon: typeof FileText;
  maxLength: number;
}> = [
  {
    field: "question",
    label: "题目",
    hint: "把你正在解决的问题完整写下来。",
    placeholder: "例如：一杯果汁中，浓缩汁和水的比例是 1:3……",
    icon: FileText,
    maxLength: 2000,
  },
  {
    field: "draft",
    label: "我的草稿 / 解题步骤",
    hint: "保留算式、画图和被划掉的尝试，它们都是线索。",
    placeholder: "我先……然后……所以最后得到……",
    icon: PencilLine,
    maxLength: 4000,
  },
  {
    field: "rationale",
    label: "我为什么这么做",
    hint: "用一句话说出你当时相信的规则。",
    placeholder: "我觉得……因为……",
    icon: Lightbulb,
    maxLength: 4000,
  },
  {
    field: "stuckAt",
    label: "我卡在这里",
    hint: "指出最早开始不确定的那一步。",
    placeholder: "我在……这一步开始不确定。",
    icon: Target,
    maxLength: 4000,
  },
];

const subjectIcon: Record<Subject, typeof BookOpen> = {
  math: BookOpen,
  science: FlaskConical,
  language: FileText,
};

function isDraftComplete(draft: DraftFields): boolean {
  return fieldConfig.every(({ field }) => (draft[field] ?? "").trim().length > 0);
}

export function StudentWorkspace({
  subject,
  draft,
  onSubjectChange,
  onDraftChange,
  onAnalyze,
  analysis = null,
  isAnalyzing = false,
  revealCount = 0,
  onSkipReveal,
  onReflection,
  reflectionRecorded = false,
  error = null,
  mode = "local",
  demoCases = [],
  onLoadDemo,
}: StudentWorkspaceProps) {
  const [attempted, setAttempted] = useState(false);
  const [reflection, setReflection] = useState("");
  const [activeDemo, setActiveDemo] = useState("");
  const complete = useMemo(() => isDraftComplete(draft), [draft]);

  useEffect(() => {
    setReflection("");
  }, [analysis]);

  useEffect(() => {
    setAttempted(false);
  }, [subject]);

  const handleAnalyze = () => {
    setAttempted(true);
    if (complete && !isAnalyzing) onAnalyze();
  };

  const handleDemoChange = (demoId: string) => {
    setActiveDemo(demoId);
    if (demoId && onLoadDemo) onLoadDemo(demoId as DemoCase["id"]);
  };

  const handleReflection = () => {
    if (!reflection.trim() || !onReflection) return;
    onReflection(reflection.trim());
  };

  return (
    <main className="workspace" aria-labelledby="student-workspace-title">
      <div className="workspace__intro">
        <div>
          <p className="eyebrow">STUDENT MODE / COGNITIVE DEBUGGER</p>
          <h1 id="student-workspace-title">调试我的思考</h1>
          <p className="workspace__lede">答案只是出口。把走过的路留下来，才能看见思维在哪一步偏离。</p>
        </div>
        <div className="workspace__signal" aria-label="当前学习模式">
          <span className="signal-dot" aria-hidden="true" />
          <span>{mode === "remote" ? "远端模型" : "本地演示"}</span>
        </div>
      </div>

      <div className="workspace__grid">
        <section className="input-panel" aria-labelledby="input-panel-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">01 / LEAVE A TRACE</p>
              <h2 id="input-panel-title">先把你怎么想的写下来</h2>
            </div>
            <span className="panel-counter">{complete ? "4/4 已准备" : "4 项输入"}</span>
          </div>

          <div className="subject-tabs" role="tablist" aria-label="选择学科">
            {SUBJECTS.map((item) => {
              const Icon = subjectIcon[item.id];
              const active = item.id === subject;
              return (
                <button
                  key={item.id}
                  className={`subject-tab ${active ? "is-active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSubjectChange(item.id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                  <small>{item.shortLabel}</small>
                </button>
              );
            })}
          </div>

          {demoCases.length > 0 && onLoadDemo && (
            <div className="demo-loader">
              <div>
                <span className="demo-loader__label">快速开始</span>
                <span className="demo-loader__hint">载入一个完整案例，观察它如何被拆解。</span>
              </div>
              <select aria-label="载入演示案例" value={activeDemo} onChange={(event) => handleDemoChange(event.target.value)}>
                <option value="">选择演示案例</option>
                {demoCases.map((demo) => <option key={demo.id} value={demo.id}>{demo.title}</option>)}
              </select>
            </div>
          )}

          <div className="input-fields">
            {fieldConfig.map(({ field, label, hint, placeholder, icon: Icon, maxLength }) => {
              const value = draft[field] ?? "";
              const missing = attempted && !value.trim();
              return (
                <label className={`field ${missing ? "has-error" : ""}`} key={field}>
                  <span className="field__topline">
                    <span className="field__label"><Icon size={15} aria-hidden="true" />{label}</span>
                    <span className="field__count">{value.length}/{maxLength}</span>
                  </span>
                  <textarea
                    value={value}
                    maxLength={maxLength}
                    rows={field === "question" ? 3 : 4}
                    placeholder={placeholder}
                    onChange={(event) => onDraftChange(field, event.target.value)}
                    aria-invalid={missing}
                  />
                  <span className="field__hint">{missing ? "请先留下这一段线索" : hint}</span>
                </label>
              );
            })}
          </div>

          {error && <p className="form-alert" role="alert"><CircleHelp size={16} aria-hidden="true" />{error}</p>}

          <div className="input-panel__footer">
            <p><span className="privacy-lock" aria-hidden="true">●</span> 不需要姓名。你的原文只留在当前浏览器，除非你选择远端模型。</p>
            <button className="primary-button" type="button" disabled={isAnalyzing} onClick={handleAnalyze}>
              {isAnalyzing ? <Loader2 className="spin" size={17} aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
              {isAnalyzing ? "正在调试…" : "调试我的思考"}
              {!isAnalyzing && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </div>
        </section>

        <section className="diagnosis-panel" aria-labelledby="diagnosis-panel-title">
          <div className="panel-heading panel-heading--diagnosis">
            <div>
              <p className="eyebrow">02 / DEBUG OUTPUT</p>
              <h2 id="diagnosis-panel-title">看见思维的断点</h2>
            </div>
            {analysis && <span className={`provider-pill provider-pill--${analysis.provider}`}>{analysis.provider === "remote" ? "远端模型" : analysis.provider === "fallback" ? "本地回退" : "本地演示"}</span>}
          </div>

          <ThinkingTrace result={analysis} revealCount={revealCount} isAnalyzing={isAnalyzing} onSkipReveal={onSkipReveal} />

          {analysis && !isAnalyzing && (
            <div className="diagnosis-results">
              <article className="misconception-card">
                <div className="result-card__header">
                  <span className="result-card__kicker"><Target size={15} aria-hidden="true" /> PRIMARY MISCONCEPTION</span>
                  {analysis.confidence && <span className="confidence-label">置信度 {analysis.confidence === "high" ? "高" : analysis.confidence === "medium" ? "中" : "低"}</span>}
                </div>
                <h3>{analysis.misconception.label}</h3>
                <p>{analysis.misconception.explanation}</p>
                <blockquote>“{analysis.misconception.evidence}”</blockquote>
                <p className="result-card__note"><Check size={15} aria-hidden="true" /> 这不是“不会”，而是思维在一个具体步骤偏离了。</p>
              </article>

              <article className="probe-card">
                <div className="result-card__header">
                  <span className="result-card__kicker"><MessageCircleQuestion size={15} aria-hidden="true" /> SOCRATIC PROBE</span>
                  <span className="result-card__badge">先问一个问题</span>
                </div>
                <h3>{analysis.socraticProbe}</h3>
                <label className="reflection-field">
                  <span>你的新想法</span>
                  <textarea
                    rows={2}
                    value={reflection}
                    placeholder="试着回答这个问题，不需要马上写得完美。"
                    onChange={(event) => setReflection(event.target.value)}
                    disabled={reflectionRecorded}
                  />
                </label>
                <div className="probe-card__footer">
                  {reflectionRecorded ? <span className="recorded-label"><Check size={15} aria-hidden="true" /> 已加入本次思维轨迹</span> : <span />}
                  <button className="secondary-button" type="button" disabled={!reflection.trim() || reflectionRecorded} onClick={handleReflection}>
                    {reflectionRecorded ? "已记录" : "记录反思"}
                  </button>
                </div>
              </article>

              <article className="prescription-card">
                <div className="result-card__header">
                  <span className="result-card__kicker"><BookOpen size={15} aria-hidden="true" /> LEARNING PRESCRIPTION</span>
                  <span className="result-card__badge">带走一张小卡</span>
                </div>
                <div className="prescription-analogy"><span className="prescription-icon"><Lightbulb size={17} aria-hidden="true" /></span><p>{analysis.prescription.analogy}</p></div>
                <div className="practice-list">
                  {analysis.prescription.practices.map((practice, index) => <div className="practice-item" key={practice}><span>{index + 1}</span><p>{practice}</p></div>)}
                </div>
                <div className="prescription-reflection"><span>反思一下</span><p>{analysis.prescription.reflection}</p></div>
              </article>
            </div>
          )}

          {analysis?.provider === "fallback" && (
            <p className="fallback-note" role="status"><RotateCcw size={14} aria-hidden="true" /> 远端模型暂时不可用，已用本地演示结果继续。{analysis.fallbackReason ? `（${analysis.fallbackReason}）` : ""}</p>
          )}
        </section>
      </div>
    </main>
  );
}
