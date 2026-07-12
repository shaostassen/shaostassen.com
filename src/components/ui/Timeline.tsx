import { cn } from "@/lib/cn";

export type TimelineEntry = {
  heading: string;
  subheading?: string;
  dates?: string;
  items?: string[];
};

/**
 * Accessible vertical timeline: a semantic ordered list with a rail and
 * markers — dates render as text, not only position, so screen readers get
 * the full story.
 */
export function Timeline({
  entries,
  className,
}: {
  entries: TimelineEntry[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-10 border-l border-border pl-6", className)}>
      {entries.map((e) => (
        <li key={e.heading + (e.dates ?? "")} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[1.85rem] top-1.5 h-2.5 w-2.5 rounded-full border border-accent bg-background"
          />
          {e.dates && <p className="font-mono text-xs text-muted">{e.dates}</p>}
          <h3 className="mt-1 font-display font-semibold">{e.heading}</h3>
          {e.subheading && (
            <p className="mt-0.5 text-sm text-muted">{e.subheading}</p>
          )}
          {e.items && e.items.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              {e.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
