import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Github,
  Linkedin,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Customizer } from "./components/Customizer";
import { PortraitScene, type SceneStage } from "./components/PortraitScene";
import content from "./content.json";
import {
  assetUrl,
  detectLocale,
  ui,
  type Locale,
  type Project,
  type SiteConfig,
  type UiCopy,
} from "./config";
import { useChapterFlow, useClock, useMagnetic, useMediaQuery, usePointerSheen, useScrollProgress } from "./hooks";

type Preferences = { dark: boolean; motion: boolean; accent?: string; frost?: number; locale?: Locale };

// 顺序与 PortraitScene 的姿态路径一一对应，改这里必须同步改那边。
const chapters: Array<{ id: SceneStage; number: string }> = [
  { id: "hero", number: "00" },
  { id: "about", number: "01" },
  { id: "education", number: "02" },
  { id: "projects", number: "03" },
  { id: "contact", number: "04" },
];
const chapterIds = chapters.map((chapter) => (chapter.id === "hero" ? "top" : chapter.id));

const socialIcons: Record<string, typeof Github> = {
  github: Github,
  linkedin: Linkedin,
  email: Mail,
};

function readPreferences(): Preferences {
  const defaults: Preferences = {
    dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    motion: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    locale: detectLocale(),
  };
  try {
    const stored = localStorage.getItem("homepage-preferences");
    if (!stored) return defaults;
    const parsed = JSON.parse(stored) as Preferences;
    return {
      ...defaults,
      ...parsed,
      // 旧版本存的偏好没有 locale，且要防住手改 localStorage 塞进未知值。
      locale: parsed.locale === "zh" || parsed.locale === "en" ? parsed.locale : defaults.locale,
      frost: typeof parsed.frost === "number" ? Math.min(2, Math.max(0, parsed.frost)) : undefined,
    };
  } catch {
    return defaults;
  }
}

function SectionKicker({ number, children, light = false }: { number: string; children: string; light?: boolean }) {
  return (
    <div className={`section-kicker ${light ? "is-light" : "glass glass-thin"}`}>
      <span>{number}</span>
      <i aria-hidden="true" />
      <strong>{children}</strong>
    </div>
  );
}

