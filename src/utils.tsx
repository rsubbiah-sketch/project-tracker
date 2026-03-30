export const fmtD = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export const mention = (t: string) =>
  t.split(/(@\w+)/g).map((p, i) =>
    p.startsWith("@") ? <span key={i} style={{ color: 'var(--foreground)', fontWeight: 700 }}>{p}</span> : p
  );
