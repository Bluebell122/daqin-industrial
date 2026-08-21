import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Database, KeyRound, Moon, ShieldCheck, Sun, Trash2, X } from "lucide-react";
import type { Theme } from "../types";

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  onClearData?: () => void;
  onPrivacyReset?: () => void;
  remoteConfigured?: boolean;
}

export function SettingsDrawer({
  open,
  onClose,
  theme = "light",
  onThemeChange,
  onClearData,
  onPrivacyReset,
  remoteConfigured = false,
}: SettingsDrawerProps) {
  const [confirming, setConfirming] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  if (!open) return null;

  const clearData = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onClearData?.();
    onPrivacyReset?.();
    setConfirming(false);
    onClose();
  };

  return (
    <div className="settings-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="settings-drawer__header">
          <div><p className="eyebrow">WORKSPACE SETTINGS</p><h2 id="settings-title">设置</h2></div>
          <button className="icon-button" type="button" onClick={onClose} ref={closeButtonRef} aria-label="关闭设置"><X size={19} aria-hidden="true" /></button>
        </div>

        <section className="settings-section">
          <div className="settings-section__heading"><Moon size={17} aria-hidden="true" /><div><h3>界面主题</h3><p>选择一个适合长时间观察思考的界面。</p></div></div>
          <div className="theme-switcher" role="group" aria-label="选择界面主题">
            <button className={theme === "light" ? "is-active" : ""} type="button" onClick={() => onThemeChange?.("light")}><Sun size={16} aria-hidden="true" />明亮{theme === "light" && <Check size={14} aria-hidden="true" />}</button>
            <button className={theme === "dark" ? "is-active" : ""} type="button" onClick={() => onThemeChange?.("dark")}><Moon size={16} aria-hidden="true" />深色{theme === "dark" && <Check size={14} aria-hidden="true" />}</button>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__heading"><ShieldCheck size={17} aria-hidden="true" /><div><h3>隐私与数据</h3><p>不收集姓名、学号或学生排名。</p></div></div>
          <div className="settings-info-list">
            <div><Database size={15} aria-hidden="true" /><span>草稿、最近诊断和热力图只保存在当前浏览器。</span></div>
            <div><KeyRound size={15} aria-hidden="true" /><span>{remoteConfigured ? "已配置远端模型；分析前请确认输入会离开本机。" : "未配置远端模型；当前使用本地演示分析。"}</span></div>
          </div>
          <button className="privacy-reset-button" type="button" onClick={onPrivacyReset}>重新查看隐私说明 <ChevronRight size={15} aria-hidden="true" /></button>
        </section>

        <section className="settings-section settings-section--danger">
          <div className="settings-section__heading"><Trash2 size={17} aria-hidden="true" /><div><h3>清除本机数据</h3><p>清除草稿、最近诊断、匿名聚合和隐私确认。内置案例不会被删除。</p></div></div>
          <button className={`danger-button ${confirming ? "is-confirming" : ""}`} type="button" onClick={clearData}>
            <Trash2 size={16} aria-hidden="true" />{confirming ? "再次点击确认清除" : "清除本机数据"}
          </button>
          {confirming && <button className="cancel-button" type="button" onClick={() => setConfirming(false)}>取消</button>}
        </section>

        <p className="settings-drawer__footer">Debug My Thinking · 黑客松演示版</p>
      </aside>
    </div>
  );
}
