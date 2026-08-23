import { useCallback, useLayoutEffect, useState } from "react";

export type Appearance = "auto" | "bright" | "soft" | "dark";
export type Accent = "navy" | "forest" | "burgundy" | "violet";

export interface DisplayPreferences {
  appearance: Appearance;
  accent: Accent;
  fontScale: number;
}

export const DISPLAY_STORAGE_KEY = "academic-homepage-display";
export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  appearance: "bright",
  accent: "navy",
  fontScale: 100
};

const APPEARANCES: Appearance[] = ["auto", "bright", "soft", "dark"];
const ACCENTS: Accent[] = ["navy", "forest", "burgundy", "violet"];
const FONT_SCALES = [90, 95, 100, 105, 110, 115, 120];

function isDisplayPreferences(value: unknown): value is DisplayPreferences {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<DisplayPreferences>;
  return (
    APPEARANCES.includes(candidate.appearance as Appearance) &&
    ACCENTS.includes(candidate.accent as Accent) &&
    FONT_SCALES.includes(candidate.fontScale as number)
  );
}

export function readDisplayPreferences(): DisplayPreferences {
  try {
    const stored = window.localStorage.getItem(DISPLAY_STORAGE_KEY);
    if (!stored) return DEFAULT_DISPLAY_PREFERENCES;

    const parsed: unknown = JSON.parse(stored);
    return isDisplayPreferences(parsed) ? parsed : DEFAULT_DISPLAY_PREFERENCES;
  } catch {
    return DEFAULT_DISPLAY_PREFERENCES;
  }
}

export function applyDisplayPreferences(preferences: DisplayPreferences): void {
  const root = document.documentElement;
  root.dataset.appearance = preferences.appearance;
  root.dataset.accent = preferences.accent;
  root.dataset.fontScale = String(preferences.fontScale);
  root.style.setProperty("--font-scale", String(preferences.fontScale / 100));
}

export function useDisplayPreferences() {
  const [preferences, setPreferences] = useState<DisplayPreferences>(readDisplayPreferences);

  useLayoutEffect(() => {
    applyDisplayPreferences(preferences);

    try {
      window.localStorage.setItem(DISPLAY_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // The controls still work for the current visit when storage is unavailable.
    }
  }, [preferences]);

  const updatePreferences = useCallback((next: Partial<DisplayPreferences>) => {
    setPreferences((current) => ({ ...current, ...next }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_DISPLAY_PREFERENCES);
  }, []);

  return { preferences, updatePreferences, resetPreferences };
}
