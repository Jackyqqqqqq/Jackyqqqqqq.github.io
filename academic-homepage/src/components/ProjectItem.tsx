import type { CSSProperties, Ref } from "react";
import { siteContent } from "../content";
import type { Locale, ProjectContent } from "../content.types";
import { pick } from "../i18n";

export interface FanPose {
  rot: string;
  x: string;
}

interface ProjectItemProps {
  project: ProjectContent;
  locale: Locale;
  pose: FanPose;
  isActive: boolean;
  isDimmed: boolean;
  onOpen: () => void;
  onClose: () => void;
  closeRef: Ref<HTMLButtonElement>;
  coverRef: Ref<HTMLButtonElement>;
}

export default function ProjectItem({
  project,
  locale,
  pose,
  isActive,
  isDimmed,
  onOpen,
  onClose,
  closeRef,
  coverRef
}: ProjectItemProps) {
  const title = pick(project.title, locale);
  const panelId = `project-${project.id}-panel`;

  return (
    <article
      className={`fan-card${isActive ? " is-active" : ""}${isDimmed ? " is-dimmed" : ""}`}
      style={{ "--fan-rot": pose.rot, "--fan-x": pose.x } as CSSProperties}
    >
      {isActive ? (
        <div className="fan-card-open" id={panelId} role="group" aria-label={title}>
          <div className="fan-card-open-bar">
            <span className="fan-card-period">{project.period}</span>
            <button
              type="button"
              className="fan-card-close"
              ref={closeRef}
              aria-label={pick(siteContent.ui.collapse, locale)}
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <h3>{title}</h3>
          <p className="fan-card-tagline">{project.tags.join(" · ")}</p>
          <p className="fan-card-summary">{pick(project.summary, locale)}</p>
          <dl className="fan-card-details">
            <div>
              <dt>{pick(siteContent.ui.method, locale)}</dt>
              <dd>{pick(project.method, locale)}</dd>
            </div>
            <div>
              <dt>{pick(siteContent.ui.result, locale)}</dt>
              <dd>{pick(project.result, locale)}</dd>
            </div>
          </dl>
          {project.href ? (
            <a className="fan-card-repo" href={project.href} target="_blank" rel="noreferrer">
              {pick(siteContent.ui.repository, locale)} ↗
            </a>
          ) : null}
        </div>
      ) : (
        <h3 className="fan-card-heading">
          <button
            type="button"
            className="fan-card-cover"
            ref={coverRef}
            aria-controls={panelId}
            onClick={onOpen}
          >
            <span className="fan-card-period">{project.period}</span>
            <span className="fan-card-title">{title}</span>
            <span className="fan-card-tagline">{project.tags.join(" · ")}</span>
          </button>
        </h3>
      )}
    </article>
  );
}
