/**
 * Program Health Scoring Engine
 * 
 * 5 independent dimensions scored 0–100:
 *   Schedule, Milestones, Tasks, Budget, Quality
 * 
 * Composite score is a weighted average with weights
 * customized per program type (HW, SW, Customer, NPI).
 */
import type { Program, Task } from '../types';
import { GATES } from '../data/gates';

/* ═══ WEIGHTS PER TYPE ═══ */
export const HEALTH_WEIGHTS: Record<string, Record<string, number>> = {
  HW:       { schedule: .25, milestones: .20, tasks: .15, budget: .25, quality: .15 },
  SW:       { schedule: .20, milestones: .15, tasks: .30, budget: .15, quality: .20 },
  Customer: { schedule: .30, milestones: .25, tasks: .15, budget: .15, quality: .15 },
  NPI:      { schedule: .25, milestones: .25, tasks: .20, budget: .15, quality: .15 },
};

/* ═══ DISPLAY HELPERS ═══ */
export function healthColor(v: number): string {
  return v >= 75 ? '#34D399' : v >= 50 ? '#FBBF24' : '#F87171';
}

export function healthLabel(v: number): string {
  return v >= 75 ? 'On Track' : v >= 50 ? 'At Risk' : 'Critical';
}

export function healthBg(v: number): string {
  return v >= 75 ? 'rgba(52,211,153,.12)' : v >= 50 ? 'rgba(251,191,36,.12)' : 'rgba(248,113,113,.12)';
}

export const DIM_META: Record<string, { label: string; icon: string }> = {
  schedule:   { label: 'Schedule',   icon: 'calendar' },
  milestones: { label: 'Milestones', icon: 'flag' },
  tasks:      { label: 'Tasks',      icon: 'clipboard' },
  budget:     { label: 'Budget',     icon: 'activity' },
  quality:    { label: 'Quality',    icon: 'shield' },
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
  gateSt: Record<string, string>,
): HealthResult {
  const now = new Date();
  const start = p.assignedDate ? new Date(p.assignedDate) : new Date(p.start || now);
  const end = p.deliveryCommit
    ? new Date(p.deliveryCommit)
    : p.deliveryAsk
      ? new Date(p.deliveryAsk)
      : null;
  const prgTasks = tasks.filter(t => t.prgId === p.id);

  // ─── 1. Schedule: % time elapsed vs % progress ───
  let schedule = 100;
  if (end && end > start) {
    const elapsed = Math.max(0, Math.min(1, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())));
    const expected = elapsed * 100;
    const variance = p.progress - expected;
    schedule = Math.max(0, Math.min(100, 100 + variance * 2));
  }

  // ─── 2. Milestones: penalize overdue milestones ───
  let milestones = 100;
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
    milestones = Math.max(0, 100 - penalty);
  }

  // ─── 3. Task velocity: completion, overdue, blocked ───
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

  // ─── 4. Budget: burn efficiency ───
  let budget = 100;
  if (p.budgetUsed > 0 && p.progress > 0) {
    const efficiency = p.progress / p.budgetUsed;
    budget = Math.max(0, Math.min(100, efficiency * 100));
  } else if (p.budgetUsed > 10 && p.progress === 0) {
    budget = 30;
  }

  // ─── 5. Quality / gate readiness ───
  let quality = 80;
  const gateType = p.type === 'HW' ? 'Hardware' : p.type === 'SW' ? 'Software' : 'Software';
  const gd = GATES[gateType] || [];
  const currentPhase = p.phase || p.currentPhase;
  const cg = gd.find(x => x.ph === currentPhase);
  if (cg && cg.items.length > 0) {
    const items = cg.items;
    const passed = items.filter(item => (gateSt[`${p.id}-${currentPhase}-${item}`] || 'Pending') === 'Passed').length;
    const waived = items.filter(item => (gateSt[`${p.id}-${currentPhase}-${item}`] || 'Pending') === 'Waived').length;
    const failed = items.filter(item => (gateSt[`${p.id}-${currentPhase}-${item}`] || 'Pending') === 'Failed').length;
    quality = Math.max(0, ((passed + waived) / items.length) * 100 - failed * 15);
  }

  // ─── Composite ───
  const dims = {
    schedule: Math.round(schedule),
    milestones: Math.round(milestones),
    tasks: Math.round(taskScore),
    budget: Math.round(budget),
    quality: Math.round(quality),
  };
  const w = HEALTH_WEIGHTS[p.type] || HEALTH_WEIGHTS.HW;
  const composite = Math.round(
    dims.schedule * w.schedule +
    dims.milestones * w.milestones +
    dims.tasks * w.tasks +
    dims.budget * w.budget +
    dims.quality * w.quality
  );

  // ─── Alerts for problem areas ───
  const alerts: string[] = [];
  if (dims.schedule < 60) {
    const elapsed = end && end > start
      ? Math.round((now.getTime() - start.getTime()) / (end.getTime() - start.getTime()) * 100)
      : 0;
    alerts.push(`Schedule: ${elapsed}% of timeline elapsed but only ${p.progress}% progress. ${Math.abs(p.progress - elapsed)} points ${p.progress < elapsed ? 'behind' : 'ahead'}.`);
  }
  if (dims.milestones < 70) {
    const late = ms.filter(m => m.date && new Date(m.date) < now && m.status !== 'done');
    if (late.length) alerts.push(`Milestones: ${late.length} overdue — ${late.map(m => m.name).join(', ')}.`);
  }
  if (dims.tasks < 60 && prgTasks.length > 0) {
    const overdue = prgTasks.filter(t => t.due && new Date(t.due) < now && t.status !== 'Done').length;
    if (overdue) alerts.push(`Tasks: ${overdue} overdue task${overdue > 1 ? 's' : ''}.`);
  }
  if (dims.budget < 60) alerts.push(`Budget: ${p.budgetUsed}% spent at ${p.progress}% progress — burn rate too high.`);
  if (dims.quality < 60) alerts.push(`Quality: gate readiness low for current phase.`);

  return {
    dims,
    composite,
    alerts,
    label: healthLabel(composite),
    color: healthColor(composite),
  };
}
