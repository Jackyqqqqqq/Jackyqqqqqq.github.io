import { useEffect, useRef, useState } from "react";
import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";
import ProjectItem, { type FanPose } from "./ProjectItem";

interface ProjectListProps {
  locale: Locale;
}

/*
 * Fan poses are computed from the project count, so new projects added in
 * content.ts automatically join the fan without touching this file.
 */
function computeFanPose(index: number, total: number): FanPose {
  if (total <= 1) return { rot: "0deg", x: "0px" };
  const step = Math.min(11, 44 / (total - 1));
  const rot = (index - (total - 1) / 2) * step;
  const x = Math.sin((rot * Math.PI) / 180) * 150;
  return { rot: `${rot.toFixed(2)}deg`, x: `${x.toFixed(1)}px` };
}

function OngoingCard({ locale }: { locale: Locale }) {
  return (
    <aside className="ongoing-card">
      <h3>{pick(siteContent.ui.ongoingTitle, locale)}</h3>
      <div className="ongoing-paper" aria-hidden="true">
        <svg viewBox="0 0 240 120">
          {/* lines already written */}
          <path className="ink-line is-done" d="M24 26 C60 18 100 32 140 24 S 200 18 218 26" />
          <path className="ink-line is-done" d="M24 48 C70 40 110 54 150 46 S 205 40 218 48" />
          {/* the line currently being drawn */}
          <path
            className="ink-line is-drawing"
            pathLength={100}
            d="M24 76 C55 62 85 88 120 74 S 180 60 218 78"
          />
          {/* the pen riding the same path */}
          <g className="pen">
            <g transform="rotate(45)">
              <rect className="pen-body" x="-3" y="-22" width="6" height="16" rx="1.5" />
              <path className="pen-tip" d="M-3 -6 L3 -6 L0 2 Z" />
              <rect className="pen-eraser" x="-3" y="-26" width="6" height="4" rx="1.5" />
            </g>
          </g>
        </svg>
      </div>
      <p>{pick(siteContent.ui.ongoingNote, locale)}</p>
    </aside>
  );
}

export default function ProjectList({ locale }: ProjectListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const coverRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const restoreRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeId) {
      restoreRef.current = activeId;
      closeRef.current?.focus();
    } else if (restoreRef.current) {
      coverRefs.current[restoreRef.current]?.focus();
      restoreRef.current = null;
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveId(null);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [activeId]);

  return (
    <section className="content-section" id="projects">
      <h2>{pick(siteContent.navigation[2].label, locale)}</h2>
      <div className="projects-layout">
        <div className="project-fan" data-has-active={activeId ? "true" : undefined}>
          {siteContent.projects.map((project, index) => (
            <ProjectItem
              key={project.id}
              project={project}
              locale={locale}
              pose={computeFanPose(index, siteContent.projects.length)}
              isActive={activeId === project.id}
              isDimmed={activeId !== null && activeId !== project.id}
              onOpen={() => setActiveId(project.id)}
              onClose={() => setActiveId(null)}
              closeRef={closeRef}
              coverRef={(element) => {
                coverRefs.current[project.id] = element;
              }}
            />
          ))}
          {activeId ? (
            <div className="fan-backdrop" aria-hidden="true" onClick={() => setActiveId(null)} />
          ) : null}
        </div>
        <OngoingCard locale={locale} />
      </div>
    </section>
  );
}
