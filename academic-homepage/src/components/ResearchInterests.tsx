import type { CSSProperties } from "react";
import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface ResearchInterestsProps {
  locale: Locale;
}

/* staggered cord lengths so the bulbs hang at different heights */
const CORD_LENGTHS = [34, 62, 26, 52];

function Bulb({ glow }: { glow: number }) {
  return (
    <svg
      className="bulb"
      viewBox="0 0 64 100"
      aria-hidden="true"
      style={{ "--glow": glow } as CSSProperties}
    >
      {/* light rays, visible in proportion to the glow */}
      <g className="bulb-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="32" y1="2" x2="32" y2="10" />
        <line x1="8" y1="14" x2="14" y2="20" />
        <line x1="56" y1="14" x2="50" y2="20" />
        <line x1="2" y1="38" x2="10" y2="38" />
        <line x1="62" y1="38" x2="54" y2="38" />
      </g>
      {/* glass envelope */}
      <path
        className="bulb-glass"
        d="M32 12 C19 12 10 22 10 35 C10 44 14 50 19 56 C23 61 25 64 25 69 L39 69 C39 64 41 61 45 56 C50 50 54 44 54 35 C54 22 45 12 32 12 Z"
      />
      {/* filament */}
      <path
        className="bulb-filament"
        d="M24 52 L28 40 L32 50 L36 40 L40 52"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* screw base */}
      <rect className="bulb-base" x="25" y="69" width="14" height="5" rx="1.5" />
      <rect className="bulb-base" x="26.5" y="75.5" width="11" height="5" rx="1.5" />
      <path className="bulb-base" d="M29 82 L35 82 L32 88 Z" />
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
            <Bulb glow={interest.intensity} />
            <h3>{pick(interest.title, locale)}</h3>
            <p>{pick(interest.description, locale)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
