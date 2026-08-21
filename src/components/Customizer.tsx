import { Moon, RotateCcw, Settings2, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { localeNames, locales, type Locale, type UiCopy } from "../config";

type CustomizerProps = {
  dark: boolean;
  motion: boolean;
  accent: string;
  frost: number;
  locale: Locale;
  copy: UiCopy["customizer"];
  onDarkChange: (value: boolean) => void;
  onMotionChange: (value: boolean) => void;
  onAccentChange: (value: string) => void;
  onFrostChange: (value: number) => void;
  onLocaleChange: (value: Locale) => void;
  onReset: () => void;
};

const swatches = ["#ef5b3f", "#07866f", "#e0a112", "#316bd6"];

export function Customizer(props: CustomizerProps) {
  const [open, setOpen] = useState(false);
  const { copy } = props;
  const rootRef = useRef<HTMLDivElement>(null);

  // Esc 或点到面板外时收起，和移动端导航菜单同一套直觉。
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  // 深浅色从点击处圆形揭示过去（View Transitions）。不支持 / 用户关动效时退回普通切换。
  const pickMode = (dark: boolean) => (event: React.MouseEvent) => {
    if (dark === props.dark) return;
    const doc = document as Document & { startViewTransition?: (update: () => void) => void };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!props.motion || reduce || !doc.startViewTransition) {
      props.onDarkChange(dark);
      return;
    }
    document.documentElement.style.setProperty("--vt-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--vt-y", `${event.clientY}px`);
    doc.startViewTransition(() => flushSync(() => props.onDarkChange(dark)));
  };

  return (
    <div ref={rootRef} className={`customizer ${open ? "is-open" : ""}`}>
      <button
        className="icon-button customizer-trigger"
        type="button"
        title={open ? copy.close : copy.open}
        aria-label={open ? copy.close : copy.open}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} /> : <Settings2 size={20} />}
      </button>
      <aside className="customizer-panel glass glass-panel" aria-hidden={!open}>
        <div className="customizer-heading">
          <span>{copy.title}</span>
          <button className="icon-button subtle" type="button" title={copy.reset} aria-label={copy.reset} onClick={props.onReset}>
            <RotateCcw size={17} />
          </button>
        </div>

        <div className="control-row">
          <span>{copy.language}</span>
          <div className="segmented segmented-text" role="group" aria-label={copy.languageGroup}>
            {locales.map((locale) => (
              <button
                key={locale}
                className={props.locale === locale ? "active" : ""}
                type="button"
                aria-pressed={props.locale === locale}
                onClick={() => props.onLocaleChange(locale)}
              >
                {localeNames[locale]}
              </button>
            ))}
          </div>
        </div>

        <div className="control-row">
          <span>{copy.mode}</span>
          <div className="segmented" role="group" aria-label={copy.modeGroup}>
            <button className={!props.dark ? "active" : ""} type="button" aria-label={copy.light} aria-pressed={!props.dark} onClick={pickMode(false)}>
              <Sun size={17} />
            </button>
            <button className={props.dark ? "active" : ""} type="button" aria-label={copy.dark} aria-pressed={props.dark} onClick={pickMode(true)}>
              <Moon size={17} />
            </button>
          </div>
        </div>

        <div className="control-row">
          <span>{copy.accent}</span>
          <div className="swatches" role="radiogroup" aria-label={copy.accent}>
            {swatches.map((color) => (
              <button
                key={color}
                className={props.accent === color ? "active" : ""}
                type="button"
                role="radio"
                aria-checked={props.accent === color}
                aria-label={color}
                style={{ backgroundColor: color }}
                onClick={() => props.onAccentChange(color)}
              />
            ))}
          </div>
        </div>

        <label className="control-row frost-row">
          <span>{copy.frost}</span>
          <input
            className="frost-slider"
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={props.frost}
            aria-label={copy.frost}
            onChange={(event) => props.onFrostChange(Number(event.target.value))}
          />
        </label>

        <label className="toggle-row">
          <span>{copy.motion}</span>
          <input type="checkbox" checked={props.motion} onChange={(event) => props.onMotionChange(event.target.checked)} />
          <span className="toggle" aria-hidden="true" />
        </label>
      </aside>
    </div>
  );
}
