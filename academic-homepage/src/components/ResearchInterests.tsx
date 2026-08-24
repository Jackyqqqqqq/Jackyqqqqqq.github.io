import type { CSSProperties } from "react";
import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface ResearchInterestsProps {
  locale: Locale;
}

/* staggered cord lengths so the bulbs hang at different heights */
const CORD_LENGTHS = [34, 62, 26, 52];

function Bulb() {
  return (
    <svg className="bulb" viewBox="0 0 64 100" aria-hidden="true">
      {/* screw base at the top, where the cord attaches */}
      <path className="bulb-base" d="M29 6 L35 6 L32 0 Z" />
      <rect className="bulb-base" x="26.5" y="6" width="11" height="5" rx="1.5" />
      <rect className="bulb-base" x="25" y="12.5" width="14" height="5" rx="1.5" />
      {/* glass envelope, wide end at the bottom */}
      <path
        className="bulb-glass"
        d="M25 18.5 L39 18.5 C39 23 41 26 45 31 C50 37 54 43 54 52 C54 65 45 75 32 75 C19 75 10 65 10 52 C10 43 14 37 19 31 C23 26 25 23 25 18.5 Z"
      />
      {/* filament */}
      <path
        className="bulb-filament"
        d="M24 44 L28 56 L32 46 L36 56 L40 44"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* light rays around the wide bottom */}
      <g className="bulb-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="32" y1="84" x2="32" y2="92" />
        <line x1="8" y1="70" x2="14" y2="64" />
        <line x1="56" y1="70" x2="50" y2="64" />
        <line x1="2" y1="48" x2="10" y2="48" />
        <line x1="62" y1="48" x2="54" y2="48" />
      </g>
    </svg>
  );
}

export default function ResearchInterests({ locale }: ResearchInterestsProps) {
  return (
    <section className="content-section" id="research">
      <h2>{pick(siteContent.navigation[1].label, locale)}</h2>
      <ol className="bulb-string">
        {siteContent.research.map((interest, index) => (
          <li
            key={interest.title.en}
            className="bulb-item"
            style={{ "--glow": interest.intensity } as CSSProperties}
          >
            <span className="bulb-cord" aria-hidden="true" style={{ height: CORD_LENGTHS[index % CORD_LENGTHS.length] }} />
            <Bulb />
            <h3>{pick(interest.title, locale)}</h3>
            <p>{pick(interest.description, locale)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
