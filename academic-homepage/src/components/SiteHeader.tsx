import { useState } from "react";
import DisplaySettings from "./DisplaySettings";
import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";
import { useReadingProgress } from "../hooks/useReadingProgress";

interface SiteHeaderProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  activeSection: string;
}

export default function SiteHeader({
  locale,
  onLocaleChange,
  activeSection
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = useReadingProgress();

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        {pick(siteContent.ui.skipToContent, locale)}
      </a>
      <div className="site-header-inner">
        <a className="site-mark" href="#about" aria-label={pick(siteContent.identity.name, locale)}>
          QYZ
        </a>

        <nav aria-label="Primary">
          <button
            className="menu-toggle"
            type="button"
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {pick(siteContent.ui.menu, locale)}
          </button>

          <ul id="primary-navigation" data-open={menuOpen}>
            {siteContent.navigation.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={activeSection === item.id ? "location" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {pick(item.label, locale)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-controls">
          <div className="locale-switch" aria-label="Language">
            <button
              type="button"
              lang="zh"
              aria-pressed={locale === "zh"}
              onClick={() => onLocaleChange("zh")}
            >
              中文
            </button>
            <button
              type="button"
              lang="en"
              aria-pressed={locale === "en"}
              onClick={() => onLocaleChange("en")}
            >
              English
            </button>
          </div>
          <DisplaySettings locale={locale} />
        </div>
      </div>
      <div
        className="reading-progress"
        aria-hidden="true"
        style={{ transform: `scaleX(${progress})` }}
      />
    </header>
  );
}
