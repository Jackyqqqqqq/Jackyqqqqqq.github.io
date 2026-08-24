import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface AboutSectionProps {
  locale: Locale;
}

export default function AboutSection({ locale }: AboutSectionProps) {
  return (
    <section className="content-section" id="about">
      <h2>{pick(siteContent.navigation[0].label, locale)}</h2>
      <div className="prose">
        {siteContent.about.map((paragraph) => (
          <p key={paragraph.zh}>{pick(paragraph, locale)}</p>
        ))}
      </div>
      <aside className="margin-notes" aria-label="Contact">
        <p className="margin-note">
          <span className="margin-note-label">{pick(siteContent.ui.email, locale)}</span>
          <a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a>
        </p>
        <p className="margin-note">
          <span className="margin-note-label">{pick(siteContent.ui.github, locale)}</span>
          <a href={siteContent.contact.github} target="_blank" rel="noreferrer">
            {siteContent.contact.github.replace("https://", "")}
          </a>
        </p>
        <p className="margin-note">
          <span className="margin-note-label">{pick(siteContent.identity.location, locale)}</span>
        </p>
      </aside>
    </section>
  );
}
