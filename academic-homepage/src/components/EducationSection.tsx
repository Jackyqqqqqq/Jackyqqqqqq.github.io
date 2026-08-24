import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface EducationSectionProps {
  locale: Locale;
}

export default function EducationSection({ locale }: EducationSectionProps) {
  return (
    <section className="content-section" id="education">
      <h2>{pick(siteContent.navigation[3].label, locale)}</h2>
      <ol className="education-list">
        {siteContent.education.map((entry) => (
          <li key={`${entry.institution.en}-${entry.period}`}>
            <div className="education-node">
              <img
                alt={pick(entry.logoAlt, locale)}
                className="education-logo"
                height="44"
                src={entry.logo}
                width="44"
              />
            </div>
            <article className="education-card">
              <div className="education-heading">
                <h3>{pick(entry.institution, locale)}</h3>
                <time>{entry.period}</time>
              </div>
              <p className="education-school">{pick(entry.school, locale)}</p>
              <p className="education-degree">{pick(entry.degree, locale)}</p>
              <ul>
                {entry.details.map((detail) => (
                  <li key={detail.en}>{pick(detail, locale)}</li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
