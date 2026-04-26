import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as I } from '../components/Icons';
import { Cd } from '../components/ui';
import { HEALTH_WEIGHTS, DIM_META, healthColor, healthBg } from '../utils/health';
import { ROLE_HIERARCHY, PERMISSIONS, hasMinRole } from '../hooks/useRBAC';

/* ═══ SECTION DATA ═══ */

const SECTIONS = [
  { id: 'health', label: 'Health & scoring', icon: 'activity', desc: 'How program health scores are calculated' },
  { id: 'milestones', label: 'Milestones', icon: 'flag', desc: 'Categories, scoring, ownership, and timeline' },
  { id: 'roles', label: 'Roles & access', icon: 'shield', desc: 'Who can do what in the system' },
  { id: 'nav', label: 'Navigation', icon: 'home', desc: 'Sidebar layout and page purposes' },
  { id: 'programs', label: 'Programs', icon: 'folder', desc: 'Creating and managing programs' },
  { id: 'tasks', label: 'Tasks', icon: 'clipboard', desc: 'Task lifecycle, table view, and actions' },
  { id: 'theme', label: 'Theme', icon: 'settings', desc: 'Shadcn neutral theme and dark mode' },
  { id: 'shortcuts', label: 'Keyboard shortcuts', icon: 'zap', desc: 'Power-user navigation' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const ROLE_INFO: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  admin:       { label: 'Admin',       color: '#F87171', bg: 'rgba(248,113,113,.12)', desc: 'Full access to everything. Manage users, change roles, view audit logs, delete any entity.' },
  editor:      { label: 'Editor',      color: '#A78BFA', bg: 'rgba(167,139,250,.12)', desc: 'Create programs, manage tasks, post comments, link documents. Program owners control milestones and phase timeline.' },
  commenter:   { label: 'Commenter',  color: '#60A5FA', bg: 'rgba(96,165,250,.12)',  desc: 'Post comments, edit tasks assigned to them. Milestone owners can edit their assigned milestones.' },
  viewer:      { label: 'Viewer',      color: '#64748B', bg: 'rgba(100,116,139,.12)', desc: 'Read-only access to all programs, tasks, and documents. Cannot modify anything.' },
};

const PERM_GROUPS = [
  { group: 'Programs',   perms: ['program.view', 'program.create', 'program.edit', 'program.delete'] },
  { group: 'Milestones', perms: ['milestone.view', 'milestone.add', 'milestone.edit.own', 'milestone.edit.any', 'milestone.delete'] },
  { group: 'Tasks',      perms: ['task.view', 'task.create', 'task.edit.own', 'task.edit.any', 'task.delete', 'task.reassign'] },
  { group: 'Documents',  perms: ['doc.view', 'doc.link', 'doc.remove'] },
  { group: 'Comments',   perms: ['comment.view', 'comment.create', 'comment.delete.own', 'comment.delete.any'] },
  { group: 'Admin',      perms: ['admin.view', 'admin.manage_users', 'admin.manage_teams', 'admin.view_audit'] },
];

const NAV_ITEMS = [
  { name: 'Dashboard', group: 'Daily', purpose: 'Executive overview — stat cards (Total Programs, On Track, At Risk, Average Health) and a full-width shadcn-style programs table with columns: Program, Type, Owner, Phase, Status pill, Health score.' },
  { name: 'My Tasks', group: 'Daily', purpose: 'Your personal work queue. Shadcn-style table with columns: checkbox, Task ID, Title, Program, Status dropdown, Priority arrow, Assignee dropdown, and Actions (…) menu. Filters: My Tasks / All Tasks, Status dropdown, and Sort by dropdown. Supports standalone tasks without a program.' },
  { name: 'Programs', group: 'Daily', purpose: 'Master registry of all programs. Browse, search, and create new programs. Each program has tabbed detail view: Overview, Milestones, Tasks, Documents, Comments, and NPI Timeline.' },
  { name: '--- divider ---', group: '', purpose: '' },
  { name: 'Admin', group: 'Admin', purpose: 'User management, role assignment. Only visible to admin-role users.' },
  { name: 'Help', group: 'Utility', purpose: 'This page — reference documentation for health metrics, milestones, roles, navigation, theme, and shortcuts.' },
];

/* ═══ SUB-COMPONENTS ═══ */

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <Cd delay={0.04} hover={false} className="p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
          <I name={icon} size={16} color="var(--foreground)" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </Cd>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-semibold text-secondary-foreground w-32 flex-shrink-0">{label}</span>
      <span className="text-xs text-muted-foreground flex-1" style={color ? { color } : {}}>{value}</span>
    </div>
  );
}

