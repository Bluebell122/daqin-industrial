import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BrainCircuit,
  ChevronDown,
  Copy,
  ExternalLink,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { DEMO_CASES, getDemoCase, getDemoIdForSubmission } from "./data/subjects";
import { StudentWorkspace } from "./components/StudentWorkspace";
import { TeacherHeatmap, type HeatmapFilter } from "./components/TeacherHeatmap";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { analyzeSubmission, type AnalyzerMode } from "./services/analyzer";
import {
  clearDmtStorage,
  EMPTY_DRAFTS,
  loadActivePage,
  loadDrafts,
  loadHeatmap,
  loadLastAnalysis,
  loadPrivacyConfirmed,
  loadTheme,
  recordHeatmapResult,
  saveActivePage,
  saveDrafts,
  saveLastAnalysis,
  savePrivacyConfirmed,
  saveTheme,
  updateDraft,
} from "./services/storage";
import type { AnalysisResult, DraftsBySubject, Page, Subject, Theme } from "./types";

const REVEAL_INTERVAL_MS = 500;

function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function emptySubmission(subject: Subject) {
  return { ...EMPTY_DRAFTS[subject] };
}

function AppHeader({
  page,
  onPageChange,
  mode,
  onModeChange,
  theme,
  onThemeToggle,
  onSettings,
  onLoadDemo,
  onCopyShare,
}: {
  page: Page;
  onPageChange: (page: Page) => void;
  mode: AnalyzerMode;
  onModeChange: (mode: AnalyzerMode) => void;
  theme: Theme;
  onThemeToggle: () => void;
  onSettings: () => void;
  onLoadDemo: () => void;
  onCopyShare: () => void;
}) {
  const remoteReady = Boolean(import.meta.env.VITE_AI_ENDPOINT);
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true"><BrainCircuit size={21} /></div>
        <div><strong>Debug My Thinking</strong><span>认知调试器</span></div>
      </div>
      <nav className="main-nav" aria-label="主导航">
        <button className={page === "student" ? "is-active" : ""} type="button" onClick={() => onPageChange("student")}>思维调试</button>
        <button className={page === "teacher" ? "is-active" : ""} type="button" onClick={() => onPageChange("teacher")}>班级热力图</button>
      </nav>
      <div className="header-actions">
        <div className="mode-switch" role="group" aria-label="选择 AI 分析模式">
          <button className={mode === "local" ? "is-active" : ""} type="button" onClick={() => onModeChange("local")}>本地演示</button>
          <button className={`${mode === "remote" ? "is-active" : ""} ${!remoteReady ? "is-disabled" : ""}`} type="button" onClick={() => remoteReady && onModeChange("remote")} aria-disabled={!remoteReady}>远端模型 {!remoteReady && <span className="mode-unavailable">未配置</span>}</button>
        </div>
        <button className="header-icon-button" type="button" onClick={onLoadDemo} aria-label="载入演示案例" title="载入演示案例"><ExternalLink size={17} /></button>
        <button className="header-icon-button header-share" type="button" onClick={onCopyShare} aria-label="复制演示链接" title="复制演示链接"><Copy size={17} /></button>
        <button className="header-icon-button" type="button" onClick={onThemeToggle} aria-label={theme === "dark" ? "切换到明亮主题" : "切换到深色主题"} title="切换主题">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button className="header-icon-button" type="button" onClick={onSettings} aria-label="打开设置" title="设置"><Settings size={17} /></button>
      </div>
    </header>
  );
}

