export type Locale = "zh" | "en";
export type LocalizedText = Record<Locale, string>;
export interface ProjectContent { id: string; title: LocalizedText; period: string; tags: string[]; summary: LocalizedText; method: LocalizedText; result: LocalizedText; href?: string; }
export interface SiteUiContent {
  expand: LocalizedText;
  collapse: LocalizedText;
  method: LocalizedText;
  result: LocalizedText;
  repository: LocalizedText;
  email: LocalizedText;
  github: LocalizedText;
  menu: LocalizedText;
  skipToContent: LocalizedText;
  displaySettings: LocalizedText;
  appearance: LocalizedText;
  appearanceAuto: LocalizedText;
  appearanceBright: LocalizedText;
  appearanceSoft: LocalizedText;
  appearanceDark: LocalizedText;
  accentColor: LocalizedText;
  accentNavy: LocalizedText;
  accentForest: LocalizedText;
  accentBurgundy: LocalizedText;
  accentViolet: LocalizedText;
  fontSize: LocalizedText;
  resetDisplay: LocalizedText;
}
export interface SiteContent {
  identity: { name: LocalizedText; role: LocalizedText; location: LocalizedText };
  contact: { email: string; github: string };
  navigation: Array<{ id: string; label: LocalizedText }>;
  about: LocalizedText[];
  research: Array<{ title: LocalizedText; description: LocalizedText }>;
  projects: ProjectContent[];
  education: Array<{ institution: LocalizedText; school: LocalizedText; degree: LocalizedText; period: string; details: LocalizedText[] }>;
  skills: Array<{ label: LocalizedText; items: string[] }>;
  ui: SiteUiContent;
}
