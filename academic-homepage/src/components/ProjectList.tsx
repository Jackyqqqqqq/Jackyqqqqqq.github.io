import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";
import ProjectItem from "./ProjectItem";

interface ProjectListProps {
  locale: Locale;
}

export default function ProjectList({ locale }: ProjectListProps) {
  return (
    <section className="content-section" id="projects">
      <h2>{pick(siteContent.navigation[2].label, locale)}</h2>
      <div className="project-list">
        {siteContent.projects.map((project) => (
          <ProjectItem key={project.id} project={project} locale={locale} />
        ))}
      </div>
    </section>
  );
}
