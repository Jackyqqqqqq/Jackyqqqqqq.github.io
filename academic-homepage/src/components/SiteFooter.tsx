import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";

interface SiteFooterProps {
  locale: Locale;
}

interface Channel {
  id: string;
  label: string;
  value: string;
  href?: string;
  icon: ReactNode;
}

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true
};

function MailIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function EduMailIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
      <path d="M22 9v5" />
    </svg>
  );
}

function WeChatIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M9.5 4C5.9 4 3 6.5 3 9.6c0 1.8 1 3.4 2.5 4.4L5 16l2.2-1.2c.7.2 1.5.4 2.3.4h.4" />
      <path d="M21 14.2c0-2.8-2.5-5-5.6-5s-5.6 2.2-5.6 5 2.5 5 5.6 5c.6 0 1.3-.1 1.9-.3L19.5 20l-.5-1.7c1.2-.8 2-1.9 2-3.1v-1Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 3a9 9 0 0 0-2.8 17.6c.4.1.6-.2.6-.4v-1.5c-2.4.5-2.9-1-2.9-1-.4-1-1-1.3-1-1.3-.8-.6.1-.5.1-.5.9.1 1.3.9 1.3.9.8 1.3 2 .9 2.5.7.1-.6.3-1 .6-1.2-1.9-.3-3.9-1-3.9-4.4 0-1 .4-1.8.9-2.4-.1-.3-.4-1.2.1-2.4 0 0 .7-.3 2.4.9a8.6 8.6 0 0 1 4.4 0c1.7-1.2 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.4.6.6.9 1.4.9 2.4 0 3.4-2 4.1-3.9 4.4.3.3.6.9.6 1.8v2.6c0 .2.2.5.6.4A9 9 0 0 0 12 3Z" />
    </svg>
  );
}

export default function SiteFooter({ locale }: SiteFooterProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);

  const channels: Channel[] = [
    {
      id: "email",
      label: pick(siteContent.ui.email, locale),
      value: siteContent.contact.email,
      href: `mailto:${siteContent.contact.email}`,
      icon: <MailIcon />
    },
    {
      id: "emailEdu",
      label: pick(siteContent.ui.emailEdu, locale),
      value: siteContent.contact.emailEdu,
      href: `mailto:${siteContent.contact.emailEdu}`,
      icon: <EduMailIcon />
    },
    {
      id: "wechat",
      label: pick(siteContent.ui.wechat, locale),
      value: siteContent.contact.wechat,
      icon: <WeChatIcon />
    },
    {
      id: "github",
      label: "GitHub",
      value: siteContent.contact.github.replace("https://github.com/", "@"),
      href: siteContent.contact.github,
      icon: <GitHubIcon />
    }
  ];

  useEffect(() => {
    if (openId === null) return;
    const handlePointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenId(null);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [openId]);

  const copyValue = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600);
    } catch {
      // clipboard unavailable — value stays visible for manual copy
    }
  };

  return (
    <footer className="site-footer" id="contact" ref={rootRef}>
      <h2>{pick(siteContent.navigation[5].label, locale)}</h2>
      <address className="contact-channels">
        {channels.map((channel) => {
          const isOpen = openId === channel.id;
          const panelId = `contact-${channel.id}-panel`;
          const label = channel.label;
          return (
            <div className="contact-channel" key={channel.id} data-open={isOpen ? "true" : undefined}>
              <button
                type="button"
                className="contact-icon"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-label={label}
                title={label}
                onClick={() => setOpenId(isOpen ? null : channel.id)}
              >
                {channel.icon}
              </button>
              <div className="contact-popover" id={panelId} hidden={!isOpen} role="group" aria-label={label}>
                <span className="contact-popover-label">{label}</span>
                {channel.href ? (
                  <a
                    href={channel.href}
                    {...(channel.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {channel.value}
                  </a>
                ) : (
                  <button type="button" className="contact-copy" onClick={() => copyValue(channel.id, channel.value)}>
                    {channel.value}
                  </button>
                )}
                {channel.href ? null : (
                  <span className="contact-popover-hint" aria-live="polite">
                    {copiedId === channel.id
                      ? locale === "zh" ? "已复制" : "Copied"
                      : locale === "zh" ? "点击复制" : "Click to copy"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </address>
      <p className="contact-location">{pick(siteContent.identity.location, locale)}</p>
    </footer>
  );
}
