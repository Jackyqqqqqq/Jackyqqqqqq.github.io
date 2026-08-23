import AboutSection from "./components/AboutSection";
import EducationSection from "./components/EducationSection";
import ProfileAside from "./components/ProfileAside";
import ProjectList from "./components/ProjectList";
import ResearchInterests from "./components/ResearchInterests";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import SkillsSection from "./components/SkillsSection";
import { siteContent } from "./content";
import { useActiveSection } from "./hooks/useActiveSection";
import { useLocale } from "./i18n";

const SECTION_IDS = siteContent.navigation.map(({ id }) => id);

export default function App() {
  const { locale, setLocale } = useLocale();
  const activeSection = useActiveSection(SECTION_IDS);

  return (
    <>
      <SiteHeader locale={locale} onLocaleChange={setLocale} activeSection={activeSection} />
      <main className="site-main" id="main-content">
        <div className="page-grid">
          <ProfileAside locale={locale} />
          <div className="page-content reveal reveal-delay">
            <AboutSection locale={locale} />
            <ResearchInterests locale={locale} />
            <ProjectList locale={locale} />
            <EducationSection locale={locale} />
            <SkillsSection locale={locale} />
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
