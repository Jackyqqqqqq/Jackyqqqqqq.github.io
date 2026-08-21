export type Locale = "zh" | "en";
export const locales: Locale[] = ["zh", "en"];

export type SocialLink = { label: string; href: string };
export type Stat = { value: string; label: string };
export type Education = {
  institution: string;
  school: string;
  degree: string;
  period: string;
  detailLabel: string;
  detail: string;
  /** 相对 public/ 的校徽或校园图，空串或缺失就不渲染。alt 走 institution。 */
  image?: string;
};
/** 流程节点：只写文字就用字符串，要配图就换成 { label, image }。两种写法可以混用。 */
export type FlowStep = string | { label: string; image?: string };
export type Project = {
  title: string;
  category: string;
  year: string;
  description: string;
  tags: string[];
  flow: FlowStep[];
  href: string;
  /** 相对 public/ 的图片路径，空串或缺失就不渲染图片区。alt 走 title。 */
  image?: string;
};

export type SectionCopy = {
  education: { label: string; title: string };
  projects: { label: string; title: string; intro: string };
  contact: { label: string; title: string; note: string };
};

/** 一种语言下的全部正文。语言无关的字段（邮箱、模型、配色）留在 SiteConfig 顶层。 */
export type LocaleCopy = {
  name: string;
  role: string;
  headline: string;
  intro: string;
  location: string;
  availability: string;
  about: { eyebrow: string; title: string; body: string };
  sections: SectionCopy;
  education: Education[];
  stats: Stat[];
  skills: string[];
  projects: Project[];
};

export type SiteConfig = {
  monogram: string;
  email: string;
  model: string;
  socials: SocialLink[];
  /** 图片都是相对 public/ 的路径；空串或缺失就整块不渲染，不留占位空洞。 */
  images?: {
    /** 关于我章节的肖像，竖构图最好 */
    about?: string;
    /** 联系章节的落款图，横构图最好 */
    contact?: string;
  };
  theme: {
    accent: string;
    accentAlt: string;
    paper: string;
    ink: string;
    night: string;
    /** 玻璃质感的站点默认值，缺省时走 styles.css 里的现值。访客的 frost 滑块是这些值的乘数。 */
    glass?: {
      /** 背景模糊基数，px */
      blur?: number;
      /** 边缘折射位移强度，对应 feDisplacementMap scale */
      refraction?: number;
      /** 描边色散浓度，0 关闭 */
      dispersion?: number;
      /** 指针高光强度 */
      sheen?: number;
    };
  };
  copy: Record<Locale, LocaleCopy>;
};

/** 界面文案（导航、按钮、无障碍标签）跟着代码走，不进 content.json。 */
export const ui = {
  zh: {
    lang: "zh-CN",
    pageTitle: "个人主页",
    chapters: { hero: "首页", about: "关于", education: "经历", projects: "项目", contact: "联系" },
    brandTagline: "Portfolio / 2026",
    backHome: "返回首页",
    mainNav: "主要导航",
    chapterNav: "章节导航",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    viewProjects: "查看研究项目",
    contactMe: "联系我",
    scrollDown: "向下滚动",
    localTime: "杭州本地时间",
    statsLabel: "个人概览",
    skillsLabel: "技能方向",
    flowHeading: "关键流程",
    projectLink: "查看项目主页",
    customizer: {
      open: "自定义页面",
      close: "关闭自定义面板",
      title: "页面外观",
      reset: "恢复默认",
      mode: "模式",
      modeGroup: "颜色模式",
      light: "浅色模式",
      dark: "深色模式",
      accent: "主色",
      frost: "玻璃质感",
      motion: "场景动效",
      language: "语言",
      languageGroup: "界面语言",
    },
  },
  en: {
    lang: "en",
    pageTitle: "Portfolio",
    chapters: { hero: "Home", about: "About", education: "Path", projects: "Work", contact: "Contact" },
    brandTagline: "Portfolio / 2026",
    backHome: "Back to top",
    mainNav: "Main navigation",
    chapterNav: "Chapter navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    viewProjects: "View research work",
    contactMe: "Get in touch",
    scrollDown: "Scroll down",
    localTime: "Local time in Hangzhou",
    statsLabel: "Profile overview",
    skillsLabel: "Focus areas",
    flowHeading: "Key steps",
    projectLink: "Open project page",
    customizer: {
      open: "Customise page",
      close: "Close customise panel",
      title: "Appearance",
      reset: "Reset to defaults",
      mode: "Mode",
      modeGroup: "Colour mode",
      light: "Light mode",
      dark: "Dark mode",
      accent: "Accent",
      frost: "Glass frost",
      motion: "Scene motion",
      language: "Language",
      languageGroup: "Interface language",
    },
  },
} satisfies Record<Locale, unknown>;

export type UiCopy = (typeof ui)[Locale];

export const localeNames: Record<Locale, string> = { zh: "中文", en: "English" };


export function assetUrl(path: string) {
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

export function detectLocale(): Locale {
  const preferred = typeof navigator === "undefined" ? "" : navigator.language;
  return preferred.toLowerCase().startsWith("zh") ? "zh" : "en";
}

