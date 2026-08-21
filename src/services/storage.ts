import { cloneHeatmapCounts, DEFAULT_HEATMAP_COUNTS } from "../data/heatmap";
import type {
  AnalysisResult,
  DraftsBySubject,
  HeatmapCounts,
  MisconceptionCode,
  Page,
  Subject,
  Theme,
} from "../types";

export const STORAGE_KEYS = {
  privacyConfirmed: "dmt:privacy-confirmed",
  drafts: "dmt:drafts",
  lastAnalysis: "dmt:last-analysis",
  heatmap: "dmt:heatmap",
  theme: "dmt:theme",
  activePage: "dmt:active-page",
} as const;

export const EMPTY_DRAFTS: DraftsBySubject = {
  math: { question: "", draft: "", rationale: "", stuckAt: "" },
  science: { question: "", draft: "", rationale: "", stuckAt: "" },
  language: { question: "", draft: "", rationale: "", stuckAt: "" },
};

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storage(): StorageLike | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readJson<T>(key: string, fallback: T): T {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota and private browsing failures should not block learning.
  }
}

export function loadPrivacyConfirmed(): boolean {
  return storage()?.getItem(STORAGE_KEYS.privacyConfirmed) === "true";
}

export function savePrivacyConfirmed(confirmed = true): void {
  try {
    if (confirmed) storage()?.setItem(STORAGE_KEYS.privacyConfirmed, "true");
    else storage()?.removeItem(STORAGE_KEYS.privacyConfirmed);
  } catch {
    // Best effort only; the privacy dialog will appear again if storage fails.
  }
}

function isSubject(value: string): value is Subject {
  return value === "math" || value === "science" || value === "language";
}

export function loadDrafts(): DraftsBySubject {
  const saved = readJson<Partial<DraftsBySubject>>(STORAGE_KEYS.drafts, {});
  return {
    math: { ...EMPTY_DRAFTS.math, ...(saved.math ?? {}) },
    science: { ...EMPTY_DRAFTS.science, ...(saved.science ?? {}) },
    language: { ...EMPTY_DRAFTS.language, ...(saved.language ?? {}) },
  };
}

export function saveDrafts(drafts: DraftsBySubject): void {
  writeJson(STORAGE_KEYS.drafts, drafts);
}

export function updateDraft(subject: Subject, draft: DraftsBySubject[Subject]): DraftsBySubject {
  const next = loadDrafts();
  next[subject] = { ...EMPTY_DRAFTS[subject], ...draft };
  saveDrafts(next);
  return next;
}

export function loadLastAnalysis(): AnalysisResult | null {
  const value = readJson<AnalysisResult | null>(STORAGE_KEYS.lastAnalysis, null);
  return value && Array.isArray(value.trace) ? value : null;
}

export function saveLastAnalysis(result: AnalysisResult | null): void {
  if (result) writeJson(STORAGE_KEYS.lastAnalysis, result);
  else {
    try {
      storage()?.removeItem(STORAGE_KEYS.lastAnalysis);
    } catch {
      // Best effort only.
    }
  }
}

export function loadHeatmap(): HeatmapCounts {
  const saved = readJson<Partial<HeatmapCounts>>(STORAGE_KEYS.heatmap, {});
  return {
    math: { ...DEFAULT_HEATMAP_COUNTS.math, ...(saved.math ?? {}) },
    science: { ...DEFAULT_HEATMAP_COUNTS.science, ...(saved.science ?? {}) },
    language: { ...DEFAULT_HEATMAP_COUNTS.language, ...(saved.language ?? {}) },
  };
}

export function saveHeatmap(counts: HeatmapCounts): void {
  writeJson(STORAGE_KEYS.heatmap, counts);
}

export function recordHeatmapResult(
  subject: Subject,
  code: MisconceptionCode,
): HeatmapCounts {
  const next = cloneHeatmapCounts(loadHeatmap());
  next[subject][code] = (next[subject][code] ?? 0) + 1;
  saveHeatmap(next);
  return next;
}

export function loadTheme(): Theme | null {
  const value = storage()?.getItem(STORAGE_KEYS.theme);
  return value === "light" || value === "dark" ? value : null;
}

export function saveTheme(theme: Theme): void {
  try {
    storage()?.setItem(STORAGE_KEYS.theme, theme);
  } catch {
    // Best effort only.
  }
}

export function loadActivePage(): Page {
  const value = storage()?.getItem(STORAGE_KEYS.activePage);
  return value === "teacher" ? "teacher" : "student";
}

export function saveActivePage(page: Page): void {
  try {
    storage()?.setItem(STORAGE_KEYS.activePage, page);
  } catch {
    // Best effort only.
  }
}

export function clearDmtStorage(): void {
  const store = storage();
  if (!store) return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      store.removeItem(key);
    } catch {
      // Continue clearing other keys if one key is unavailable.
    }
  });
}

export function isStorageAvailable(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    const key = "dmt:storage-test";
    store.setItem(key, "1");
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getSubjectDraft(drafts: DraftsBySubject, subject: Subject): DraftsBySubject[Subject] {
  return drafts[isSubject(subject) ? subject : "math"] ?? EMPTY_DRAFTS.math;
}
