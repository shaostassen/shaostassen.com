/** CRT overlay. Purely decorative, and the only decoration allowed. */
export function Scanlines() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded"
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0px, rgba(0,0,0,.16) 1px, transparent 1px, transparent 3px)",
      }}
    />
  );
}
