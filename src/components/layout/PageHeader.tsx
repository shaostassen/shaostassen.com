import { Annotation } from "@/components/instrument/Annotation";

export type PageHeaderProps = {
  /** Mono tick-rule label above the title — the standard page eyebrow. */
  annotation?: string;
  /** Plain mono meta line instead: case studies use org · timeframe · role. */
  meta?: React.ReactNode;
  title: React.ReactNode;
  /** One sentence under the title. */
  lede?: React.ReactNode;
  /** Anything below the lede — metrics, tags, repo links. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * The top of a page: eyebrow, h1, lede.
 *
 * Extracted because five routes had a byte-identical header and three more
 * each drifted from it — a different lede width here, a missing `text-lg`
 * there. The spacing lives on the eyebrow rather than the h1 so the title
 * never needs a conditional margin depending on what precedes it.
 */
export function PageHeader({
  annotation,
  meta,
  title,
  lede,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={className}>
      {annotation && <Annotation className="mb-5">{annotation}</Annotation>}
      {meta && <p className="mb-3 font-mono text-sm text-muted">{meta}</p>}
      <h1 className="font-display text-display">{title}</h1>
      {lede && <p className="mt-4 max-w-2xl text-lg text-muted">{lede}</p>}
      {children}
    </header>
  );
}
