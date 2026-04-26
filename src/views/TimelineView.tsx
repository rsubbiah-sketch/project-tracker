import { useState } from "react";
import { motion } from "framer-motion";
import { Icon as I } from "../components/Icons";
import { u, g } from "../tokens";
import { useIsMobile } from "../hooks/useIsMobile";
import { Cd } from "../components/ui";
import type { Program, MilestoneCategory } from "../types";

type TrackKey = MilestoneCategory;

const TRACK_META: Record<TrackKey, { label: string }> = {
  product:   { label: "Product" },
  execution: { label: "Execution" },
  ttm:       { label: "Time-to-Market" },
};
const TRACK_ORDER: TrackKey[] = ["product", "execution", "ttm"];

function parseDate(d: string) { return new Date(d + "T00:00:00").getTime(); }
function fmtShort(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TODAY = new Date();
const NOW = TODAY.getTime();

export default function TimelineView({ p, prg }: { p?: Program; prg?: Program[] }) {
  const mob = useIsMobile();
  const program = p ?? prg?.[0];
  const [zoom, setZoom] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState<TrackKey | null>(null);

  const allMilestones = (program?.milestones || []).map(m => ({
    ...m,
    track: (m.category ?? "execution") as TrackKey,
  }));

  if (!allMilestones.length) {
    return (
      <Cd delay={0} hover={false} className="p-8 text-center">
        <I name="calendar" size={32} color="var(--muted-foreground)" />
        <div className="text-sm text-muted-foreground mt-3">No milestones defined yet</div>
        <div className="text-xs text-muted-foreground mt-1">Add milestones in the Overview tab to see them on the timeline</div>
      </Cd>
    );
  }

  const allDates = allMilestones.map(m => parseDate(m.date));
  const PAD = 30 * 86400000;
  const timeStart = Math.min(...allDates) - PAD;
  const timeEnd = Math.max(...allDates) + PAD;
  const timeSpan = timeEnd - timeStart;

  const months: { label: string; frac: number }[] = [];
  const cursor = new Date(timeStart);
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + 1);
  while (cursor.getTime() < timeEnd) {
    months.push({ label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), frac: (cursor.getTime() - timeStart) / timeSpan });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const presentTracks = TRACK_ORDER.filter(t => allMilestones.some(m => m.track === t));
  const visibleTracks = selectedTrack ? [selectedTrack] : presentTracks;

  const PAD_LEFT = 100;
  const PAD_RIGHT = 60;
  const days = timeSpan / 86400000;
  const PX_PER_DAY = (mob ? 5 : 7) * zoom;
  const W = Math.max(800, days * PX_PER_DAY) + PAD_LEFT + PAD_RIGHT;
  const TRACK_H = 100;
  const HEADER_H = 24;
  const totalH = HEADER_H + visibleTracks.length * TRACK_H;

  const toX = (date: string) => PAD_LEFT + ((parseDate(date) - timeStart) / timeSpan) * (W - PAD_LEFT - PAD_RIGHT);
  const todayX = PAD_LEFT + ((NOW - timeStart) / timeSpan) * (W - PAD_LEFT - PAD_RIGHT);

  const risks = (program?.issues || []).filter(i => !i.res).slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header — matches Dashboard style */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{program?.name ?? "Program"} — NPI Timeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Milestones grouped by dimension. Scroll to pan, zoom to adjust scale.</p>
      </div>

      {/* Controls: track filters + zoom */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setSelectedTrack(null)}
            className="px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors border"
            style={{
              background: !selectedTrack ? "var(--foreground)" : "transparent",
              color: !selectedTrack ? "var(--background)" : "var(--muted-foreground)",
              borderColor: !selectedTrack ? "var(--foreground)" : "var(--border)",
            }}>
            All Tracks
          </button>
          {presentTracks.map(k => {
            const active = selectedTrack === k;
            return (
              <button key={k} onClick={() => setSelectedTrack(active ? null : k)}
                className="px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors border"
                style={{
                  background: active ? "var(--foreground)" : "transparent",
                  color: active ? "var(--background)" : "var(--muted-foreground)",
                  borderColor: active ? "var(--foreground)" : "var(--border)",
                }}>
                {TRACK_META[k].label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-7 h-7 rounded-md bg-transparent text-foreground border border-border cursor-pointer flex items-center justify-center text-sm font-medium hover:bg-muted/50 transition-colors">−</button>
          <span className="text-xs font-medium text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-7 h-7 rounded-md bg-transparent text-foreground border border-border cursor-pointer flex items-center justify-center text-sm font-medium hover:bg-muted/50 transition-colors">+</button>
        </div>
      </div>

      {/* Timeline */}
      <Cd delay={0.1} hover={false} className="p-0 mb-6">
        <div className="rounded-md border border-border overflow-hidden">
          <div style={{ overflowX: "scroll", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}>
            <svg width={W} height={totalH} style={{ display: "block" }}>
              {/* Month grid */}
              {months.map((m, i) => {
                const mx = PAD_LEFT + m.frac * (W - PAD_LEFT - PAD_RIGHT);
                return (
                  <g key={i}>
                    <line x1={mx} y1={0} x2={mx} y2={totalH} stroke="var(--border)" strokeWidth={1} opacity={0.3} />
                    <text x={mx + 4} y={14} fill="var(--muted-foreground)" fontSize={10} opacity={0.6}>{m.label}</text>
                  </g>
                );
              })}

              {/* Today disc */}
              {visibleTracks.map((_, ti) => {
                const mid = HEADER_H + ti * TRACK_H + TRACK_H / 2;
                return (
                  <g key={`today-${ti}`}>
                    <circle cx={todayX} cy={mid} r={10} fill="var(--foreground)" opacity={0.06} />
                    <circle cx={todayX} cy={mid} r={5} fill="var(--foreground)" opacity={0.35} />
                  </g>
                );
              })}
              <text x={todayX} y={12} textAnchor="middle" fill="var(--muted-foreground)" fontSize={9} fontWeight={600}>TODAY</text>

              {/* Track rows */}
              {visibleTracks.map((track, ti) => {
                const yBase = HEADER_H + ti * TRACK_H;
                const mid = yBase + TRACK_H / 2;
                const trackMs = allMilestones.filter(m => m.track === track);
                const sorted = [...trackMs].sort((a, b) => parseDate(a.date) - parseDate(b.date));

                return (
                  <g key={track}>
                    {/* Track background — alternating subtle stripe */}
                    {ti % 2 === 1 && <rect x={0} y={yBase} width={W} height={TRACK_H} fill="var(--muted)" opacity={0.3} />}
                    <line x1={0} y1={yBase + TRACK_H} x2={W} y2={yBase + TRACK_H} stroke="var(--border)" strokeWidth={1} opacity={0.25} />

                    {/* Track label */}
                    <text x={12} y={yBase + 16} fill="var(--muted-foreground)" fontSize={10} fontWeight={600} letterSpacing={1}>{TRACK_META[track].label.toUpperCase()}</text>

                    {/* Center line */}
                    <line x1={PAD_LEFT - 10} y1={mid} x2={W - 20} y2={mid} stroke="var(--border)" strokeWidth={1} opacity={0.5} />

                    {/* Milestones */}
                    {sorted.map((ms, i) => {
                      const x = toX(ms.date);
                      const done = ms.status === "done";
                      const isPast = parseDate(ms.date) < NOW && !done;
                      const above = i % 2 === 0;
                      const labelY = above ? mid - 20 : mid + 30;
                      const dateY = above ? mid - 8 : mid + 42;
                      const connY1 = above ? mid - 8 : mid + 8;
                      const connY2 = above ? mid - 16 : mid + 24;

                      return (
                        <g key={ms.name + ms.date}>
                          <line x1={x} y1={connY1} x2={x} y2={connY2} stroke="var(--border)" strokeWidth={1} />
                          <circle cx={x} cy={mid} r={done ? 7 : 5}
                            fill={done ? "var(--foreground)" : "var(--card)"}
                            stroke={done ? "var(--foreground)" : isPast ? "var(--muted-foreground)" : "var(--foreground)"}
                            strokeWidth={1.5}
                            opacity={done ? 1 : isPast ? 0.5 : 0.7} />
                          {done && <text x={x} y={mid + 3} textAnchor="middle" fill="var(--background)" fontSize={8} fontWeight={700}>✓</text>}
                          <text x={x} y={labelY} textAnchor="middle" fill="var(--foreground)" fontSize={11} fontWeight={done ? 700 : 500} opacity={done ? 1 : 0.8}>{ms.name}</text>
                          <text x={x} y={dateY} textAnchor="middle" fill="var(--muted-foreground)" fontSize={10}>{fmtShort(ms.date)}</text>
                          {isPast && (
                            <text x={x} y={above ? labelY - 10 : dateY + 12} textAnchor="middle" fill="var(--muted-foreground)" fontSize={8}>overdue</text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </Cd>

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap text-xs text-muted-foreground mb-6 px-1">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-foreground opacity-35" />Today</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-foreground" />Done</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-foreground opacity-70" style={{ background: "var(--card)" }} />Upcoming</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-muted-foreground opacity-50" style={{ background: "var(--card)" }} />Overdue</span>
      </div>

      {/* NPI Stages + Risks — matching Dashboard card style */}
      <div className={`grid gap-4 mb-5 ${mob ? "grid-cols-1" : "grid-cols-2"}`}>
        <Cd delay={0.15} hover={false} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">NPI Stages</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Target milestones by phase</p>
            </div>
            <I name="flag" size={16} color="var(--muted-foreground)" />
          </div>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Stage</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Quality</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Target</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { stage: "Beta / Lab Qual", target: "Jun 2026", quality: "Lab/Qual Ready", units: "2-4" },
                  { stage: "Pilot", target: "Oct 2026", quality: "Near Prod Grade", units: "~30" },
                  { stage: "FRS", target: "Nov 2026", quality: "Production Grade", units: "~50" },
                  { stage: "GA", target: "Jan 2027", quality: "Production Grade", units: "~200" },
                ].map(s => (
                  <tr key={s.stage} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2.5 text-xs font-medium text-foreground">{s.stage}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.quality} · {s.units} units</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground text-right">{s.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cd>

        <Cd delay={0.2} hover={false} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Risks & Mitigation</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{risks.length} open issue{risks.length !== 1 ? "s" : ""}</p>
            </div>
            <I name="alert" size={16} color="var(--muted-foreground)" />
          </div>
          {risks.length === 0 && <p className="text-sm text-muted-foreground">No open issues for this program.</p>}
          {risks.length > 0 && (
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-16">Sev</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Issue</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-20">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}>
                          {r.sev === "C" ? "Crit" : r.sev === "H" ? "High" : "Med"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground">{r.text}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground text-right">{r.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Cd>
      </div>
    </motion.div>
  );
}
