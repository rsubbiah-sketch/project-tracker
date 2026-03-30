import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as I } from '../components/Icons';
import { Cd } from '../components/ui';
import { u, accent, accentText } from '../tokens';
import { HEALTH_WEIGHTS, DIM_META, healthColor, healthBg } from '../utils/health';
import { ROLE_HIERARCHY, PERMISSIONS, hasMinRole, type RBACRole } from '../hooks/useRBAC';

/* ═══ SECTION DATA ═══ */

const SECTIONS = [
  { id: 'health', label: 'Health metrics', icon: 'activity', desc: 'How program health scores are calculated' },
  { id: 'roles', label: 'Roles & access', icon: 'shield', desc: 'Who can do what in the system' },
  { id: 'nav', label: 'Navigation', icon: 'home', desc: 'Sidebar layout and page purposes' },
  { id: 'programs', label: 'Programs', icon: 'folder', desc: 'Creating and managing programs' },
  { id: 'tasks', label: 'Tasks', icon: 'clipboard', desc: 'Task lifecycle and assignments' },
  { id: 'gates', label: 'Gate reviews', icon: 'shield', desc: 'Phase-gate quality checkpoints' },
  { id: 'shortcuts', label: 'Keyboard shortcuts', icon: 'zap', desc: 'Power-user navigation' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const ROLE_INFO: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  admin:       { label: 'Admin',       color: '#F87171', bg: 'rgba(248,113,113,.12)', desc: 'Full access to everything. Manage users, change roles, view audit logs, delete any entity.' },
  editor:      { label: 'Editor',      color: '#A78BFA', bg: 'rgba(167,139,250,.12)', desc: 'Create programs, approve gate reviews, manage all tasks, activate plans, override health status.' },
  commenter:   { label: 'Commenter',  color: '#60A5FA', bg: 'rgba(96,165,250,.12)',  desc: 'Create and edit tasks assigned to them, post comments, link documents, update gate checklist items.' },
  viewer:      { label: 'Viewer',      color: '#64748B', bg: 'rgba(100,116,139,.12)', desc: 'Read-only access to all programs, tasks, documents, and gate reviews. Cannot modify anything.' },
};

const PERM_GROUPS = [
  { group: 'Programs',     perms: ['program.view', 'program.create', 'program.edit', 'program.delete', 'program.activate'] },
  { group: 'Tasks',        perms: ['task.view', 'task.create', 'task.edit.own', 'task.edit.any', 'task.delete', 'task.reassign'] },
  { group: 'Gate Reviews', perms: ['gate.view', 'gate.update', 'gate.approve'] },
  { group: 'Documents',    perms: ['doc.view', 'doc.link', 'doc.remove'] },
  { group: 'Comments',     perms: ['comment.view', 'comment.create', 'comment.delete.own', 'comment.delete.any'] },
  { group: 'Admin',        perms: ['admin.view', 'admin.manage_users', 'admin.view_audit', 'admin.manage_roles'] },
];

const NAV_ITEMS = [
  { name: 'Dashboard', group: 'Daily', purpose: 'Executive command center — stat cards, charts, activity feed, upcoming milestones. Answers "what\'s happening right now?" in 10 seconds.' },
  { name: 'My Tasks', group: 'Daily', purpose: 'Your personal work queue. Every task assigned to you across all programs in one view. Sortable by priority, due date, or status. The first thing most people check each morning.' },
  { name: 'Programs', group: 'Daily', purpose: 'Master registry of all programs. Browse, filter by type, search, and create new programs. Program cards show health dots, progress bars, and key metadata.' },
  { name: '--- divider ---', group: '', purpose: '' },
  { name: 'Gate Reviews', group: 'Process', purpose: 'Phase-gate quality checkpoints. Checklist-based verification with blocking logic — the Approve button stays disabled until all items are resolved. Guards multi-million-dollar decisions.' },
  { name: 'Planning', group: 'Process', purpose: 'Draft programs and plan-vs-actual comparison. DRAFT programs get reviewed here before activation. Active programs show Gantt-style timeline bars.' },
  { name: 'Roadmap', group: 'Meta', purpose: 'Implementation tracker for the app itself — 45 tasks across 6 phases. Internal to the dev team building this tool.' },
  { name: 'Admin', group: 'Admin', purpose: 'User management, role assignment, and audit log. Only visible to admin-role users. Manage who can do what across the system.' },
];

/* ═══ SUB-COMPONENTS ═══ */

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <Cd delay={0.04} hover={false} className="p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
          <I name={icon} size={16} color={accentText} />
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
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
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-border text-muted-foreground border border-border/50">
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

      {/* Section pills */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {SECTIONS.map(s => (
          <motion.button key={s.id} whileTap={{ scale: .95 }} onClick={() => setActive(s.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: active === s.id ? accent : 'transparent',
              color: active === s.id ? accentText : 'var(--muted-foreground)',
              border: `1px solid ${active === s.id ? accent : 'var(--border)'}`,
            }}>
            <I name={s.icon} size={13} color={active === s.id ? accentText : 'var(--muted-foreground)'} />
            {s.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ═══ HEALTH METRICS ═══ */}
        {active === 'health' && (
          <motion.div key="health" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            <SectionCard title="How health scoring works" icon="activity">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Every program gets a health score from 0 to 100, computed from 5 independent dimensions. Each dimension measures a different aspect of program execution. The composite score is a weighted average — weights are customized per program type because HW programs care more about budget while SW programs care more about task velocity.
              </p>

              <div className="space-y-4">
                {/* Dimension explanations */}
                {([
                  { key: 'schedule', formula: '100 + (actual_progress% - expected_progress%) × 2', explain: 'Compares where you should be based on elapsed timeline vs where you actually are. If 50% of the timeline has passed and you\'re at 62% progress, you\'re ahead (+24 bonus). If you\'re at 30%, you\'re behind (-40 penalty).', example: 'PRG-001: 50% time elapsed, 62% progress → score 100 (capped). PRG-005: 90% time elapsed, 55% progress → score 30 (critical).' },
                  { key: 'milestones', formula: '100 - (days_late × 2 per overdue milestone, max 30 per milestone)', explain: 'Each overdue milestone penalizes the score by 2 points per day late, capped at 30 per milestone. A milestone 5 days late costs 10 points. A milestone 20 days late costs 30 (the max). Completed milestones have no penalty regardless of whether they were late.', example: '3 milestones, 1 is 8 days overdue → 100 - 16 = 84 (good).' },
                  { key: 'tasks', formula: 'completion_rate% - overdue_penalty - blocked_penalty + 30', explain: 'Starts with the percentage of tasks marked Done. Subtracts 50 points per overdue task (as fraction of total) and 150 points per blocked task (as fraction). Adds 30-point baseline so programs with few tasks don\'t immediately score 0. Blocked tasks penalize 3× harder than overdue because they indicate external dependencies the team can\'t control.', example: '12 tasks, 8 done (67%), 1 overdue (4%), 0 blocked → 67 - 4 - 0 + 30 = 93.' },
                  { key: 'budget', formula: 'min(100, (progress% / budgetUsed%) × 100)', explain: 'Efficiency ratio — are you delivering value proportional to spend? Progress 60% with budget used 60% = perfect (score 100). Progress 40% with budget 70% used = inefficient (score 57). Capped at 100 so being under-budget doesn\'t inflate the score unreasonably.', example: 'PRG-002: 45% progress, 71% budget → 45/71 × 100 = 63 (at risk).' },
                  { key: 'quality', formula: '(passed + waived) / total_gate_items × 100 - (failed × 15)', explain: 'Measures gate review readiness. Each gate item that\'s Passed or Waived contributes to the score. Each Failed item subtracts 15 points — a hard penalty because a failed gate item can block the entire phase advancement. If no gate items have been reviewed yet, defaults to 80 (benefit of the doubt early in the phase).', example: '5 gate items: 3 passed, 1 waived, 1 failed → (4/5 × 100) - 15 = 65.' },
                ] as const).map(d => (
                  <div key={d.key} className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <I name={DIM_META[d.key].icon} size={14} color={accentText} />
                      <span className="text-xs font-bold text-foreground">{DIM_META[d.key].label}</span>
                    </div>
                    <div className="text-[10px] font-mono px-2 py-1.5 rounded bg-border/50 text-muted-foreground mb-2">{d.formula}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{d.explain}</p>
                    <p className="text-xs text-secondary-foreground"><strong>Example:</strong> {d.example}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Weights by program type" icon="settings">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                The 5 dimension scores are combined into a single composite using type-specific weights. This ensures that what matters most for each program type drives the overall health label.
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
                              <span className={`font-bold ${isMax ? '' : 'text-muted-foreground'}`} style={isMax ? { color: accentText } : {}}>
                                {val}%
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2 pl-4 text-muted-foreground text-[11px]">
                          {dim === 'schedule' && 'Customer programs have external commitments'}
                          {dim === 'milestones' && 'Customer and NPI milestones are contractual'}
                          {dim === 'tasks' && 'SW execution is sprint-driven — velocity matters most'}
                          {dim === 'budget' && 'HW has expensive fab runs and NRE costs'}
                          {dim === 'quality' && 'SW releases need code quality and security gates'}
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
                  { label: 'On Track', range: '75–100', color: healthColor(80), bg: healthBg(80) },
                  { label: 'At Risk', range: '50–74', color: healthColor(60), bg: healthBg(60) },
                  { label: 'Critical', range: '0–49', color: healthColor(30), bg: healthBg(30) },
                ].map(t => (
                  <div key={t.label} className="p-3 rounded-xl text-center" style={{ background: t.bg, border: `1px solid ${t.color}22` }}>
                    <div className="text-xs font-bold" style={{ color: t.color }}>{t.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{t.range}</div>
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
              <InfoRow label="Program list" value="5 traffic light dots (S M T B Q) next to each program card. Green ≥75, Amber 50–74, Red <50. Hover shows all scores." />
              <InfoRow label="Program detail" value="Full KPI bars with numeric scores, dimension labels (Good/Behind/Late/Over-burn/Critical), animated progress bars, and natural language alert callouts." />
              <InfoRow label="Health badge" value="Pill badge on each program card showing composite score and label (On Track 82, At Risk 63, Critical 41)." />
              <InfoRow label="Weight tags" value="Small tags above the KPI bars showing the weight config for that program type." />
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
                          <td colSpan={5} className="pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{grp.group}</td>
                        </tr>
                        {grp.perms.map(perm => {
                          const minRole = PERMISSIONS[perm as keyof typeof PERMISSIONS];
                          return (
                            <tr key={perm} className="border-b border-border/30">
                              <td className="py-1.5 pr-4 text-secondary-foreground font-mono text-[10px]">{perm}</td>
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
              <InfoRow label="PM override button" value="Visible to all users viewing program detail, but requires editor or admin role to save" />
              <InfoRow label="Create program" value="Button visible to all but form submission requires editor or admin role" />
              <InfoRow label="Approve gate" value="Gate review checklist visible to all, approve button only for editor or admin" />
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
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ color: groupColor, background: `${groupColor}18` }}>{item.group}</span>
                      <span className="text-xs text-muted-foreground flex-1">{item.purpose}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Why this order?" icon="info">
              <InfoRow label="Dashboard first" value="Universal entry point — everyone starts here to get the lay of the land." />
              <InfoRow label="My Tasks second" value="The most actionable view. After seeing the overview, users ask 'what do I need to do today?' — not 'what programs exist?'" />
              <InfoRow label="Programs third" value="Reference/context layer. Browse the portfolio, create new programs, drill into detail." />
              <InfoRow label="Divider" value="Visual break between daily-use views and periodic process tools." />
              <InfoRow label="Gate Reviews above Planning" value="Higher frequency (every phase boundary), more users (PM + leads), higher stakes ($10M decisions)." />
              <InfoRow label="Planning below Gates" value="Used infrequently (initial setup + quarterly reviews), primarily PM-only." />
              <InfoRow label="Roadmap last" value="Meta — tracks the 45 tasks to build this app. Not part of the business workflow." />
              <InfoRow label="Admin separated" value="Only visible to admins. Divider line + red badge make it distinct from business views." />
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
              <InfoRow label="Type *" value="HW, SW, Customer, or NPI. Determines phase sequence, gate items, and health weights." />
              <InfoRow label="Sub-type" value="CRD, MRD, PRD, DOC, Project, or custom. Cascading dropdown — changes when type changes." />
              <InfoRow label="Phase" value="New → Active → Waiting → Blocked → Complete. Auto-sets progress bar color and mode (planning vs active)." />
              <InfoRow label="Owner" value="Person accountable for delivering the program." />
              <InfoRow label="Assigned By" value="Who created or assigned this program (defaults to current user)." />
              <InfoRow label="Delivery ASK" value="Date the business or customer is requesting." />
              <InfoRow label="Delivery Commit" value="Date the team has committed to. Gap between ASK and Commit is a useful planning metric." />
              <InfoRow label="Milestones *" value="At least one required. Each has a name, target date, and status (pending/done). Shown as colored dots in the list view." />
            </SectionCard>

            <SectionCard title="Program modes" icon="plan">
              <InfoRow label="Planning (DRAFT)" value="Programs with phase = 'New' start in planning mode. Shown with a purple DRAFT badge. Not yet committed." />
              <InfoRow label="Active" value="Programs that have been activated. Activation locks a baseline snapshot in Google Drive. Phase advancement requires gate review approval." />
              <InfoRow label="Activation" value="Irreversible. Clicking 'Activate Plan' changes mode from planning to active, stores a JSON snapshot in Drive, and starts the gate review cycle." />
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

            <SectionCard title="Task fields" icon="file">
              <InfoRow label="Title *" value="Required. What needs to be done." />
              <InfoRow label="Assignee *" value="Who will do the work. Dropdown of all team members." />
              <InfoRow label="Reporter" value="Auto-set to the current logged-in user when creating the task." />
              <InfoRow label="Priority" value="P0 (critical/red), P1 (high/amber), P2 (medium/blue), P3 (low/gray)." />
              <InfoRow label="Due date" value="Optional but drives the overdue calculation. Tasks past due with status ≠ Done show an OVERDUE badge." />
              <InfoRow label="Program" value="Every task belongs to exactly one program. Shown as a clickable chip in My Tasks." />
            </SectionCard>

            <SectionCard title="Gmail triggers" icon="send">
              <InfoRow label="Task created" value="Gmail sent to assignee with task title, program name, priority, and due date." />
              <InfoRow label="Task reassigned" value="Gmail sent to new assignee. Old assignee gets an in-app notification." />
              <InfoRow label="@mention in comment" value="Gmail sent to mentioned user with the comment body and program context." />
            </SectionCard>
          </motion.div>
        )}

        {/* ═══ GATE REVIEWS ═══ */}
        {active === 'gates' && (
          <motion.div key="gates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SectionCard title="Gate review process" icon="shield">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Gate reviews are the quality enforcement mechanism. Each phase has a checklist of criteria that must be verified before the program can advance. The Approve button is physically disabled until all items are resolved.
              </p>
              <InfoRow label="Checklist items" value="Specific criteria per phase and type. E.g., HW Verification gate: 'DV coverage > 95%', 'Timing closure met'." />
              <InfoRow label="Item statuses" value="Passed (green), Failed (red), Waived (amber), In Progress (blue), Pending (gray)." />
              <InfoRow label="Blocking rule" value="pending === 0 AND failed === 0. Button enabled only when every item is Passed or Waived." />
              <InfoRow label="Waiver" value="A conscious risk acceptance. The team knows the criterion isn't met but accepts the risk. Recorded in the gate review document stored in Drive." />
            </SectionCard>

            <SectionCard title="On approval" icon="check">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                When the PM clicks Approve Gate, 7 things happen simultaneously:
              </p>
              <div className="space-y-1.5">
                {[
                  'Program phase advances to the next phase in the sequence',
                  'Progress percentage bumps proportionally',
                  'Gate review record stored in Firestore (gate_reviews collection)',
                  'Gate review JSON backup stored in Google Drive',
                  'Gmail notification sent to all team members',
                  'In-app notification created for each team member',
                  'Audit log entry with action "approve_gate"',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-[10px] font-bold text-secondary-foreground w-4 flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </div>
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
              <InfoRow label="Types" value="@mention (blue), reply (purple), gate approval (amber), like (red), status change (green), task assignment (blue)." />
              <InfoRow label="Gmail dual-delivery" value="Mentions, gate approvals, and task assignments also send Gmail. In-app and email are independent." />
              <InfoRow label="Self-exclusion" value="You don't get notified for your own actions." />
            </SectionCard>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
