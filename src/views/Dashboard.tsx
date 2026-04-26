import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Icon as I } from '../components/Icons';
import { u } from '../tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import { Cd } from '../components/ui';
import type { Program, Comment, Task } from '../types';
import { calcHealth, healthColor, healthLabel } from '../utils/health';

interface MetricsDim { score: number | null; note: string }
interface ProgramMetric { programId: string; technology: MetricsDim; execution: MetricsDim; timeToMarket: MetricsDim; composite: number | null }

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

interface DashboardProps {
  prg: Program[];
  com: Comment[];
  tasks: Task[];
  go: (id: string) => void;
}

export default function Dashboard({ prg, com, tasks, go }: DashboardProps) {
  const mob = useIsMobile();

  const [apiMetrics, setApiMetrics] = useState<Record<string, ProgramMetric>>({});
  const loadMetrics = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    fetch(`${API_BASE}/program-metrics/all`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : [])
      .then((list: ProgramMetric[]) => {
        const map: Record<string, ProgramMetric> = {};
        list.forEach(m => { if (m.programId) map[m.programId] = m; });
        setApiMetrics(map);
      })
      .catch(() => {});
  }, []);
  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  const healthMap = prg.reduce((acc, p) => {
    acc[p.id] = calcHealth(p, tasks);
    return acc;
  }, {} as Record<string, ReturnType<typeof calcHealth>>);

  const getComposite = (pid: string) => apiMetrics[pid]?.composite ?? healthMap[pid]?.composite ?? 0;

  const onTrackCount = prg.filter(p => getComposite(p.id) >= 90).length;
  const atRiskCount = prg.filter(p => { const c = getComposite(p.id); return c >= 70 && c < 90; }).length;
  const criticalCount = prg.filter(p => getComposite(p.id) < 70).length;

  const avgHealth = prg.length ? Math.round(prg.reduce((s, p) => s + getComposite(p.id), 0) / prg.length) : 0;
  const onTrackPct = prg.length ? Math.round((onTrackCount / prg.length) * 100) : 0;

  const stats = [
    { l: "Total Programs", v: prg.length, trend: "+0%", trendUp: true, desc: "Active in portfolio", icon: "folder" },
    { l: "On Track", v: onTrackCount, trend: `${onTrackPct}%`, trendUp: onTrackPct >= 50, desc: "Healthy programs", icon: "check" },
    { l: "At Risk", v: atRiskCount, trend: atRiskCount > 0 ? "Monitor" : "Clear", trendUp: atRiskCount === 0, desc: "Need attention", icon: "alert" },
    { l: "Average Health", v: avgHealth, trend: `${avgHealth}/100`, trendUp: avgHealth >= 90, desc: "Portfolio score", icon: "activity" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Program portfolio overview &amp; health metrics</p>
      </div>

      {/* Stats grid — 4 cards like shadcn */}
      <div className={`grid gap-4 mb-6 ${mob ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {stats.map((s, i) => (
          <Cd key={i} delay={i * 0.06} hover={false} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{s.l}</span>
              <I name={s.icon} size={16} color="var(--muted-foreground)" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-2">{s.v}</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {s.trendUp ? '↑' : '↓'} {s.trend}
              </span>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </div>
          </Cd>
        ))}
      </div>

      {/* Programs table — shadcn dashboard style */}
      <Cd delay={0.2} hover={false} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Programs</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{prg.length} active programs in portfolio</p>
          </div>
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Program</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-24 hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-40 hidden lg:table-cell">Owner</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-28 hidden md:table-cell">Phase</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-28">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-24">Health</th>
              </tr>
            </thead>
            <tbody>
              {prg.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">No programs yet</td></tr>
              ) : prg.map((p) => {
                const h = healthMap[p.id];
                const am = apiMetrics[p.id];
                const comp = am?.composite ?? h?.composite ?? 0;
                const color = healthColor(comp);
                const label = healthLabel(comp);
                return (
                  <tr
                    key={p.id}
                    onClick={() => go(p.id)}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground truncate max-w-xs">{p.name}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{p.type}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-foreground truncate max-w-[140px] inline-block">{p.owner.name}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{p.currentPhase}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color, background: `${color}1f` }}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold tabular-nums" style={{ color }}>{comp}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Cd>
    </motion.div>
  );
}
