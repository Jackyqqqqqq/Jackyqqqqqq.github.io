import { useState } from "react";
import { siteContent } from "../content";
import type { Locale, ProjectContent } from "../content.types";
import { pick } from "../i18n";

interface ProjectItemProps {
  project: ProjectContent;
  locale: Locale;
}

export default function ProjectItem({ project, locale }: ProjectItemProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `project-${project.id}-details`;

  return (
    <article className="project-item">
      <div className="project-heading">
        <h3>{pick(project.title, locale)}</h3>
        <time>{project.period}</time>
      </div>

      <ul className="project-tags">
        {project.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      <p className="project-summary">{pick(project.summary, locale)}</p>

      <div className="project-actions">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((value) => !value)}
        >
          {pick(expanded ? siteContent.ui.collapse : siteContent.ui.expand, locale)}
        </button>
        {project.href ? (
          <a href={project.href} target="_blank" rel="noreferrer">
            {pick(siteContent.ui.repository, locale)}
          </a>
        ) : null}
      </div>

      {expanded ? (
        <dl className="project-details" id={detailsId}>
          <div>
            <dt>{pick(siteContent.ui.method, locale)}</dt>
            <dd>{pick(project.method, locale)}</dd>
          </div>
          <div>
            <dt>{pick(siteContent.ui.result, locale)}</dt>
            <dd>{pick(project.result, locale)}</dd>
          </div>
        </dl>
      ) : null}
    </article>
  );
}
