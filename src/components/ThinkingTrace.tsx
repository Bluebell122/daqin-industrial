import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  ChevronRight,
  Clock3,
  FileQuestion,
  Loader2,
  X,
} from "lucide-react";
import type { AnalysisResult, TraceNode, TraceStatus } from "../types";

export interface ThinkingTraceProps {
  result: AnalysisResult | null;
  /** Number of trace nodes revealed while the staged animation is running. */
  revealCount?: number;
  isAnalyzing?: boolean;
  onSkipReveal?: () => void;
}

const statusMeta: Record<
  TraceStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  clear: { label: "已通过", className: "is-clear", Icon: CheckCircle2 },
  attention: { label: "需要留意", className: "is-attention", Icon: AlertTriangle },
  blocked: { label: "卡点", className: "is-blocked", Icon: CircleDot },
  not_started: { label: "待分析", className: "is-pending", Icon: CircleDashed },
};

function TraceNodeCard({
  node,
  index,
  onSelect,
}: {
  node: TraceNode;
  index: number;
  onSelect: (node: TraceNode) => void;
}) {
  const meta = statusMeta[node.status];
  const StatusIcon = meta.Icon;
  const isDisabled = node.status === "not_started";

  return (
    <div className={`trace-node ${meta.className} ${isDisabled ? "is-disabled" : ""}`}>
      <div className="trace-node__rail" aria-hidden="true">
        <span className="trace-node__index">{String(index + 1).padStart(2, "0")}</span>
        <span className="trace-node__line" />
      </div>
      <button
        className="trace-node__body"
        type="button"
        disabled={isDisabled}
        onClick={() => onSelect(node)}
        aria-label={`${node.label}：${meta.label}`}
      >
        <span className="trace-node__heading">
          <span className="trace-node__icon" aria-hidden="true">
            <StatusIcon size={16} strokeWidth={2.2} />
          </span>
          <span className="trace-node__label">{node.label}</span>
          <span className="trace-node__status">{meta.label}</span>
          {!isDisabled && <ChevronRight className="trace-node__chevron" size={15} aria-hidden="true" />}
        </span>
        <span className="trace-node__summary">{node.summary}</span>
      </button>
    </div>
  );
}

function TraceInspector({ node, onClose }: { node: TraceNode; onClose: () => void }) {
  const meta = statusMeta[node.status];
  const StatusIcon = meta.Icon;

  return (
    <div className="trace-inspector-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="trace-inspector"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trace-inspector-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="trace-inspector__topline">
          <span className={`status-mark ${meta.className}`}>
            <StatusIcon size={15} aria-hidden="true" />
            {meta.label}
          </span>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭节点详情">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="eyebrow">THINKING TRACE / {node.id.toUpperCase()}</p>
        <h3 id="trace-inspector-title">{node.label}</h3>
        <p className="trace-inspector__summary">{node.summary}</p>

        <div className="inspector-section">
          <p className="inspector-section__label">学生在这里留下的线索</p>
          <blockquote>{node.evidence?.trim() || "这一阶段还没有足够的文字线索。先把你的判断说出来，系统才能继续定位。"}</blockquote>
        </div>

        <div className="inspector-section inspector-section--next">
          <p className="inspector-section__label">下一步可以检查</p>
          <p>{node.nextStep?.trim() || "用一句话说明你从这一步如何走到下一步。"}</p>
        </div>
      </aside>
    </div>
  );
}

export function ThinkingTrace({
  result,
  revealCount,
  isAnalyzing = false,
  onSkipReveal,
}: ThinkingTraceProps) {
  const [selectedNode, setSelectedNode] = useState<TraceNode | null>(null);

  useEffect(() => {
    if (!selectedNode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedNode(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedNode]);

  useEffect(() => {
    setSelectedNode(null);
  }, [result]);

  if (!result) {
    return (
      <section className="trace-panel trace-panel--empty" aria-labelledby="trace-empty-title">
        <div className="trace-panel__empty-icon" aria-hidden="true">
          <FileQuestion size={23} strokeWidth={1.8} />
        </div>
        <div>
          <p className="eyebrow">THINKING TRACE</p>
          <h3 id="trace-empty-title">你的思考会在这里展开</h3>
          <p>先写下你怎么想的，不需要把答案写对。我们要找到思维转弯的地方。</p>
        </div>
      </section>
    );
  }

  const total = result.trace.length;
  const visibleCount = isAnalyzing
    ? Math.min(Math.max(revealCount ?? 0, 0), total)
    : total;
  const visibleNodes = result.trace.map((node, index) =>
    index < visibleCount ? node : { ...node, status: "not_started" as const },
  );
  const complete = !isAnalyzing || visibleCount >= total;

  return (
    <section className="trace-panel" aria-labelledby="trace-title">
      <div className="trace-panel__header">
        <div>
          <p className="eyebrow">THINKING TRACE</p>
          <div className="trace-panel__title-row">
            <h3 id="trace-title">思维轨迹</h3>
            <span className="trace-progress" aria-live="polite">
              {visibleCount}/{total} 阶段
            </span>
          </div>
        </div>
        {!complete && onSkipReveal && (
          <button className="text-button" type="button" onClick={onSkipReveal}>
            查看完整诊断
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="trace-node-list" aria-label="六阶段思维轨迹">
        {visibleNodes.map((node, index) => (
          <TraceNodeCard key={node.id} node={node} index={index} onSelect={setSelectedNode} />
        ))}
      </div>

      {isAnalyzing && !complete && (
        <div className="trace-panel__loading" role="status" aria-live="polite">
          <Loader2 className="spin" size={16} aria-hidden="true" />
          <span>正在观察第 {Math.min(visibleCount + 1, total)} 个阶段…</span>
        </div>
      )}

      {complete && (
        <div className="trace-panel__legend" aria-label="轨迹状态说明">
          <span><CheckCircle2 size={14} aria-hidden="true" /> 已通过</span>
          <span><AlertTriangle size={14} aria-hidden="true" /> 需要留意</span>
          <span><CircleDot size={14} aria-hidden="true" /> 卡点</span>
        </div>
      )}

      {selectedNode && <TraceInspector node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </section>
  );
}
