import { useEffect, useRef, useState } from "react";
import { siteContent } from "../content";
import type { Accent, Appearance } from "../displayPreferences";
import { useDisplayPreferences } from "../displayPreferences";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface DisplaySettingsProps {
  locale: Locale;
}

const APPEARANCE_OPTIONS: Array<{ value: Appearance; label: keyof typeof siteContent.ui }> = [
  { value: "auto", label: "appearanceAuto" },
  { value: "bright", label: "appearanceBright" },
  { value: "soft", label: "appearanceSoft" },
  { value: "dark", label: "appearanceDark" }
];

const ACCENT_OPTIONS: Array<{ value: Accent; label: keyof typeof siteContent.ui }> = [
  { value: "navy", label: "accentNavy" },
  { value: "forest", label: "accentForest" },
  { value: "burgundy", label: "accentBurgundy" },
  { value: "violet", label: "accentViolet" }
];

export default function DisplaySettings({ locale }: DisplaySettingsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { preferences, updatePreferences, resetPreferences } = useDisplayPreferences();
  const label = pick(siteContent.ui.displaySettings, locale);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div className="display-settings" ref={containerRef}>
      <button
        className="display-settings-trigger"
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-controls="display-settings-panel"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">Aa</span>
      </button>

      {open && (
        <div
          className="display-settings-panel"
          id="display-settings-panel"
          role="dialog"
          aria-label={label}
          aria-modal="false"
        >
          <div className="display-settings-heading">
            <p>{label}</p>
            <span aria-hidden="true">Aa</span>
          </div>

          <fieldset className="display-settings-group">
            <legend>{pick(siteContent.ui.appearance, locale)}</legend>
            <div className="appearance-options">
              {APPEARANCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={preferences.appearance === option.value}
                  onClick={() => updatePreferences({ appearance: option.value })}
                >
                  {pick(siteContent.ui[option.label], locale)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="display-settings-group">
            <legend>{pick(siteContent.ui.accentColor, locale)}</legend>
            <div className="accent-options">
              {ACCENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`accent-option accent-option-${option.value}`}
                  type="button"
                  aria-pressed={preferences.accent === option.value}
                  onClick={() => updatePreferences({ accent: option.value })}
                >
                  <span className="accent-swatch" aria-hidden="true" />
                  <span>{pick(siteContent.ui[option.label], locale)}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="display-settings-group font-scale-control">
            <div className="font-scale-label">
              <label htmlFor="font-scale">{pick(siteContent.ui.fontSize, locale)}</label>
              <output htmlFor="font-scale">{preferences.fontScale}%</output>
            </div>
            <input
              id="font-scale"
              type="range"
              min="90"
              max="120"
              step="5"
              value={preferences.fontScale}
              onKeyDown={(event) => {
                const direction =
                  event.key === "ArrowRight" || event.key === "ArrowUp"
                    ? 5
                    : event.key === "ArrowLeft" || event.key === "ArrowDown"
                      ? -5
                      : 0;
                if (!direction) return;

                event.preventDefault();
                updatePreferences({
                  fontScale: Math.min(120, Math.max(90, preferences.fontScale + direction))
                });
              }}
              onChange={(event) => updatePreferences({ fontScale: Number(event.target.value) })}
            />
            <div className="font-scale-limits" aria-hidden="true">
              <span>90%</span>
              <span>120%</span>
            </div>
          </div>

          <button className="display-settings-reset" type="button" onClick={resetPreferences}>
            {pick(siteContent.ui.resetDisplay, locale)}
          </button>
        </div>
      )}
    </div>
  );
}
