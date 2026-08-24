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
  emailEdu: LocalizedText;
  wechat: LocalizedText;
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
  ongoingTitle: LocalizedText;
  ongoingNote: LocalizedText;
  skillOwned: LocalizedText;
  skillLearning: LocalizedText;
  skillPlanned: LocalizedText;
}
export type SkillStatus = "owned" | "learning" | "planned";
export interface SkillNode {
  name: LocalizedText;
  status?: SkillStatus;
  children?: SkillNode[];
}

export interface SiteContent {
  identity: { name: LocalizedText; role: LocalizedText; location: LocalizedText };
  contact: { email: string; emailEdu: string; wechat: string; github: string };
  navigation: Array<{ id: string; label: LocalizedText }>;
  about: LocalizedText[];
  research: Array<{ title: LocalizedText; description: LocalizedText; intensity: number }>;
  projects: ProjectContent[];
  education: Array<{ institution: LocalizedText; school: LocalizedText; degree: LocalizedText; period: string; logo: string; logoAlt: LocalizedText; details: LocalizedText[] }>;
  skills: SkillNode;
  ui: SiteUiContent;
}
