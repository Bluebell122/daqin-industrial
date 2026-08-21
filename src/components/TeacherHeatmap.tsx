import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  EyeOff,
  MessageCircleQuestion,
  UsersRound,
  X,
} from "lucide-react";
import {
  getHeatmapCells,
  heatmapTotalForSubject,
  MISCONCEPTION_BY_CODE,
  MISCONCEPTION_DEFINITIONS,
} from "../data/heatmap";
import { SUBJECTS } from "../data/subjects";
import type { HeatmapCounts, MisconceptionCode, Subject } from "../types";

export type HeatmapFilter = "all" | Subject;

export interface TeacherHeatmapProps {
  counts: HeatmapCounts;
  subjectFilter?: HeatmapFilter;
  onFilterChange?: (filter: HeatmapFilter) => void;
}

function intensity(count: number, total: number): number {
  if (count <= 0 || total <= 0) return 0;
  return Math.min(1, count / Math.max(1, total * 0.24));
}

export function TeacherHeatmap({ counts, subjectFilter, onFilterChange }: TeacherHeatmapProps) {
  const [internalFilter, setInternalFilter] = useState<HeatmapFilter>(subjectFilter ?? "all");
  const [selected, setSelected] = useState<{ subject: Subject; code: MisconceptionCode } | null>(null);

  useEffect(() => {
    if (subjectFilter) setInternalFilter(subjectFilter);
  }, [subjectFilter]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const filter = subjectFilter ?? internalFilter;
  const visibleSubjects = filter === "all" ? SUBJECTS.map((item) => item.id) : [filter];
  const cells = useMemo(() => getHeatmapCells(counts, visibleSubjects), [counts, visibleSubjects]);
  const selectedDefinition = selected && selected.code !== "undetermined" ? MISCONCEPTION_BY_CODE[selected.code] : null;
  const selectedCount = selected ? counts[selected.subject][selected.code] ?? 0 : 0;
  const selectedTotal = selected ? heatmapTotalForSubject(counts, selected.subject) : 0;

  const selectFilter = (next: HeatmapFilter) => {
    setInternalFilter(next);
    onFilterChange?.(next);
  };

  return (
    <main className="teacher-view" aria-labelledby="teacher-view-title">
      <div className="teacher-view__intro">
        <div>
          <p className="eyebrow">TEACHER MODE / ANONYMOUS PATTERNS</p>
          <h1 id="teacher-view-title">班级认知热力图</h1>
          <p>不看谁答错了，只看哪些思维误区值得下一次课堂一起拆开。</p>
        </div>
        <div className="privacy-chip"><EyeOff size={15} aria-hidden="true" />匿名聚合，不排名</div>
      </div>

      <div className="teacher-summary-row">
        {SUBJECTS.map((item) => {
          const total = heatmapTotalForSubject(counts, item.id);
          return <div className={`teacher-summary-card teacher-summary-card--${item.accent}`} key={item.id}><span>{item.label}</span><strong>{total}</strong><small>条匿名思维记录</small></div>;
        })}
        <div className="teacher-summary-card teacher-summary-card--quiet"><span>关注点</span><strong>{MISCONCEPTION_DEFINITIONS.length}</strong><small>种可识别误区</small></div>
      </div>

      <section className="heatmap-panel" aria-labelledby="heatmap-panel-title">
        <div className="heatmap-panel__header">
          <div><p className="eyebrow">COGNITIVE HEATMAP</p><h2 id="heatmap-panel-title">全班最集中的思维卡点</h2></div>
          <div className="heatmap-filters" role="group" aria-label="按学科筛选">
            <button className={filter === "all" ? "is-active" : ""} type="button" onClick={() => selectFilter("all")}>全部</button>
            {SUBJECTS.map((item) => <button key={item.id} className={filter === item.id ? "is-active" : ""} type="button" onClick={() => selectFilter(item.id)}>{item.label}</button>)}
          </div>
        </div>

        <div className="heatmap-key" aria-label="热度图图例"><span>较少</span><i className="heatmap-key__swatch heatmap-key__swatch--low" /><i className="heatmap-key__swatch heatmap-key__swatch--mid" /><i className="heatmap-key__swatch heatmap-key__swatch--high" /><span>集中</span></div>

        <div className="heatmap-scroll">
          <div className="heatmap-table" role="table" aria-label="错误概念按学科分布" style={{ "--heat-columns": visibleSubjects.length } as CSSProperties}>
            <div className="heatmap-row heatmap-row--header" role="row">
              <span role="columnheader">误区</span>
              {visibleSubjects.map((subject) => <span role="columnheader" key={subject}>{SUBJECTS.find((item) => item.id === subject)?.label}</span>)}
            </div>
            {MISCONCEPTION_DEFINITIONS.map((definition) => (
              <div className="heatmap-row" role="row" key={definition.code}>
                <div className="heatmap-label" role="rowheader"><strong>{definition.shortLabel}</strong><span>{definition.label}</span></div>
                {visibleSubjects.map((subject) => {
                  const cell = cells.find((item) => item.subject === subject && item.code === definition.code);
                  const count = cell?.count ?? 0;
                  const total = heatmapTotalForSubject(counts, subject);
                  const level = intensity(count, total);
                  const style = { "--heat-level": level } as CSSProperties;
                  return <button key={`${subject}-${definition.code}`} className={`heatmap-cell ${count === 0 ? "is-empty" : ""}`} style={style} type="button" role="cell" onClick={() => setSelected({ subject, code: definition.code })} aria-label={`${SUBJECTS.find((item) => item.id === subject)?.label} ${definition.label}，${count} 人，占 ${cell?.percentage ?? 0}%`}><strong>{count || "—"}</strong>{count > 0 && <small>{cell?.percentage ?? 0}%</small>}</button>;
                })}
              </div>
            ))}
          </div>
        </div>
        <p className="heatmap-panel__footer"><BarChart3 size={15} aria-hidden="true" /> 数字来自内置演示样本与本机匿名聚合；不会显示姓名、学号或个体排名。</p>
      </section>

      {selected && (
        <div className="heatmap-inspector-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <aside className="heatmap-inspector" role="dialog" aria-modal="true" aria-labelledby="heatmap-inspector-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="trace-inspector__topline"><span className="inspector-subject"><UsersRound size={15} aria-hidden="true" />{SUBJECTS.find((item) => item.id === selected.subject)?.label} / 匿名样本</span><button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="关闭误区详情"><X size={18} aria-hidden="true" /></button></div>
            <p className="eyebrow">CLASSROOM SIGNAL / {selected.code.toUpperCase()}</p>
            <h3 id="heatmap-inspector-title">{selectedDefinition?.label ?? "尚未归类"}</h3>
            <p className="heatmap-inspector__count"><strong>{selectedCount}</strong> 条记录 <span>· {selectedTotal > 0 ? Math.round((selectedCount / selectedTotal) * 100) : 0}%</span></p>
            <div className="inspector-section"><p className="inspector-section__label">这类误区是什么</p><p>{selectedDefinition?.description ?? "目前没有足够证据归入某一种常见误区。"}</p></div>
            <div className="inspector-section"><p className="inspector-section__label"><MessageCircleQuestion size={14} aria-hidden="true" /> 一条匿名代表性思考</p><blockquote>“{selectedDefinition?.representativeThought ?? "我还没找到可以复述的共同思路。"}”</blockquote></div>
            <div className="intervention-box"><p className="inspector-section__label"><ArrowUpRight size={14} aria-hidden="true" /> 下一次课堂可以试试</p><p>{selectedDefinition?.classroomIntervention ?? "先收集更多思考，再决定适合的课堂干预。"}</p></div>
            <div className="probe-box"><p className="inspector-section__label"><MessageCircleQuestion size={14} aria-hidden="true" /> 可以这样追问</p><p>{selectedDefinition?.probe ?? "你是根据哪一条证据做出这个判断的？"}</p></div>
            <button className="secondary-button secondary-button--wide" type="button" onClick={() => setSelected(null)}>回到热力图 <ChevronRight size={16} aria-hidden="true" /></button>
          </aside>
        </div>
      )}
    </main>
  );
}
