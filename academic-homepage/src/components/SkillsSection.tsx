import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface SkillsSectionProps {
  locale: Locale;
}

export default function SkillsSection({ locale }: SkillsSectionProps) {
  return (
    <section className="content-section" id="skills">
      <h2>{pick(siteContent.navigation[4].label, locale)}</h2>
      <dl className="skills-list">
        {siteContent.skills.map((group) => (
          <div key={group.label.en}>
            <dt>{pick(group.label, locale)}</dt>
            <dd>{group.items.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
