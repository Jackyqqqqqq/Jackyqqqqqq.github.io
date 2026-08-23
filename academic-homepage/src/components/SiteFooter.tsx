import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface SiteFooterProps {
  locale: Locale;
}

export default function SiteFooter({ locale }: SiteFooterProps) {
  return (
    <footer className="site-footer" id="contact">
      <h2>{pick(siteContent.navigation[5].label, locale)}</h2>
      <address>
        <a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a>
        <a href={siteContent.contact.github} target="_blank" rel="noreferrer">
          {pick(siteContent.ui.github, locale)}
        </a>
        <span>{pick(siteContent.identity.location, locale)}</span>
      </address>
    </footer>
  );
}
