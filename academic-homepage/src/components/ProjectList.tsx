import { useEffect, useRef, useState } from "react";
import { siteContent } from "../content";
import type { Locale } from "../content.types";
import { pick } from "../i18n";
import ProjectItem, { type FanPose } from "./ProjectItem";

interface ProjectListProps {
  locale: Locale;
}

const FAN_POSES: FanPose[] = [
  { rot: "-11deg", x: "-28px" },
  { rot: "0deg", x: "0px" },
  { rot: "11deg", x: "28px" }
];

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
      <div className="project-fan" data-has-active={activeId ? "true" : undefined}>
        {siteContent.projects.map((project, index) => (
          <ProjectItem
            key={project.id}
            project={project}
            locale={locale}
            pose={FAN_POSES[index] ?? FAN_POSES[0]}
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
    </section>
  );
}