function PrivacyDialog({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="privacy-backdrop" role="presentation">
      <section className="privacy-dialog" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
        <div className="privacy-dialog__mark"><ShieldCheck size={25} /></div>
        <p className="eyebrow">BEFORE YOU START</p>
        <h2 id="privacy-title">先约定思考的边界</h2>
        <p className="privacy-dialog__lead">这是一间不需要姓名的思维工作台。你写下的原文只会留在当前浏览器，直到你主动切换到远端模型。</p>
        <div className="privacy-dialog__points">
          <div><span>01</span><p>本地演示模式不会发送任何内容，适合课堂和路演。</p></div>
          <div><span>02</span><p>远端模型模式会把输入发送到你配置的 API 端点。</p></div>
          <div><span>03</span><p>教师端只显示匿名聚合，不显示姓名、学号或排名。</p></div>
        </div>
        <button className="primary-button primary-button--full" type="button" onClick={onConfirm}>我明白，开始调试 <ChevronDown size={17} /></button>
      </section>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>(() => loadActivePage());
  const [theme, setTheme] = useState<Theme>(() => loadTheme() ?? systemTheme());
  const [mode, setMode] = useState<AnalyzerMode>("local");
  const [privacyConfirmed, setPrivacyConfirmed] = useState(() => loadPrivacyConfirmed());
  const [drafts, setDrafts] = useState<DraftsBySubject>(() => loadDrafts());
  const [subject, setSubject] = useState<Subject>("math");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => loadLastAnalysis());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [revealCount, setRevealCount] = useState(0);
  const [heatmap, setHeatmap] = useState(() => loadHeatmap());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [heatmapFilter, setHeatmapFilter] = useState<HeatmapFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reflectionRecorded, setReflectionRecorded] = useState(false);
  const revealTimer = useRef<number | null>(null);

  const currentDraft = drafts[subject];
  const remoteConfigured = Boolean(import.meta.env.VITE_AI_ENDPOINT);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveActivePage(page);
  }, [page]);

  useEffect(() => () => {
    if (revealTimer.current) window.clearInterval(revealTimer.current);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const loadDemo = useCallback((demoId?: "math-ratio" | "science-correlation" | "language-evidence") => {
    const demo = getDemoCase(demoId ?? "math-ratio") ?? DEMO_CASES[0];
    setSubject(demo.subject);
    const next = updateDraft(demo.subject, { question: demo.question, draft: demo.draft, rationale: demo.rationale, stuckAt: demo.stuckAt });
    setDrafts(next);
    setAnalysis(null);
    setRevealCount(0);
    setReflectionRecorded(false);
    setPage("student");
    window.history.replaceState(null, "", `#demo=${demo.id}`);
    showToast(`已载入${demo.subject === "math" ? "数学" : demo.subject === "science" ? "科学" : "语文"}演示案例`);
  }, [showToast]);

  useEffect(() => {
    const loadFromHash = () => {
      const hash = window.location.hash.match(/^#demo=(math-ratio|science-correlation|language-evidence)$/)?.[1];
      if (hash) loadDemo(hash as "math-ratio" | "science-correlation" | "language-evidence");
    };
    loadFromHash();
    window.addEventListener("hashchange", loadFromHash);
    return () => window.removeEventListener("hashchange", loadFromHash);
  }, [loadDemo]);

  const handleDraftChange = (field: keyof typeof currentDraft, value: string) => {
    const next = updateDraft(subject, { ...currentDraft, [field]: value });
    setDrafts(next);
    if (analysis) setAnalysis(null);
  };

  const runReveal = useCallback((result: AnalysisResult) => {
    setRevealCount(0);
    setIsAnalyzing(true);
    if (revealTimer.current) window.clearInterval(revealTimer.current);
    let count = 0;
    revealTimer.current = window.setInterval(() => {
      count += 1;
      setRevealCount(count);
      if (count >= result.trace.length) {
        if (revealTimer.current) window.clearInterval(revealTimer.current);
        revealTimer.current = null;
        setIsAnalyzing(false);
      }
    }, REVEAL_INTERVAL_MS);
  }, []);

  const handleAnalyze = async () => {
    setError(null);
    setReflectionRecorded(false);
    const submission = { id: crypto.randomUUID?.() ?? String(Date.now()), subject, ...currentDraft };
    try {
      const result = await analyzeSubmission(submission, mode);
      setAnalysis(result);
      saveLastAnalysis(result);
      setHeatmap(recordHeatmapResult(subject, result.misconception.code));
      runReveal(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析失败，请稍后重试。");
    }
  };

  const handleSkipReveal = () => {
    if (revealTimer.current) window.clearInterval(revealTimer.current);
    revealTimer.current = null;
    setRevealCount(analysis?.trace.length ?? 6);
    setIsAnalyzing(false);
  };

  const handleClearData = () => {
    clearDmtStorage();
    setDrafts({ ...EMPTY_DRAFTS });
    setAnalysis(null);
    setHeatmap(loadHeatmap());
    setPrivacyConfirmed(false);
    setPage("student");
    showToast("本机数据已清除");
  };

  const handleCopyShare = async () => {
    const demoId = getDemoIdForSubmission({ subject, question: currentDraft.question }) ?? "math-ratio";
    const url = `${window.location.origin}${window.location.pathname}#demo=${demoId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("演示链接已复制（只包含案例 ID）");
    } catch {
      showToast("浏览器未允许复制，请手动复制地址栏");
    }
  };

  const onPrivacyReset = () => {
    setPrivacyConfirmed(false);
    setSettingsOpen(false);
  };

  const appClass = useMemo(() => `app-shell app-shell--${page}`, [page]);
  return (
    <div className={appClass}>
      <AppHeader page={page} onPageChange={setPage} mode={mode} onModeChange={setMode} theme={theme} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} onSettings={() => setSettingsOpen(true)} onLoadDemo={() => loadDemo()} onCopyShare={handleCopyShare} />
      <div className="app-main">
        {page === "student" ? (
          <StudentWorkspace subject={subject} draft={currentDraft} onSubjectChange={(next) => { setSubject(next); setAnalysis(null); }} onDraftChange={handleDraftChange} onAnalyze={handleAnalyze} analysis={analysis} isAnalyzing={isAnalyzing} revealCount={revealCount} onSkipReveal={handleSkipReveal} onReflection={() => setReflectionRecorded(true)} reflectionRecorded={reflectionRecorded} error={error} mode={mode} demoCases={DEMO_CASES} onLoadDemo={(demoId) => loadDemo(demoId)} />
        ) : (
          <TeacherHeatmap counts={heatmap} subjectFilter={heatmapFilter} onFilterChange={setHeatmapFilter} />
        )}
      </div>
      <footer className="app-footer"><span>Debug My Thinking / 学会学习的调试器</span><span>本地优先 · 匿名聚合 · 不做排名</span></footer>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} onThemeChange={setTheme} onClearData={handleClearData} onPrivacyReset={onPrivacyReset} remoteConfigured={remoteConfigured} />
      {!privacyConfirmed && <PrivacyDialog onConfirm={() => { savePrivacyConfirmed(true); setPrivacyConfirmed(true); }} />}
      {toast && <div className="toast" role="status"><span>{toast}</span><button type="button" onClick={() => setToast(null)} aria-label="关闭提示"><X size={14} /></button></div>}
    </div>
  );
}

export { App };