function KbdKey({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-border text-muted-foreground border border-border/50">
      {children}
    </kbd>
  );
}

/* ═══ MAIN COMPONENT ═══ */

export default function HelpView() {
  const [active, setActive] = useState<SectionId>('health');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base md:text-lg font-bold text-foreground mb-1">Help &amp; Reference</h2>
        <p className="text-xs text-muted-foreground">How everything works — metrics, roles, navigation, and shortcuts.</p>
      </div>

      {/* Section tabs — shadcn style */}
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground mb-5 overflow-x-auto">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className={`inline-flex items-center justify-center gap-1.5 h-[calc(100%-1px)] px-3 rounded-md border border-transparent text-sm font-medium cursor-pointer whitespace-nowrap flex-shrink-0 transition-[color,background-color,box-shadow] ${active === s.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <I name={s.icon} size={13} color="currentColor" />
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ═══ HEALTH METRICS ═══ */}
        {active === 'health' && (
          <motion.div key="health" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            <SectionCard title="How health scoring works" icon="activity">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Every program gets a health score from 0 to 100, computed from 3 independent dimensions: Product, Execution, and Time to Market. The composite score is a weighted average — weights are customized per program type because HW programs depend more on product readiness while Customer programs are driven by delivery timelines.
              </p>

              <div className="space-y-4">
                {/* Dimension explanations */}
                {([
                  { key: 'technology', formula: 'milestone_avg(product) × 0.8 + baseline × 0.2', explain: 'Measures product readiness using milestone scores in the Product category. Each milestone scored 0–100 by its owner. The category average drives 80% of the dimension; a baseline of 80 fills the remaining 20% when no milestone scores exist yet.', example: '3 product milestones scored 95, 80, 70 → avg = 81.7. Score = 81.7×0.8 + 80×0.2 = 81.' },
                  { key: 'execution', formula: '(task_score × 0.6) + (milestone_score × 0.4)', explain: 'Combines task velocity (60% weight) with milestone delivery (40% weight). Task score: completion_rate% - (overdue/total)×50 - (blocked/total)×150 + 30. Blocked tasks penalize 3× harder than overdue because they indicate unresolved external dependencies. Milestone score: 100 minus a penalty of 2 points per day late per overdue milestone (max 30 per milestone). Completed milestones have no penalty.', example: 'Tasks: 8/12 done (67%), 1 overdue → task score 93. Milestones: 1 of 3 is 8 days late → milestone score 84. Execution = 93×0.6 + 84×0.4 = 89.' },
                  { key: 'timeToMarket', formula: '100 + (actual_progress% - expected_progress%) × 2', explain: 'Compares where you should be based on elapsed timeline vs where you actually are. Expected progress is calculated as the percentage of time elapsed between assigned date and delivery commit. If 50% of the timeline has passed and you\'re at 62% progress, you\'re ahead (+24 bonus). If you\'re at 30%, you\'re behind (-40 penalty). Clamped to 0–100.', example: '60% time elapsed, 45% progress → variance = -15, score = 100 + (-15)×2 = 70 (at risk).' },
                ] as const).map(d => (
                  <div key={d.key} className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <I name={DIM_META[d.key].icon} size={14} color="var(--foreground)" />
                      <span className="text-xs font-bold text-foreground">{DIM_META[d.key].label}</span>
                    </div>
                    <div className="text-xs font-mono px-2 py-1.5 rounded bg-border/50 text-muted-foreground mb-2">{d.formula}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{d.explain}</p>
                    <p className="text-xs text-secondary-foreground"><strong>Example:</strong> {d.example}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Weights by program type" icon="settings">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                The 3 dimension scores are combined into a single composite using type-specific weights. This ensures that what matters most for each program type drives the overall health label.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">Dimension</th>
                      {['HW', 'SW', 'Customer', 'NPI'].map(t => (
                        <th key={t} className="text-center py-2 px-3 font-semibold text-foreground">{t}</th>
                      ))}
                      <th className="text-left py-2 pl-4 text-muted-foreground font-semibold">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(DIM_META).map(dim => (
                      <tr key={dim} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-semibold text-secondary-foreground">{DIM_META[dim].label}</td>
                        {['HW', 'SW', 'Customer', 'NPI'].map(t => {
                          const val = Math.round((HEALTH_WEIGHTS[t]?.[dim] || 0) * 100);
                          const isMax = val === Math.max(...['HW', 'SW', 'Customer', 'NPI'].map(tt => Math.round((HEALTH_WEIGHTS[tt]?.[dim] || 0) * 100)));
                          return (
                            <td key={t} className="text-center py-2 px-3">
                              <span className={`font-bold ${isMax ? '' : 'text-muted-foreground'}`} style={isMax ? { color: 'var(--foreground)' } : {}}>
                                {val}%
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2 pl-4 text-muted-foreground text-xs">
                          {dim === 'technology' && 'HW programs depend on product readiness and design maturity'}
                          {dim === 'execution' && 'SW execution is sprint-driven — task velocity and milestones matter most'}
                          {dim === 'timeToMarket' && 'Customer programs have external delivery commitments'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Thresholds and PM override" icon="flag">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'On Track', range: '90–100', color: healthColor(95), bg: healthBg(95) },
                  { label: 'At Risk', range: '70–89', color: healthColor(80), bg: healthBg(80) },
                  { label: 'Critical', range: '< 70', color: healthColor(30), bg: healthBg(30) },
                ].map(t => (
                  <div key={t.label} className="p-3 rounded-xl text-center" style={{ background: t.bg, border: `1px solid ${t.color}22` }}>
                    <div className="text-xs font-bold" style={{ color: t.color }}>{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.range}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                The status label is auto-calculated from the composite score. However, PMs can override it with a mandatory justification note. This is essential because the algorithm can't know about vendor promises, parallel paths, or strategic decisions that affect the real status.
              </p>
              <InfoRow label="Override visible" value="Shows '(PM)' badge in program list and a purple card in program detail" />
              <InfoRow label="Justification" value="Required text note explaining why the PM disagrees with the calculated status" />
              <InfoRow label="Audit trail" value="Override records the PM's name and date — traceable in post-mortems" />
              <InfoRow label="Remove override" value="PM can remove to revert to auto-calculated status at any time" />
            </SectionCard>

            <SectionCard title="Display locations" icon="search">
              <InfoRow label="Dashboard" value="Programs table shows Status pill (On Track / At Risk / Delayed) and Health score per row. Stat cards show totals and averages." />
              <InfoRow label="Program detail — Overview" value="Single-row info bar: Owner, Delivery ASK, Delivery Commit, Product score, Execution score, TTM score, Status pill. Below it, a horizontal milestone timeline shows all milestones chronologically with color-coded dots (green = done, red = overdue, blue = upcoming)." />
              <InfoRow label="Milestone table" value="Full-width table with in-cell editing. Each milestone has a category (Product/Execution/TTM), score (0–100), owner dropdown, and key issue. Scores auto-color: ≥90 green, ≥70 yellow, <70 red." />
              <InfoRow label="NPI Timeline tab" value="Draggable horizontal timeline with milestones grouped into tracks by dimension: Product (blue), Execution (green), Time-to-Market (gold). Track filter chips isolate a single dimension; zoom controls adjust scale; today is marked in gold. Hover a milestone for date, owner, and key issue. Open program issues are surfaced as a Risks & Mitigation card below the timeline." />
            </SectionCard>
          </motion.div>
        )}

        {/* ═══ MILESTONES ═══ */}
        {active === 'milestones' && (
          <motion.div key="milestones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            <SectionCard title="Milestone categories" icon="flag">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Every milestone is mapped to one of three health dimensions. This determines which pillar the milestone's score rolls up to.
              </p>
              <div className="space-y-2">
                <InfoRow label="Product Readiness" value="Core product readiness, including feature completeness, performance, and quality." color="#60A5FA" />
                <InfoRow label="Execution" value="External dependencies that impact program success, including partner integration, interoperability, ecosystem and critical enabling resources." color="#A78BFA" />
                <InfoRow label="Time to Market" value="Customer-facing milestones required to qualify, release, and bring the product to market (e.g. Customer Qual)." color="#F59E0B" />
              </div>
            </SectionCard>

            <SectionCard title="Milestone scoring (0–100)" icon="activity">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Each milestone has a single score (0–100) that represents its health within its assigned category. Scores are entered by the milestone owner via in-cell editing in the milestone table.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Green', range: '90–100', color: '#34D399', bg: 'rgba(52,211,153,.12)', meaning: 'On track' },
                  { label: 'Yellow', range: '70–89', color: '#FBBF24', bg: 'rgba(251,191,36,.12)', meaning: 'At risk' },
                  { label: 'Red', range: '< 70', color: '#F87171', bg: 'rgba(248,113,113,.12)', meaning: 'Off track' },
                ].map(t => (
                  <div key={t.label} className="p-3 rounded-xl text-center" style={{ background: t.bg, border: `1px solid ${t.color}22` }}>
                    <div className="text-xs font-bold" style={{ color: t.color }}>{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.range} — {t.meaning}</div>
                  </div>
                ))}
              </div>
              <InfoRow label="Roll-up" value="Milestone scores are averaged by category, then blended 50/50 with the algorithm score. Product milestones → Product dimension, Execution milestones → Execution dimension, TTM milestones → Time to Market dimension." />
              <InfoRow label="Done milestones" value="Excluded from the roll-up average. Always shown as green in the table." />
            </SectionCard>

            <SectionCard title="Milestone ownership & permissions" icon="user">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Milestones use an ownership-based permission model. The program owner has full control, and milestone owners can edit their assigned milestones.
              </p>
              <div className="text-xs font-bold uppercase tracking-[0.12em] mb-2 text-muted-foreground">Program Owner can:</div>
              <div className="space-y-1 mb-4">
                <InfoRow label="Drag phase timeline" value="Only the program owner (or admin) can drag the phase progress circle." />
                <InfoRow label="Add milestones" value="Only the program owner can add new milestones via the Add button." />
                <InfoRow label="Assign owners" value="Only the program owner can set or change the Owner dropdown on any milestone." />
                <InfoRow label="Edit any milestone" value="The program owner can edit all fields on every milestone regardless of who owns it." />
                <InfoRow label="Delete milestones" value="The program owner can delete any milestone." />
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] mb-2 text-muted-foreground">Milestone Owner can:</div>
              <div className="space-y-1 mb-4">
                <InfoRow label="Edit own milestone" value="Name, category, date, score, key issue, and status toggle — but only for milestones assigned to them." />
                <InfoRow label="Cannot reassign" value="Milestone owners cannot change the Owner dropdown — only the program owner can reassign." />
                <InfoRow label="Shield icon" value="A 🛡 icon appears next to milestone names that are locked (owned by someone else)." />
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] mb-2 text-muted-foreground">Everyone else:</div>
              <InfoRow label="Read-only" value="Users who are neither the program owner nor the milestone owner see read-only text — no inputs, no dropdowns." />
            </SectionCard>

            <SectionCard title="Managing milestones" icon="list">
              <InfoRow label="Create with program" value="Add milestones during program creation. Each has name, category (Product/Execution/TTM), date, owner dropdown, status, and key issue." />
              <InfoRow label="Add later" value="Program owner clicks the 'Add' button above the milestone table to add new milestones." />
              <InfoRow label="Edit in-cell" value="Program owner and milestone owners can edit cells directly — name, category, date, score, and key issue. Changes save on blur." />
              <InfoRow label="Assign owners" value="Program owner selects a team member from the Owner dropdown. Once assigned, that person can edit their milestone." />
              <InfoRow label="NPI Timeline" value="Switch to the NPI Timeline tab to see milestones grouped into Product / Execution / Time-to-Market tracks (color-coded by category). Filter by track, zoom (+/-), drag to pan, hover for details. Only dimensions with milestones render. Open program issues appear in the Risks & Mitigation card below." />
            </SectionCard>
          </motion.div>
        )}

        {/* ═══ ROLES & ACCESS ═══ */}
        {active === 'roles' && (
          <motion.div key="roles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SectionCard title="Role hierarchy" icon="user">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Roles follow a strict hierarchy: each level inherits all permissions from the levels below. An admin can do everything a PM can do, plus admin-only functions. The hierarchy is:
              </p>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {ROLE_HIERARCHY.map((r, i) => {
                  const ri = ROLE_INFO[r];
                  return (
                    <div key={r} className="flex items-center gap-2">
                      <div className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: ri.bg, color: ri.color, border: `1px solid ${ri.color}22` }}>
                        {ri.label}
                      </div>
                      {i < ROLE_HIERARCHY.length - 1 && <I name="chevR" size={14} color="var(--muted-foreground)" />}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                {ROLE_HIERARCHY.slice().reverse().map(r => {
                  const ri = ROLE_INFO[r];
                  return (
                    <div key={r} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: ri.bg, border: `1px solid ${ri.color}15` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ri.color}20` }}>
                        <I name="user" size={14} color={ri.color} />
                      </div>
                      <div>
                        <div className="text-xs font-bold" style={{ color: ri.color }}>{ri.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{ri.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Permission matrix" icon="shield">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                24 granular permissions across 6 categories. Each permission has a minimum required role.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">Permission</th>
                      {ROLE_HIERARCHY.slice().reverse().map(r => (
                        <th key={r} className="text-center py-2 px-2 font-semibold" style={{ color: ROLE_INFO[r].color }}>{ROLE_INFO[r].label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERM_GROUPS.map(grp => (
                      <>
                        <tr key={grp.group}>
                          <td colSpan={5} className="pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{grp.group}</td>
                        </tr>
                        {grp.perms.map(perm => {
                          const minRole = PERMISSIONS[perm as keyof typeof PERMISSIONS];
                          return (
                            <tr key={perm} className="border-b border-border/30">
                              <td className="py-1.5 pr-4 text-secondary-foreground font-mono text-xs">{perm}</td>
                              {ROLE_HIERARCHY.slice().reverse().map(r => (
                                <td key={r} className="text-center py-1.5 px-2">
                                  {hasMinRole(r, minRole)
                                    ? <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ background: 'rgba(52,211,153,.12)' }}><I name="check" size={10} color="#34D399" /></span>
                                    : <span className="inline-block w-5 h-5 rounded bg-border/30" />
                                  }
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Visibility rules" icon="settings">
              <InfoRow label="Admin nav item" value="Only visible in sidebar when user role = admin" />
              <InfoRow label="Admin panel" value="Route guard prevents rendering even if URL is manipulated" />
              <InfoRow label="Audit log" value="Admin-only — captures every write operation with user, action, entity, timestamp" />
              <InfoRow label="Phase timeline" value="Draggable circle visible to program owner only. Others see read-only phase display." />
              <InfoRow label="Add milestone" value="Button visible only to program owner." />
              <InfoRow label="Milestone editing" value="In-cell inputs visible to program owner and milestone owner. Read-only for everyone else." />
            </SectionCard>
          </motion.div>
        )}

        {/* ═══ NAVIGATION ═══ */}
        {active === 'nav' && (
          <motion.div key="nav" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SectionCard title="Sidebar layout" icon="home">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                The sidebar is organized in three groups separated by dividers. Items are ordered by frequency of use: daily views at top, periodic process tools in the middle, meta/admin at the bottom.
              </p>
              <div className="space-y-1.5">
                {NAV_ITEMS.map((item, i) => {
                  if (item.name.includes('divider')) {
                    return <div key={i} className="my-2 border-t border-border" />;
                  }
                  const groupColor = item.group === 'Daily' ? '#34D399' : item.group === 'Process' ? '#A78BFA' : item.group === 'Meta' ? '#64748B' : '#F87171';
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                      <div className="flex items-center gap-2 w-28 flex-shrink-0">
                        <span className="text-xs font-bold text-foreground">{item.name}</span>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ color: groupColor, background: `${groupColor}18` }}>{item.group}</span>
                      <span className="text-xs text-muted-foreground flex-1">{item.purpose}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Why this order?" icon="info">
              <InfoRow label="Dashboard first" value="Universal entry point — everyone starts here to get the lay of the land." />
              <InfoRow label="My Tasks second" value="The most actionable view. After seeing the overview, users ask 'what do I need to do today?'" />
              <InfoRow label="Programs third" value="Master registry. Browse the portfolio, create new programs, drill into detail with Overview and NPI Timeline tabs." />
              <InfoRow label="Admin separated" value="Only visible to admins. Divider line + red badge make it distinct from business views." />
              <InfoRow label="Help last" value="Reference documentation — always available but not in the critical workflow path." />
            </SectionCard>
          </motion.div>
        )}

        {/* ═══ PROGRAMS ═══ */}
        {active === 'programs' && (
          <motion.div key="programs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SectionCard title="Program types" icon="folder">
              <InfoRow label="HW (Hardware)" value="Physical products — switch trays, PCBs, optics. Phases: Schematic → Layout → Fabrication → Assembly → Bring-up → Validation → Production." />
              <InfoRow label="SW (Software)" value="Software products — SONiC NOS, orchestrators, tools. Phases: Planning → Development → Integration → Testing → Staging → Release." />
              <InfoRow label="Customer" value="Customer-facing deliverables — qualifications, integrations. Weighted heavily on schedule and milestones because external commitments are contractual." />
              <InfoRow label="NPI" value="New Product Introduction. Text-only sub-type (no preset categories). Covers novel programs that don't fit HW/SW/Customer." />
            </SectionCard>

            <SectionCard title="Program fields" icon="file">
              <InfoRow label="Name *" value="Required. The primary identifier shown everywhere." />
              <InfoRow label="Type *" value="HW, SW, Customer, or NPI. Determines phase sequence and health weights." />
              <InfoRow label="Sub-type" value="CRD, MRD, PRD, DOC, Project, or custom. Cascading dropdown — changes when type changes." />
              <InfoRow label="Phase" value="New → Active → Waiting → Blocked → Complete. Auto-sets progress bar color and mode (planning vs active)." />
              <InfoRow label="Owner" value="Person accountable for delivering the program. Shown in Overview info bar." />
              <InfoRow label="Delivery ASK" value="Date the business or customer is requesting. Shown in Overview info bar." />
              <InfoRow label="Delivery Commit" value="Date the team has committed to. Shown in Overview info bar alongside health dimension scores." />
              <InfoRow label="Milestones *" value="At least one required. Each has name, category (Product/Execution/TTM), date, owner (dropdown), score (0–100), status, and key issue. Editable in-cell in Milestones tab. Visualized as horizontal dot timeline in Overview and as draggable timeline in NPI Timeline tab." />
            </SectionCard>

            <SectionCard title="Program modes" icon="plan">
              <InfoRow label="Planning (DRAFT)" value="Programs with phase = 'New' start in planning mode. Shown with a purple DRAFT badge. Not yet committed." />
              <InfoRow label="Active" value="Programs that have been activated. Activation locks a baseline snapshot in Google Drive." />
              <InfoRow label="Activation" value="Irreversible. Clicking 'Activate Plan' changes mode from planning to active and stores a JSON snapshot in Drive." />
            </SectionCard>
          </motion.div>
        )}

        {/* ═══ TASKS ═══ */}
        {active === 'tasks' && (
          <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SectionCard title="Task lifecycle" icon="clipboard">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {['Todo', 'In Progress', 'In Review', 'Done'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{
                      background: s === 'Done' ? 'rgba(52,211,153,.12)' : s === 'In Review' ? 'rgba(96,165,250,.12)' : 'rgba(100,116,139,.12)',
                      color: s === 'Done' ? '#34D399' : s === 'In Review' ? '#60A5FA' : 'var(--muted-foreground)',
                    }}>{s}</span>
                    {i < 3 && <I name="chevR" size={12} color="var(--muted-foreground)" />}
                  </div>
                ))}
              </div>
              <InfoRow label="Todo → In Progress" value="Assignee starts work. No side effects." />
              <InfoRow label="In Progress → In Review" value="Submitted for peer/PM review. In-app notification sent to reporter." />
              <InfoRow label="In Review → Done" value="Approved. Notification to reporter. Audit log entry." />
              <InfoRow label="In Review → In Progress" value="Rejected — sent back for rework. Notification to assignee." />
              <InfoRow label="In Progress → Todo" value="Reverted — task not yet ready. Rare but allowed." />
              <InfoRow label="Reassign" value="Any state. Changes assignee. Fires Gmail to new assignee + audit log." />
            </SectionCard>

            <SectionCard title="Task table — shadcn style" icon="list">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Both My Tasks and Program Detail &gt; Tasks use the same unified TaskTable component matching the shadcn tasks example (ui.shadcn.com/examples/tasks).
              </p>
              <InfoRow label="Columns" value="Checkbox (select), Task ID (mono), Title, Program (My Tasks only), Status (inline dropdown), Priority (arrow + label), Assignee (inline dropdown), Actions (… menu)." />
              <InfoRow label="Selection" value="Checkbox on each row, select-all in header. Selected rows get muted background." />
              <InfoRow label="Sorting" value="Click Title, Status, or Priority column headers to toggle sort direction." />
              <InfoRow label="Inline editing" value="Status and Assignee can be changed via inline dropdowns — saves immediately to state and backend." />
            </SectionCard>

            <SectionCard title="Actions menu (…)" icon="more">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Every task row has a three-dot (…) menu in the Actions column with six items:
              </p>
              <InfoRow label="Edit" value="Opens a full edit dialog (shadcn form) pre-populated with the task's current values. Change title, description, status, priority, assignee, due date, or program." />
              <InfoRow label="Mark as Done / Todo" value="Quick toggle between Done and Todo status. Saves immediately." />
              <InfoRow label="Add link to documents" value="Opens an Add Link dialog with type selector (Document / Task / Action), URL field, and optional label. The link is appended to the task's description." />
              <InfoRow label="Comments" value="Expands the task row inline to show the comments thread below it." />
              <InfoRow label="Discussion" value="Same as Comments — expands the row for inline discussion." />
              <InfoRow label="Delete" value="Red text, separated by a divider. Confirms with browser dialog, then removes the task from state and backend." />
            </SectionCard>

            <SectionCard title="Task fields" icon="file">
              <InfoRow label="Title *" value="Required. What needs to be done." />
              <InfoRow label="Assignee *" value="Who will do the work. Dropdown includes current user (marked 'me') + all team members." />
              <InfoRow label="Reporter" value="Auto-set to the current logged-in user when creating the task." />
              <InfoRow label="Priority" value="P0 Critical (↑ red), P1 High (↑ amber), P2 Medium (→ blue), P3 Low (↓ gray)." />
              <InfoRow label="Due date" value="Optional but drives the overdue calculation. Tasks past due with status ≠ Done count in the Overdue stat." />
              <InfoRow label="Program" value="Optional. Tasks can be standalone (no program) or linked to a program. In My Tasks, the Program column shows the linked program name." />
              <InfoRow label="Description" value="Optional. Supports multi-line text via popup editor. Linked documents appear here with emoji prefix (📎 document, 📝 task, ⚡ action)." />
            </SectionCard>

            <SectionCard title="Filters (My Tasks page)" icon="search">
              <InfoRow label="Assignee dropdown" value="My Tasks (assigned to you) or All Tasks (portfolio-wide)." />
              <InfoRow label="Status dropdown" value="All Status, Todo, In Progress, In Review, Done." />
              <InfoRow label="Sort by dropdown" value="Priority (default), Due Date, Status." />
            </SectionCard>
          </motion.div>
        )}

        {/* ═══ THEME ═══ */}
        {active === 'theme' && (
          <motion.div key="theme" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SectionCard title="Shadcn neutral theme" icon="settings">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                The application uses the shadcn/ui default neutral theme with oklch color space CSS variables. All components (buttons, inputs, tables, dialogs, cards, tabs) follow shadcn conventions.
              </p>
              <InfoRow label="Color system" value="CSS variables: --background, --foreground, --card, --muted, --border, --primary, --destructive. All defined in oklch for perceptual uniformity." />
              <InfoRow label="Font" value="Geist Variable (via @fontsource-variable/geist). Used across all text elements." />
              <InfoRow label="Primary button" value="bg-primary text-primary-foreground (black on light, white on dark). Used for: New Program, Add Task, Link Document, Save changes, Add link." />
              <InfoRow label="Outline button" value="border border-border bg-background hover:bg-muted. Used for: Back, Cancel, secondary actions." />
              <InfoRow label="Tables" value="rounded-md border border-border overflow-hidden. Header: bg-muted/30 border-b. Rows: hover:bg-muted/30 with border-b border-border." />
              <InfoRow label="Tabs" value="Shadcn TabsList/TabsTrigger: h-9 rounded-lg bg-muted p-[3px]. Active trigger: bg-background text-foreground shadow-sm. Inactive hover: hover:bg-background/50." />
              <InfoRow label="Cards" value="rounded-2xl border border-border bg-card shadow-sm. Hover shadow only on clickable cards." />
              <InfoRow label="Inputs" value="h-9 rounded-md border border-border bg-background shadow-xs. Focus ring: focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]." />
            </SectionCard>

            <SectionCard title="Dark mode" icon="activity">
              <InfoRow label="Toggle" value="Sun/moon icon button in the topbar. Click to switch between light and dark themes." />
              <InfoRow label="Persistence" value="Stored in localStorage. Survives page refreshes and sessions." />
              <InfoRow label="System detection" value="On first visit, respects the OS prefers-color-scheme preference." />
              <InfoRow label="Implementation" value="Toggling adds/removes the .dark class on document.documentElement. CSS custom properties switch via :root and .dark selectors." />
            </SectionCard>

            <SectionCard title="Program detail tabs" icon="folder">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Each program has 6 tabs in the detail view, rendered as shadcn-style TabsList:
              </p>
              <InfoRow label="Overview" value="Single-row info bar (Owner, ASK, Commit, dimension scores, Status pill) + horizontal milestone timeline with color-coded dots." />
              <InfoRow label="Milestones" value="Full-width editable table with columns: Name, Category, Date, Owner, Score, Key Issue. In-cell editing for owners." />
              <InfoRow label="Tasks" value="Shadcn task table for this program's tasks. Actions menu, inline status/assignee editing, expandable comment rows." />
              <InfoRow label="Documents" value="Linked documents list. Link Document button (shadcn primary style) opens a form with name, type, category, and URL fields." />
              <InfoRow label="Comments" value="Threaded comments with replies, likes, and resolution." />
              <InfoRow label="NPI Timeline" value="Milestones grouped into Product / Execution / Time-to-Market tracks by category. Track-filter chips, zoom controls, drag-to-pan, today marker in gold. Done milestones show filled dots; pending show outlined dots. Risks & Mitigation card lists open program issues by severity." />
            </SectionCard>
          </motion.div>
        )}

        {/* ═══ KEYBOARD SHORTCUTS ═══ */}
        {active === 'shortcuts' && (
          <motion.div key="shortcuts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SectionCard title="Global shortcuts" icon="zap">
              <div className="space-y-3">
                {[
                  { keys: ['⌘', 'K'], desc: 'Open command palette — search programs and navigate to any view' },
                  { keys: ['Esc'], desc: 'Close command palette, notification drawer, or mobile sidebar' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <KbdKey>{k}</KbdKey>
                          {j < s.keys.length - 1 && <span className="text-xs text-muted-foreground">+</span>}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground flex-1">{s.desc}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Command palette" icon="search">
              <InfoRow label="Activation" value="⌘K / Ctrl+K, or click the search button in the topbar" />
              <InfoRow label="Search" value="Filters programs by name (case-insensitive substring match). No debounce — instant." />
              <InfoRow label="Results" value="Shows matching programs + all navigation items. Click to navigate." />
              <InfoRow label="Keyboard nav" value="Arrow keys to highlight, Enter to select, Escape to close." />
            </SectionCard>

            <SectionCard title="Notifications" icon="bell">
              <InfoRow label="Bell icon" value="Topbar, right side. Red badge shows unread count." />
              <InfoRow label="Drawer" value="Slides in from the right. Shows all notifications newest first." />
              <InfoRow label="Types" value="@mention (blue), reply (purple), like (red), status change (green), task assignment (blue)." />
              <InfoRow label="Gmail dual-delivery" value="Mentions and task assignments also send Gmail. In-app and email are independent." />
              <InfoRow label="Self-exclusion" value="You don't get notified for your own actions." />
            </SectionCard>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
