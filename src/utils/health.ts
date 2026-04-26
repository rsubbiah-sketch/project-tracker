/**
 * Program Health Scoring Engine
 *
 * 3 independent dimensions scored 0–100:
 *   Product, Execution, Time to Market
 *
 * Composite score is a weighted average with weights
 * customized per program type (HW, SW, Customer, NPI).
 */
import type { Program, Task } from '../types';

/* ═══ WEIGHTS PER TYPE ═══ */
export const HEALTH_WEIGHTS: Record<string, Record<string, number>> = {
  HW:       { technology: .40, execution: .30, timeToMarket: .30 },
  SW:       { technology: .35, execution: .35, timeToMarket: .30 },
  Customer: { technology: .30, execution: .30, timeToMarket: .40 },
  NPI:      { technology: .35, execution: .30, timeToMarket: .35 },
};

/* ═══ DISPLAY HELPERS ═══
 * Unified RAG thresholds across the app:
 *   Green  ≥ 90
 *   Amber  70–89
 *   Red    < 70
 */
export const RAG_GREEN = '#34D399';
export const RAG_AMBER = '#FBBF24';
export const RAG_RED   = '#F87171';
export const RAG_GRAY  = '#94A3B4';

export function ragColor(v: number | undefined | null): string {
  if (v == null) return RAG_GRAY;
  return v >= 90 ? RAG_GREEN : v >= 70 ? RAG_AMBER : RAG_RED;
}
export function ragBg(v: number | undefined | null): string {
  if (v == null) return 'rgba(148,163,180,.12)';
  return v >= 90 ? 'rgba(52,211,153,.12)' : v >= 70 ? 'rgba(251,191,36,.12)' : 'rgba(248,113,113,.12)';
}
export function ragLabel(v: number | undefined | null): string {
  if (v == null) return '—';
  return v >= 90 ? 'Green' : v >= 70 ? 'Yellow' : 'Red';
}

// Back-compat aliases — all use the same RAG thresholds now.
export const healthColor = ragColor as (v: number) => string;
export const milestoneColor = ragColor;
export const milestoneLabel = ragLabel;
export const healthBg = ragBg as (v: number) => string;

export function healthLabel(v: number): string {
  return v >= 90 ? 'On Track' : v >= 70 ? 'At Risk' : 'Critical';
}

export const DIM_META: Record<string, { label: string; icon: string }> = {
  technology:   { label: 'Product Readiness', icon: 'shield' },
  execution:    { label: 'Execution',         icon: 'clipboard' },
  timeToMarket: { label: 'Time to Market',    icon: 'calendar' },
};

/* ═══ HEALTH RESULT TYPE ═══ */
export interface HealthResult {
  dims: Record<string, number>;
  composite: number;
  alerts: string[];
  label: string;
  color: string;
}

/* ═══ MAIN SCORING FUNCTION ═══ */
export function calcHealth(
  p: Program,
  tasks: Task[],
): HealthResult {
  const now = new Date();
  const start = p.assignedDate ? new Date(p.assignedDate) : new Date(p.start || now);
  const end = p.deliveryCommit
    ? new Date(p.deliveryCommit)
    : p.deliveryAsk
      ? new Date(p.deliveryAsk)
      : null;
  const prgTasks = tasks.filter(t => t.prgId === p.id);

  // ─── 1. Product: baseline from milestone scores ───
  let technology = 80;

  // ─── 2. Execution: task velocity + milestone delivery ───
  let taskScore = 100;
  if (prgTasks.length > 0) {
    const done = prgTasks.filter(t => t.status === 'Done').length;
    const overdue = prgTasks.filter(t => t.due && new Date(t.due) < now && t.status !== 'Done').length;
    const blocked = prgTasks.filter(t => t.status === 'Blocked').length;
    const completionRate = (done / prgTasks.length) * 100;
    taskScore = Math.max(0, Math.min(100,
      completionRate - (overdue / prgTasks.length) * 50 - (blocked / prgTasks.length) * 150 + 30
    ));
  }
  let milestoneScore = 100;
  const ms = p.milestones || [];
  if (ms.length > 0) {
    let penalty = 0;
    ms.forEach(m => {
      if (!m.date) return;
      const mDate = new Date(m.date);
      if (m.status !== 'done' && mDate < now) {
        const daysLate = Math.floor((now.getTime() - mDate.getTime()) / (1000 * 60 * 60 * 24));
        penalty += Math.min(30, daysLate * 2);
      }
    });
    milestoneScore = Math.max(0, 100 - penalty);
  }
  let execution = taskScore * 0.6 + milestoneScore * 0.4;

  // ─── 3. Time to Market: schedule adherence ───
  let timeToMarket = 100;
  if (end && end > start) {
    const elapsed = Math.max(0, Math.min(1, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())));
    const expected = elapsed * 100;
    const variance = p.progress - expected;
    timeToMarket = Math.max(0, Math.min(100, 100 + variance * 2));
  }

  // ─── Milestone score roll-up: milestone scores are the primary driver ───
  // Include ALL milestones with scores (both active and done)
  const catScores: Record<string, number[]> = { product: [], execution: [], ttm: [] };
  ms.forEach(m => { if (m.category && m.score != null) catScores[m.category].push(m.score); });
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const msAvgTech = avg(catScores.product);
  const msAvgExec = avg(catScores.execution);
  const msAvgTtm = avg(catScores.ttm);
  // When milestone scores exist, they drive the dimension (80% milestone, 20% algorithm)
  if (msAvgTech != null) technology = technology * 0.2 + msAvgTech * 0.8;
  if (msAvgExec != null) execution = execution * 0.2 + msAvgExec * 0.8;
  if (msAvgTtm != null) timeToMarket = timeToMarket * 0.2 + msAvgTtm * 0.8;

  // ─── Composite ───
  const dims = {
    technology: Math.round(technology),
    execution: Math.round(execution),
    timeToMarket: Math.round(timeToMarket),
  };
  const w = HEALTH_WEIGHTS[p.type] || HEALTH_WEIGHTS.HW;
  const composite = Math.round(
    dims.technology * w.technology +
    dims.execution * w.execution +
    dims.timeToMarket * w.timeToMarket
  );

  // ─── Alerts for problem areas ───
  const alerts: string[] = [];
  if (dims.timeToMarket < 60) {
    const elapsed = end && end > start
      ? Math.round((now.getTime() - start.getTime()) / (end.getTime() - start.getTime()) * 100)
      : 0;
    alerts.push(`Time to Market: ${elapsed}% of timeline elapsed but only ${p.progress}% progress. ${Math.abs(p.progress - elapsed)} points ${p.progress < elapsed ? 'behind' : 'ahead'}.`);
  }
  if (dims.execution < 60) {
    const overdue = prgTasks.filter(t => t.due && new Date(t.due) < now && t.status !== 'Done').length;
    const lateMilestones = ms.filter(m => m.date && new Date(m.date) < now && m.status !== 'done');
    if (overdue) alerts.push(`Execution: ${overdue} overdue task${overdue > 1 ? 's' : ''}.`);
    if (lateMilestones.length) alerts.push(`Execution: ${lateMilestones.length} overdue milestone${lateMilestones.length > 1 ? 's' : ''} — ${lateMilestones.map(m => m.name).join(', ')}.`);
  }
  if (dims.technology < 60) alerts.push(`Product: readiness score low for current phase.`);

  return {
    dims,
    composite,
    alerts,
    label: healthLabel(composite),
    color: healthColor(composite),
  };
}