// 首屏姓名逐字入场：按词切分保证换行只在词间发生，字索引跨词累计做级联延迟。
// h1 自带 aria-label，拆开的字符对读屏器隐藏。
function HeroName({ name }: { name: string }) {
  let charIndex = 0;
  return (
    <h1 aria-label={name}>
      {name.split(" ").map((word, wordIndex, words) => (
        <Fragment key={`${word}-${wordIndex}`}>
          <span className="word" aria-hidden="true">
            {Array.from(word).map((char) => {
              const index = charIndex++;
              return (
                <span key={index} className="char" style={{ "--char-i": index } as React.CSSProperties}>
                  {char}
                </span>
              );
            })}
          </span>
          {wordIndex < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h1>
  );
}

// 内容图模糊渐显：占位时 blur + 透明，onLoad 后沉到清晰。装饰性的流程节点小图不走这里。
function FadeImg({ className, onLoad, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      {...rest}
      className={`fade-img${className ? ` ${className}` : ""}${loaded ? " is-loaded" : ""}`}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}

function ProjectFlow({ project, copy }: { project: Project; copy: UiCopy }) {
  return (
    <div className="project-flow" aria-label={`${project.title} — ${copy.flowHeading}`}>
      <div className="flow-heading">{copy.flowHeading}</div>
      <ol>
        {project.flow.map((step, index) => {
          const { label, image } = typeof step === "string" ? { label: step, image: "" } : step;
          return (
            <li key={`${project.title}-${label}`} className={image ? "has-shot" : undefined}>
              {image && (
                <img className="flow-shot" src={assetUrl(image)} alt="" loading="lazy" decoding="async" />
              )}
              <span className="flow-index">{String(index + 1).padStart(2, "0")}</span>
              <strong>{label}</strong>
              {index < project.flow.length - 1 && <ArrowRight aria-hidden="true" size={18} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function App() {
  // 直接用导入值，不进 state：内容是构建期常量，塞进 useState 反而会让 dev 下的
  // HMR 更新（就地编辑写回 content.json）停在旧快照上。
  const config = content as SiteConfig;
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);
  const [modelLoaded, setModelLoaded] = useState(false);
  const compact = useMediaQuery("(max-width: 760px)");
  const narrow = useMediaQuery("(max-width: 1180px)");
  const locale: Locale = preferences.locale ?? "zh";
  const t = ui[locale];
  const copy = config.copy[locale];
  const { flow, index: activeIndex } = useChapterFlow(chapterIds, preferences.motion);
  const activeSection = chapters[activeIndex].id;
  usePointerSheen(preferences.motion);
  useMagnetic(preferences.motion);
  useScrollProgress();
  const localTime = useClock(t.lang);
  const onModelLoaded = useCallback(() => setModelLoaded(true), []);
  useEffect(() => {
    const timer = window.setTimeout(() => setModelLoaded(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);
  const navRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [switching, setSwitching] = useState(false);
  const switchTimer = useRef(0);
  // 依赖 activeSection 而不是 navIndex：滑块只关心哪一章高亮。
  const activeNavId = activeSection === "hero" ? null : activeSection;

  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    document.title = `${copy.name} | ${t.pageTitle}`;
    document.documentElement.lang = t.lang;
  }, [copy.name, t]);

  useEffect(() => {
    localStorage.setItem("homepage-preferences", JSON.stringify(preferences));
  }, [preferences]);

  // 量出 active 链接的真实位置和宽度喂给滑块。字体加载、语言切换、窗口缩放都会改变
  // 标签宽度，所以挂 ResizeObserver 而不是只在 activeSection 变化时算一次。
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const active = nav.querySelector<HTMLElement>("a.is-active");
      if (!active) return;
      nav.style.setProperty("--nav-x", `${active.offsetLeft}px`);
      nav.style.setProperty("--nav-w", `${active.offsetWidth}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activeNavId, locale]);

  const accent = preferences.accent ?? config.theme.accent;
  const frost = preferences.frost ?? 1;
  const navChapters = chapters.slice(1);
  const navIndex = navChapters.findIndex((chapter) => chapter.id === activeSection);
  const rootStyle = useMemo(
    () =>
      ({
        "--accent": accent,
        "--accent-2": config.theme.accentAlt,
        "--paper": config.theme.paper,
        "--ink": config.theme.ink,
        "--night": config.theme.night,
        "--frost": frost,
        // 色散强度由站点配置驱动，缺省 1；管理页改 theme.glass.dispersion 即时生效。
        "--dispersion": config.theme.glass?.dispersion ?? 1,
      }) as React.CSSProperties,
    [accent, frost, config],
  );

  const updatePreferences = (patch: Partial<Preferences>) =>
    setPreferences((current) => ({ ...current, ...patch }));

  // 切语言时内容区先淡出再淡入，文字不在眼皮底下硬切。关动效时直接切。
  const changeLocale = (next: Locale) => {
    if (next === locale) return;
    if (!preferences.motion) {
      updatePreferences({ locale: next });
      return;
    }
    window.clearTimeout(switchTimer.current);
    setSwitching(true);
    switchTimer.current = window.setTimeout(() => {
      updatePreferences({ locale: next });
      setSwitching(false);
    }, 190);
  };
  useEffect(() => () => window.clearTimeout(switchTimer.current), []);

  // 移动端菜单：Esc 或点到顶栏外收起。
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  const goToChapter = () => setMenuOpen(false);

  return (
    <div
      className={`site${switching ? " is-switching" : ""}`}
      data-theme={preferences.dark ? "dark" : "light"}
      data-stage={activeSection}
      data-locale={locale}
      data-motion={preferences.motion}
      style={rootStyle}
    >
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      <div className="grain" aria-hidden="true" />
      <div className="cine-bars" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true" />

      <div className={`portrait-stage stage-${activeSection} ${modelLoaded ? "is-loaded" : ""}`} aria-hidden="true">
        <PortraitScene
          model={config.model}
          accent={accent}
          accentAlt={config.theme.accentAlt}
          dark={preferences.dark}
          motion={preferences.motion}
          compact={compact}
          narrow={narrow}
          flow={flow}
          onLoaded={onModelLoaded}
        />
      </div>
      <div className={`stage-loader ${modelLoaded ? "is-done" : ""}`} aria-hidden="true" />

      <header ref={headerRef} className="site-header glass glass-thin">
        <a className="brand" href="#top" aria-label={t.backHome}>
          <span className="brand-mark">{config.monogram}</span>
          <span className="brand-copy"><strong>{copy.name}</strong><small>{t.brandTagline}</small></span>
        </a>

        <nav
          ref={navRef}
          className={`nav ${menuOpen ? "is-open" : ""}`}
          aria-label={t.mainNav}
          style={{ "--nav-on": navIndex >= 0 ? 1 : 0 } as React.CSSProperties}
        >
          <span className="nav-slider" aria-hidden="true" />
          {navChapters.map((chapter) => (
            <a
              key={chapter.id}
              className={activeSection === chapter.id ? "is-active" : ""}
              href={`#${chapter.id}`}
              aria-current={activeSection === chapter.id ? "true" : undefined}
              onClick={goToChapter}
            >
              {t.chapters[chapter.id]}
            </a>
          ))}
        </nav>

        <button
          className="icon-button menu-button"
          type="button"
          title={menuOpen ? t.closeMenu : t.openMenu}
          aria-label={menuOpen ? t.closeMenu : t.openMenu}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <aside className="chapter-rail glass glass-thin" aria-label={t.chapterNav}>
        {chapters.map((chapter) => (
          <a
            key={chapter.id}
            className={activeSection === chapter.id ? "is-active" : ""}
            href={chapter.id === "hero" ? "#top" : `#${chapter.id}`}
            aria-label={t.chapters[chapter.id]}
          >
            <em aria-hidden="true">{t.chapters[chapter.id]}</em>
            <span>{chapter.number}</span><i />
          </a>
        ))}
      </aside>

      <main>
        <section id="top" className={`hero ${ready ? "is-ready" : ""}`}>
          <div className="hero-content">
            <p className="hero-kicker glass glass-thin"><span />{copy.role}</p>
            <HeroName name={copy.name} />
            <h2>{copy.headline}</h2>
            <p className="hero-intro">{copy.intro}</p>
            <div className="hero-actions">
              <a className="button primary" href="#projects" data-magnetic>{t.viewProjects} <ArrowDown size={18} /></a>
              <a className="button text-button glass" href={`mailto:${config.email}`} data-magnetic>{t.contactMe} <ArrowUpRight size={18} /></a>
            </div>
          </div>

          <div className="hero-meta glass glass-thin">
            <span>{copy.location}</span>
            <span className="meta-clock" aria-label={t.localTime}><Clock3 size={12} aria-hidden="true" />{localTime}</span>
            <span className="status">{copy.availability}</span>
          </div>

          <a className="scroll-hint glass" href="#about" aria-label={t.scrollDown} data-magnetic>
            <ChevronDown size={18} aria-hidden="true" />
          </a>
        </section>

        <section id="about" className="story-section about-section">
          <div className="section-shell glass glass-panel align-left" data-shot>
            <SectionKicker number="01">{copy.about.eyebrow}</SectionKicker>
            <h2>{copy.about.title}</h2>

            <div className="about-body">
              <p className="section-lead">{copy.about.body}</p>
              {config.images?.about && (
                <figure className="section-figure">
                  <FadeImg src={assetUrl(config.images.about)} alt={copy.about.title} loading="lazy" decoding="async" />
                </figure>
              )}
            </div>

            <div className="stats" aria-label={t.statsLabel}>
              {copy.stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="skills-list" aria-label={t.skillsLabel}>
              {copy.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          </div>

        </section>

        <section id="education" className="story-section education-section">
          <div className="section-shell glass glass-panel align-right" data-shot>
            <SectionKicker number="02">{copy.sections.education.label}</SectionKicker>
            <h2>{copy.sections.education.title}</h2>

            <div className="education-list">
              {copy.education.map((education, index) => (
                <article className="education-record" key={`${education.institution}-${education.period}`}>
                  <div className="education-marker"><span>{String(index + 1).padStart(2, "0")}</span></div>
                  {education.image && (
                    <div className="education-shot">
                      <FadeImg src={assetUrl(education.image)} alt={education.institution} loading="lazy" decoding="async" />
                    </div>
                  )}
                  <div className="education-main">
                    <div className="education-topline">
                      <span>{education.period}</span>
                      <span>{education.detailLabel}</span>
                    </div>
                    <h3>{education.institution}</h3>
                    <p>{education.school} · {education.degree}</p>
                    <strong>{education.detail}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="story-section projects-section">
          <div className="projects-intro section-shell glass glass-panel align-left" data-shot>
            <SectionKicker number="03">{copy.sections.projects.label}</SectionKicker>
            <h2>{copy.sections.projects.title}</h2>
            <p className="section-lead">{copy.sections.projects.intro}</p>
          </div>

          <div className="project-showcase">
            {copy.projects.map((project, index) => (
              <article className="project-case glass glass-panel" key={project.title} data-shot>
                {project.image && (
                  <div className="project-shot">
                    <FadeImg src={assetUrl(project.image)} alt={project.title} loading="lazy" decoding="async" />
                  </div>
                )}
                <div className="project-copy">
                  <div className="project-topline">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{project.year}</span>
                  </div>
                  <span className="project-category">{project.category}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-tags">
                    {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <a className="project-link" href={project.href} target="_blank" rel="noreferrer">
                    {t.projectLink} <ArrowUpRight size={18} />
                  </a>
                </div>
                <ProjectFlow project={project} copy={t} />
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="story-section contact-section">
          <div className="contact-panel" data-shot>
            <SectionKicker number="04" light>{copy.sections.contact.label}</SectionKicker>
            <h2>{copy.sections.contact.title}</h2>
            <p>{copy.sections.contact.note}</p>
            {config.images?.contact && (
              <figure className="contact-figure">
                <FadeImg src={assetUrl(config.images.contact)} alt={copy.sections.contact.title} loading="lazy" decoding="async" />
              </figure>
            )}
            <a className="contact-link" href={`mailto:${config.email}`} data-magnetic>
              <span>{config.email}</span><ArrowUpRight size={24} />
            </a>
            <div className="contact-footer">
              <span>© {new Date().getFullYear()} {copy.name}</span>
              <div className="social-links">
                {config.socials.map((social) => {
                  const Icon = socialIcons[social.label.toLowerCase()] ?? ArrowUpRight;
                  return (
                    <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label} data-magnetic>
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Customizer
        dark={preferences.dark}
        motion={preferences.motion}
        accent={accent}
        frost={frost}
        locale={locale}
        copy={t.customizer}
        onDarkChange={(dark) => updatePreferences({ dark })}
        onMotionChange={(motion) => updatePreferences({ motion })}
        onAccentChange={(nextAccent) => updatePreferences({ accent: nextAccent })}
        onFrostChange={(nextFrost) => updatePreferences({ frost: nextFrost })}
        onLocaleChange={changeLocale}
        // 语言是内容选择而不是外观，恢复默认时保留用户已选的语言。
        onReset={() => setPreferences({ dark: false, motion: true, accent: config.theme.accent, frost: 1, locale })}
      />
    </div>
  );
}
