import { useEffect, useRef, useState } from "react";

/**
 * True while the element is on screen and the viewer has not asked for reduced
 * motion.
 *
 * Free-running instrument animations gate on this for two reasons: a scope that
 * has scrolled out of view should stop costing battery, and nothing should
 * autoplay for someone who opted out of motion. Starts false so the server
 * render and the first client paint agree, and so the exported HTML is a still
 * frame rather than a half-started animation.
 */
export function useVisible<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}
