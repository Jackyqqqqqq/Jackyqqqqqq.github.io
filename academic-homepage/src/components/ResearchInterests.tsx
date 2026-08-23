import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface ResearchInterestsProps {
  locale: Locale;
}

export default function ResearchInterests({ locale }: ResearchInterestsProps) {
  return (
    <section className="content-section" id="research">
      <h2>{pick(siteContent.navigation[1].label, locale)}</h2>
      <ul className="research-list">
        {siteContent.research.map((interest) => (
          <li key={interest.title.en}>
            <h3>{pick(interest.title, locale)}</h3>
            <p>{pick(interest.description, locale)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
