/**
 * Shared instrument furniture.
 *
 * Deliberately plain: inline styles off the palette in theme.ts, no CSS
 * framework, no animation. Every control is at least 44px because they are
 * touch targets on a page whose whole point is dragging one of them, and the
 * absence of animation is what makes `prefers-reduced-motion` a non-issue
 * rather than a media query to remember.
 */

import type { CSSProperties, ReactNode } from "react";
import { C } from "./theme";

export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export const Panel = ({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <section style={{ ...S.panel, ...style }}>
    {title && <h3 style={S.panelTitle}>{title}</h3>}
    {children}
  </section>
);

export const Row = ({ children }: { children: ReactNode }) => <div style={S.row}>{children}</div>;

/** Explanatory copy. Kept narrow — this is prose, not instrument panel. */
export const Prose = ({ children }: { children: ReactNode }) => <p style={S.prose}>{children}</p>;

/** A fact the level wants to state without burying it in a paragraph. */
export const Note = ({ children, bad }: { children: ReactNode; bad?: boolean }) => (
  <p style={{ ...S.note, color: bad ? C.BAD : C.dim }}>{children}</p>
);

export const Field = ({
  label,
  children,
  grow,
}: {
  label: string;
  children: ReactNode;
  grow?: boolean;
}) => (
  <label style={{ ...S.field, ...(grow ? { flex: 1, minWidth: 220 } : null) }}>
    <span style={S.fieldLabel}>{label}</span>
    {children}
  </label>
);

export const Select = <T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
}) => (
  <select
    value={String(value)}
    onChange={(e) => {
      const found = options.find((o) => String(o.value) === e.target.value);
      if (found) onChange(found.value);
    }}
    style={S.control}
  >
    {options.map((o) => (
      <option key={String(o.value)} value={String(o.value)}>
        {o.label}
      </option>
    ))}
  </select>
);

export const Slider = ({
  value,
  onChange,
  min,
  max,
  step,
  label,
  bad,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  /** Stable accessible name. The visible label carries a live value, and a name
   *  that changes on every drag is worse than a fixed name plus the value. */
  label: string;
  bad?: boolean;
}) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    aria-label={label}
    style={{ ...S.range, accentColor: bad ? C.BAD : C.WARN }}
  />
);

export const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => (
  <label style={S.toggle}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={S.checkbox}
    />
    <span>{label}</span>
  </label>
);

export const hex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");
export const printable = (n: number) => (n >= 0x20 && n < 0x7f ? String.fromCharCode(n) : "·");

export interface ByteView {
  value: number;
  errors: readonly string[];
  /** True when the byte arrived intact but is not what was sent. */
  wrong?: boolean;
  note?: string;
}

/**
 * The decoded row. Three states, and the middle one is the point: green is
 * correct, red is detected damage, and amber is a byte that arrived with every
 * flag clear and the wrong value in it.
 */
export const ByteGrid = ({ bytes, empty = "nothing arrived" }: { bytes: ByteView[]; empty?: string }) => (
  <div style={S.bytes}>
    {bytes.length === 0 && <span style={{ color: C.dim, fontSize: 12 }}>{empty}</span>}
    {bytes.map((b, i) => {
      const bad = b.errors.length > 0;
      const color = bad ? C.BAD : b.wrong ? C.WARN : C.HI;
      return (
        <div
          key={i}
          style={{ ...S.byte, borderColor: color, color }}
          title={b.note ?? (b.errors.length > 0 ? b.errors.join(", ") : b.wrong ? "wrong, undetected" : "clean")}
        >
          <div style={S.byteHex}>{hex(b.value)}</div>
          <div style={S.byteChar}>{printable(b.value)}</div>
          {bad && <div style={S.byteErr}>{b.errors[0]}</div>}
        </div>
      );
    })}
  </div>
);

/** A labelled readout. Numbers belong here rather than inside a sentence. */
export const Stat = ({ label, value, bad }: { label: string; value: string; bad?: boolean }) => (
  <div style={S.stat}>
    <div style={S.statLabel}>{label}</div>
    <div style={{ ...S.statValue, color: bad ? C.BAD : C.HI }}>{value}</div>
  </div>
);

export const Stats = ({ children }: { children: ReactNode }) => <div style={S.statRow}>{children}</div>;

export const S: Record<string, CSSProperties> = {
  panel: {
    background: C.panel,
    border: `1px solid ${C.rule}`,
    padding: 16,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 11,
    letterSpacing: 1,
    margin: "0 0 12px",
    color: C.CYA,
    fontWeight: 400,
    textTransform: "uppercase",
  },
  row: { display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 11, color: C.dim },
  control: {
    background: C.bg,
    color: C.text,
    border: `1px solid ${C.rule}`,
    padding: "0 10px",
    minHeight: 44,
    fontFamily: MONO,
    fontSize: 13,
  },
  range: { width: "100%", minHeight: 44 },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    fontSize: 12,
    color: C.text,
    cursor: "pointer",
  },
  checkbox: { width: 18, height: 18, accentColor: C.CYA },
  prose: { fontSize: 13, color: C.text, lineHeight: 1.6, margin: "0 0 12px", maxWidth: "68ch" },
  note: { fontSize: 11, margin: "8px 0 0", lineHeight: 1.6, maxWidth: "72ch" },
  bytes: { display: "flex", gap: 8, flexWrap: "wrap" },
  byte: { border: "1px solid", padding: "6px 8px", minWidth: 38, textAlign: "center" },
  byteHex: { fontSize: 13 },
  byteChar: { fontSize: 11, color: C.dim },
  byteErr: { fontSize: 9, marginTop: 2 },
  statRow: { display: "flex", gap: 24, flexWrap: "wrap", marginTop: 4 },
  stat: { minWidth: 90 },
  statLabel: { fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1 },
  statValue: { fontSize: 16, marginTop: 2 },
};
