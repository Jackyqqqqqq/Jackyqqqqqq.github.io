import { useLayoutEffect } from "react";

const REVEAL_SELECTOR = ".content-section";

/**
 * Adds a gentle entrance transition to each content section the first time
 * it scrolls into view. Sections stay fully visible when
 * IntersectionObserver is unavailable or the user prefers reduced motion.
 */
export function useSectionReveal() {
  useLayoutEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)
    );
    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );

    for (const section of sections) {
      section.classList.add("reveal-ready");
      observer.observe(section);
    }

    return () => {
      observer.disconnect();
      for (const section of sections) {
        section.classList.remove("reveal-ready", "is-revealed");
      }
    };
  }, []);
}
