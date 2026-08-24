import { useEffect, useRef, useState } from "react";

/**
 * Reports document reading progress (0..1) for the slim header progress bar.
 * Updates on scroll and resize via requestAnimationFrame-throttled listeners.
 */
export function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const update = () => {
      frame.current = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const next = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      setProgress(next);
    };

    const schedule = () => {
      if (!frame.current) frame.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return progress;
}
