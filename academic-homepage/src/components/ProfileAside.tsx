import { useState } from "react";
import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface ProfileAsideProps {
  locale: Locale;
}

export default function ProfileAside({ locale }: ProfileAsideProps) {
  const [portraitFailed, setPortraitFailed] = useState(false);
  const name = pick(siteContent.identity.name, locale);

  return (
    <aside className="profile-aside reveal">
      <div className="profile-portrait">
        {portraitFailed ? (
          <div className="portrait-fallback" role="img" aria-label={name}>
            QY
          </div>
        ) : (
          <img src="/profile.jpg" alt={name} onError={() => setPortraitFailed(true)} />
        )}
      </div>

      <div className="profile-identity">
        <h1>{name}</h1>
        <p>{pick(siteContent.identity.role, locale)}</p>
      </div>

      <address className="profile-contact">
        <span>{pick(siteContent.identity.location, locale)}</span>
        <a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a>
        <a href={`mailto:${siteContent.contact.emailEdu}`}>{siteContent.contact.emailEdu}</a>
        <a href={siteContent.contact.github} target="_blank" rel="noreferrer">
          {pick(siteContent.ui.github, locale)}
        </a>
      </address>
    </aside>
  );
}
