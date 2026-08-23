import { useEffect, useState } from "react";

export function useActiveSection(sectionIds: string[]): string {
  const sectionKey = sectionIds.join("\u0000");
  const firstSection = sectionIds[0] ?? "";
  const [activeSection, setActiveSection] = useState(firstSection);

  useEffect(() => {
    if (typeof window.IntersectionObserver !== "function") return undefined;

    const ids = sectionKey ? sectionKey.split("\u0000") : [];
    const visibility = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let nextSection = "";
        let highestRatio = 0;
        ids.forEach((id) => {
          const ratio = visibility.get(id) ?? 0;
          if (ratio > highestRatio) {
            nextSection = id;
            highestRatio = ratio;
          }
        });

        if (nextSection) {
          setActiveSection(nextSection);
        }
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0.01 }
    );

    ids.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [sectionKey]);

  return activeSection;
}
