import { useState } from "react";
import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface EducationSectionProps {
  locale: Locale;
}

const DEGREE_BADGES = [
  { zh: "硕士研究生", en: "Master's Degree" },
  { zh: "本科", en: "Bachelor's Degree" }
];

export default function EducationSection({ locale }: EducationSectionProps) {
  // Each emblem toggles independently and stays open until clicked again.
  const [openSet, setOpenSet] = useState<ReadonlySet<number>>(() => new Set());

  const toggle = (index: number) => {
    setOpenSet((previous) => {
      const next = new Set(previous);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section className="content-section" id="education">
      <h2>{pick(siteContent.navigation[3].label, locale)}</h2>
      <ol className="education-list">
        {siteContent.education.map((entry, index) => {
          const isOpen = openSet.has(index);
          const panelId = `education-${index}-panel`;
          return (
            <li key={`${entry.institution.en}-${entry.period}`} data-open={isOpen ? "true" : undefined}>
              <h3 className="education-cover-heading">
                <button
                  type="button"
                  className="education-cover"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(index)}
                >
                  <img
                    alt={pick(entry.logoAlt, locale)}
                    className="education-logo"
                    height="112"
                    src={entry.logo}
                    width="112"
                  />
                  <span className="education-badge">
                    {pick(DEGREE_BADGES[index] ?? { zh: "学位", en: "Degree" }, locale)}
                  </span>
                  <span className="education-institution">{pick(entry.institution, locale)}</span>
                </button>
              </h3>
              <div
                className="education-details"
                id={panelId}
                role="group"
                aria-label={pick(entry.institution, locale)}
                hidden={!isOpen}
              >
                <div className="education-heading">
                  <h4>{pick(entry.institution, locale)}</h4>
                  <time>{entry.period}</time>
                </div>
                <p className="education-school">{pick(entry.school, locale)}</p>
                <p className="education-degree">{pick(entry.degree, locale)}</p>
                <ul>
                  {entry.details.map((detail) => (
                    <li key={detail.en}>{pick(detail, locale)}</li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
