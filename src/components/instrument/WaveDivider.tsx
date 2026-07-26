import { cn } from "@/lib/cn";

export type WaveDividerProps = {
  /** Which trace to draw: a damped step response, a sine, or a square. */
  variant?: "step" | "sine" | "square";
  className?: string;
};

// Traces are drawn on a 0..1200 x 0..48 viewBox, baseline at y=24.
const PATHS: Record<NonNullable<WaveDividerProps["variant"]>, string> = {
  // second-order step response: overshoot, then settle — a PID trace
  step: "M0 40 L360 40 C400 40 400 8 440 8 C470 8 470 34 500 34 C525 34 525 20 550 20 C572 20 572 26 596 26 L1200 26",
  sine: "M0 24 C50 4 100 4 150 24 S250 44 300 24 S400 4 450 24 S550 44 600 24 S700 4 750 24 S850 44 900 24 S1000 4 1050 24 S1150 44 1200 24",
  square:
    "M0 34 L120 34 L120 14 L240 14 L240 34 L360 34 L360 14 L480 14 L480 34 L600 34 L600 14 L720 14 L720 34 L840 34 L840 14 L960 14 L960 34 L1080 34 L1080 14 L1200 14",
};

/**
 * Decorative signal trace used as a section divider. Purely presentational:
 * hidden from assistive tech, and never the only thing separating content.
 */
export function WaveDivider({ variant = "step", className }: WaveDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none w-full select-none", className)}
    >
      <svg
        viewBox="0 0 1200 48"
        preserveAspectRatio="none"
        fill="none"
        className="h-8 w-full"
      >
        {/* baseline */}
        <line
          x1="0"
          y1="24"
          x2="1200"
          y2="24"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeDasharray="4 6"
          className="text-muted"
        />
        <path
          d={PATHS[variant]}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
          opacity="0.75"
        />
      </svg>
    </div>
  );
}
