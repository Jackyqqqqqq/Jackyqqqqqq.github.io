import { useEffect, useState } from "react";
import { siteContent } from "./content";
import type { Locale, LocalizedText } from "./content.types";

const STORAGE_KEY = "academic-homepage-locale";

export function pick(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

export function readStoredLocale(): Locale {
  try {
    const storedLocale = window.localStorage.getItem(STORAGE_KEY);
    return storedLocale === "en" || storedLocale === "zh" ? storedLocale : "zh";
  } catch {
    return "zh";
  }
}

function updateDocumentMetadata(locale: Locale) {
  document.documentElement.lang = locale;
  document.title = `${pick(siteContent.identity.name, locale)} | ${pick(siteContent.identity.role, locale)}`;

  let description = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!description) {
    description = document.createElement("meta");
    description.name = "description";
    document.head.append(description);
  }
  description.content = pick(siteContent.about[0], locale);
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    updateDocumentMetadata(locale);

    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The page stays usable when privacy settings deny browser storage.
    }
  }, [locale]);

  return { locale, setLocale };
}
