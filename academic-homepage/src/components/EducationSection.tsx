import { useEffect, useRef, useState } from "react";
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const restoreRef = useRef<number | null>(null);

  useEffect(() => {
    if (openIndex !== null) {
      restoreRef.current = openIndex;
      panelRefs.current[openIndex]?.focus();
    } else if (restoreRef.current !== null) {
      buttonRefs.current[restoreRef.current]?.focus();
      restoreRef.current = null;
    }
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [openIndex]);

  return (
    <section className="content-section" id="education">
      <h2>{pick(siteContent.navigation[3].label, locale)}</h2>
      <ol className="education-list">
        {siteContent.education.map((entry, index) => {
          const isOpen = openIndex === index;
          const panelId = `education-${index}-panel`;
          return (
            <li key={`${entry.institution.en}-${entry.period}`} data-open={isOpen ? "true" : undefined}>
              <h3 className="education-cover-heading">
                <button
                  type="button"
                  className="education-cover"
                  ref={(element) => {
                    buttonRefs.current[index] = element;
                  }}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
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
                tabIndex={-1}
                ref={(element) => {
                  panelRefs.current[index] = element;
                }}
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
