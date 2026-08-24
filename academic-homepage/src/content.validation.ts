import type { SiteContent } from "./content.types";

const REQUIRED_UI_KEYS: Array<keyof SiteContent["ui"]> = [
  "expand",
  "collapse",
  "method",
  "result",
  "repository",
  "email",
  "github",
  "menu",
  "skipToContent",
  "displaySettings",
  "appearance",
  "appearanceAuto",
  "appearanceBright",
  "appearanceSoft",
  "appearanceDark",
  "accentColor",
  "accentNavy",
  "accentForest",
  "accentBurgundy",
  "accentViolet",
  "fontSize",
  "resetDisplay",
  "ongoingTitle",
  "ongoingNote",
  "skillOwned",
  "skillLearning",
  "skillPlanned"
];

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateContent(content: SiteContent): string[] {
  const errors: string[] = [];
  const visit = (value: unknown, path: string) => {
    if (typeof value === "string" && !value.trim()) errors.push(`${path} is blank`);
    else if (Array.isArray(value)) value.forEach((item, i) => visit(item, `${path}[${i}]`));
    else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => visit(item, `${path}.${key}`));
  };
  visit(content, "content");
  for (const [label, values] of [["navigation", content.navigation.map(({ id }) => id)], ["projects", content.projects.map(({ id }) => id)]] as const) {
    if (new Set(values).size !== values.length) errors.push(`${label} IDs must be unique`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.contact.email)) errors.push("contact.email is invalid");
  if (!isHttpsUrl(content.contact.github)) errors.push("contact.github must use https");
  for (const project of content.projects) if (project.href && !isHttpsUrl(project.href)) errors.push(`projects.${project.id}.href must use https`);
  for (const key of REQUIRED_UI_KEYS) if (!content.ui[key]) errors.push(`content.ui.${key} is missing`);
  return errors;
}

export function assertValidContent(content: SiteContent): void {
  const errors = validateContent(content);
  if (errors.length) throw new Error(`Invalid site content:\n${errors.join("\n")}`);
}
