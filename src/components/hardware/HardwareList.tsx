import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { HardwareItem } from "@/content/schema";

export type HardwareListProps = {
  items: HardwareItem[];
};

export function HardwareList({ items }: HardwareListProps) {
  if (items.length === 0) {
    return <p className="mt-10 text-muted">No items in the list yet.</p>;
  }

  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2">
      {items.map((item, i) => (
        <li key={`${item.name}-${i}`}>
          <Card framed className="flex h-full flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-subtitle font-semibold">
                {item.name}
              </h2>
              {item.quantity > 1 && (
                <Tag className="shrink-0">×{item.quantity}</Tag>
              )}
            </div>
            {(item.category || item.location || item.status) && (
              <dl className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
                {item.category && (
                  <div>
                    <dt className="inline">category </dt>
                    <dd className="inline text-foreground">{item.category}</dd>
                  </div>
                )}
                {item.location && (
                  <div>
                    <dt className="inline">location </dt>
                    <dd className="inline text-foreground">{item.location}</dd>
                  </div>
                )}
                {item.status && (
                  <div>
                    <dt className="inline">status </dt>
                    <dd className="inline text-foreground">{item.status}</dd>
                  </div>
                )}
              </dl>
            )}
            {item.notes && (
              <p className="text-sm leading-relaxed text-muted">{item.notes}</p>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
