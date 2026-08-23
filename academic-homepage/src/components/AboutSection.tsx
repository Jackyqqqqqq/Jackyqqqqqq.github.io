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
    </section>
  );
}
