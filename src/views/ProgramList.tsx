import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as I } from '../components/Icons';
import { u, ST, PROGRAM_TYPES, SUBTYPES, PROGRAM_PHASES, PHASE_COLOR, PROGRESS_COLOR, accent, accentText } from '../tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import { Av, SB, TB, PB, GB, Spark, Cd } from '../components/ui';
import { USERS, ME } from '../data/index';
import type { Program, Comment, Milestone, Task, HealthOverride, ProgramHealth, KeyIssue, Sig } from '../types';
import { createProgram } from '../services/api';
import { calcHealth, healthColor, healthLabel, healthBg, DIM_META } from '../utils/health';
import { HealthStrip, emptyHealth } from '../components/Health';

interface ProgramListProps {
  prg: Program[];
  setPrg: React.Dispatch<React.SetStateAction<Program[]>>;
  go: (id: string) => void;
  com: Comment[];
  tasks?: Task[];
  gateSt?: Record<string, string>;
  healthOverrides?: Record<string, HealthOverride>;
}

const emptyMilestone = (): Milestone => ({ name: "", date: "", status: "pending" });

interface FormState {
  name: string;
  desc: string;
  type: typeof PROGRAM_TYPES[number];
  subType: string;
  customSubType: string;
  currentPhase: typeof PROGRAM_PHASES[number];
  owner: string;
  assignedBy: string;
  assignedDate: string;
  deliveryAsk: string;
  deliveryCommit: string;
  team: string;
  budget: string;
  milestones: Milestone[];
  health: ProgramHealth;
  issues: KeyIssue[];
}

const emptyForm = (): FormState => ({
  name: "",
  desc: "",
  type: "HW",
  subType: SUBTYPES["HW"]?.[0] || "",
  customSubType: "",
  currentPhase: "New",
  owner: USERS[0].id,
  assignedBy: ME.id,
  assignedDate: new Date().toISOString().split("T")[0],
  deliveryAsk: "",
  deliveryCommit: "",
  team: "",
  budget: "",
  milestones: [emptyMilestone()],
  health: emptyHealth(),
  issues: [],
});

export default function ProgramList({ prg, setPrg, go, com, tasks = [], gateSt = {}, healthOverrides = {} }: ProgramListProps) {
  const mob = useIsMobile();
  const [f, setF] = useState("All");
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [showCustomInput, setShowCustomInput] = useState(false);

  /* ── helpers ── */
  const upd = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }));

  const setMilestone = (idx: number, patch: Partial<Milestone>) =>
    setForm(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));

  const addMilestone = () => upd({ milestones: [...form.milestones, emptyMilestone()] });

  const removeMilestone = (idx: number) => {
    if (form.milestones.length <= 1) return;
    upd({ milestones: form.milestones.filter((_, i) => i !== idx) });
  };

  const canSubmit = form.name.trim() && form.milestones.some(m => m.name.trim());

  /* ── create program ── */
  const createPrg = () => {
    if (!canSubmit) return;
    const owner = USERS.find(u2 => u2.id === form.owner) || USERS[0];
    const ab = USERS.find(u2 => u2.id === form.assignedBy) || ME;
    const newPrg: Program = {
      id: `PRG-${String(prg.length + 1).padStart(3, "0")}`,
      name: form.name,
      type: form.type,
      subType: showCustomInput ? form.customSubType : form.subType,
      currentPhase: form.currentPhase,
      owner,
      assignedBy: ab,
      assignedDate: form.assignedDate || new Date().toISOString().split("T")[0],
      lastUpdate: new Date().toISOString(),
      deliveryAsk: form.deliveryAsk,
      deliveryCommit: form.deliveryCommit,
      desc: form.desc,
      progress: 0,
      team: parseInt(form.team) || 0,
      budget: form.budget || "TBD",
      budgetUsed: 0,
      mode: form.currentPhase === "New" ? "planning" : "active",
      spark: [0],
      milestones: form.milestones.filter(m => m.name.trim()),
      health: form.health,
      issues: form.issues,
    };
    setPrg(prev => [...prev, newPrg]);
    createProgram({
      name: form.name,
      type: form.type,
      subType: showCustomInput ? form.customSubType : form.subType,
      currentPhase: form.currentPhase,
      description: form.desc,
      assignedById: form.assignedBy,
      assignedDate: form.assignedDate || new Date().toISOString().split("T")[0],
      deliveryAsk: form.deliveryAsk,
      deliveryCommit: form.deliveryCommit,
      budget: form.budget || "TBD",
      team: parseInt(form.team) || 0,
      mode: form.currentPhase === "New" ? "planning" : "active",
      milestones: form.milestones.filter(m => m.name.trim()),
    }).catch(() => {});
    setForm(emptyForm());
    setShowCustomInput(false);
    setShowNew(false);
  };

  /* ── filter & sort ── */
  const list = (f === "All" ? prg : prg.filter(p => p.type === f))
    .filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
    .slice()
    .sort((a, b) => String(b.lastUpdate || "").localeCompare(String(a.lastUpdate || "")));

  /* ── input class ── */
  const inp = "w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary";
  const lbl = "text-xs mb-1 block font-medium text-muted-foreground";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-bold text-foreground">Programs</h2>
        <motion.button whileTap={{ scale: .95 }} onClick={() => setShowNew(!showNew)}
          className="px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
          style={{ background: showNew ? 'var(--border)' : accent, color: showNew ? 'var(--foreground)' : accentText, border: `1px solid ${showNew ? 'var(--border)' : accent}` }}>
          <I name={showNew ? "x" : "plus"} size={12} color={showNew ? 'var(--foreground)' : accentText} />{showNew ? "Cancel" : "New Program"}
        </motion.button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-shrink-0">
          {["All", ...PROGRAM_TYPES].map(x => (
            <motion.button key={x} whileTap={{ scale: .95 }} onClick={() => setF(x)}
              className="px-3 md:px-4 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
              style={{ background: f === x ? accent : 'var(--card)', color: f === x ? accentText : 'var(--secondary-foreground)', border: `1px solid ${f === x ? accent : 'var(--border)'}` }}>
              {x}
            </motion.button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
          <I name="search" size={14} color="var(--muted-foreground)" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter programs…" className="bg-transparent text-xs outline-none flex-1 text-foreground" />
        </div>
      </div>

      {/* ═══ NEW PROGRAM FORM ═══ */}
      <AnimatePresence>{showNew && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <Cd delay={0} hover={false} className="p-4 md:p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <I name="folder" size={16} color="var(--foreground)" />
              <span className="text-sm font-bold text-foreground">Create New Program</span>
            </div>
            <div className="space-y-3">
              {/* Row 1: Name */}
              <div>
                <label className={lbl}>Program Name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={e => upd({ name: e.target.value })}
                  placeholder="Program name…" className={inp} />
              </div>

              {/* Row 2: Description */}
              <div>
                <label className={lbl}>Description</label>
                <textarea value={form.desc} onChange={e => upd({ desc: e.target.value })}
                  placeholder="Description…" rows={2} className={`${inp} resize-none`} />
              </div>

              {/* Row 3: Type | Sub-Type | Current Phase */}
              <div className="flex flex-wrap gap-3">
                <div style={{ width: 140 }}>
                  <label className={lbl}>Type</label>
                  <select value={form.type}
                    onChange={e => {
                      const t = e.target.value as FormState["type"];
                      const subs = SUBTYPES[t] || [];
                      upd({ type: t, subType: subs[0] || "", customSubType: "" });
                      setShowCustomInput(false);
                    }}
                    className={inp}>
                    {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ width: 180 }}>
                  <label className={lbl}>Sub-Type</label>
                  {showCustomInput ? (
                    <input value={form.customSubType} onChange={e => upd({ customSubType: e.target.value })}
                      placeholder="Custom sub-type…" className={inp} />
                  ) : (
                    <select value={form.subType}
                      onChange={e => {
                        if (e.target.value === "__custom__") {
                          setShowCustomInput(true);
                          upd({ customSubType: "" });
                        } else {
                          upd({ subType: e.target.value });
                        }
                      }}
                      className={inp}>
                      {(SUBTYPES[form.type] || []).map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="__custom__">+ Add Custom</option>
                    </select>
                  )}
                </div>
                <div style={{ width: 160 }}>
                  <label className={lbl}>Current Phase</label>
                  <select value={form.currentPhase} onChange={e => upd({ currentPhase: e.target.value as FormState["currentPhase"] })}
                    className={inp}>
                    {PROGRAM_PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: Owner | Assigned By | Assigned Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Owner</label>
                  <select value={form.owner} onChange={e => upd({ owner: e.target.value })} className={inp}>
                    {USERS.map(u2 => <option key={u2.id} value={u2.id}>{u2.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Assigned By</label>
                  <select value={form.assignedBy} onChange={e => upd({ assignedBy: e.target.value })} className={inp}>
                    {USERS.map(u2 => <option key={u2.id} value={u2.id}>{u2.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Assigned Date</label>
                  <input type="date" value={form.assignedDate} onChange={e => upd({ assignedDate: e.target.value })} className={inp} />
                </div>
              </div>

              {/* Row 5: Delivery ASK | Delivery Commit | Team Size | Budget */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className={lbl}>Delivery Date (ASK)</label>
                  <input type="date" value={form.deliveryAsk} onChange={e => upd({ deliveryAsk: e.target.value })} className={inp} />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className={lbl}>Delivery Commit</label>
                  <input type="date" value={form.deliveryCommit} onChange={e => upd({ deliveryCommit: e.target.value })} className={inp} />
                </div>
                <div style={{ width: 100 }}>
                  <label className={lbl}>Team Size</label>
                  <input type="number" min="0" value={form.team} onChange={e => upd({ team: e.target.value })} placeholder="0" className={inp} />
                </div>
                <div style={{ width: 120 }}>
                  <label className={lbl}>Budget</label>
                  <input value={form.budget} onChange={e => upd({ budget: e.target.value })} placeholder="$0" className={inp} />
                </div>
              </div>

              {/* Row 6: Milestones */}
              <div>
                <label className={lbl}>Milestones <span className="text-red-400">*</span></label>
                <div className="space-y-2">
                  {form.milestones.map((ms, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2">
                      <input value={ms.name} onChange={e => setMilestone(idx, { name: e.target.value })}
                        placeholder="Milestone name…" className={`${inp} flex-1`} style={{ minWidth: 120 }} />
                      <input type="date" value={ms.date} onChange={e => setMilestone(idx, { date: e.target.value })}
                        className={inp} style={{ width: 150 }} />
                      <input value={ms.owner || ''} onChange={e => setMilestone(idx, { owner: e.target.value })}
                        placeholder="Owner…" className={inp} style={{ width: 100 }} />
                      <select value={ms.status} onChange={e => setMilestone(idx, { status: e.target.value as Milestone["status"] })}
                        className={inp} style={{ width: 100 }}>
                        <option value="pending">Pending</option>
                        <option value="done">Done</option>
                      </select>
                      <input value={ms.keyIssue || ''} onChange={e => setMilestone(idx, { keyIssue: e.target.value })}
                        placeholder="Key issue…" className={`${inp} flex-1`} style={{ minWidth: 140 }} />
                      <motion.button whileTap={{ scale: .9 }} onClick={() => removeMilestone(idx)}
                        disabled={form.milestones.length <= 1}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-400 disabled:opacity-30">
                        <I name="x" size={12} color="currentColor" />
                      </motion.button>
                    </div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: .95 }} onClick={addMilestone}
                  className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 bg-card border border-border text-muted-foreground hover:text-foreground">
                  <I name="plus" size={11} color="currentColor" /> Add Milestone
                </motion.button>
              </div>

              {/* Row 7: Cancel + Create */}
              <div className="flex items-center gap-3 pt-1">
                <motion.button whileTap={{ scale: .95 }} onClick={() => { setForm(emptyForm()); setShowCustomInput(false); setShowNew(false); }}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-foreground">
                  Cancel
                </motion.button>
                <motion.button whileTap={{ scale: .95 }} disabled={!canSubmit} onClick={createPrg}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold"
                  style={{ background: canSubmit ? accent : 'var(--border)', color: canSubmit ? accentText : 'var(--muted-foreground)', opacity: canSubmit ? 1 : .5 }}>
                  <I name="plus" size={12} color={canSubmit ? accentText : 'var(--muted-foreground)'} />Create Program
                </motion.button>
              </div>
            </div>
          </Cd>
        </motion.div>
      )}</AnimatePresence>

      {/* ═══ PROGRAM CARDS ═══ */}
      <div className="space-y-3">
        {list.map((p, i) => {
          const phaseColor = PROGRESS_COLOR[p.currentPhase] || PROGRESS_COLOR.Active;
          const commentCount = com.filter(c => c.eId === p.id).length;
          const updateDate = p.lastUpdate ? new Date(p.lastUpdate).toLocaleDateString() : "";

          return (
            <Cd key={p.id} delay={i * .04} onClick={() => go(p.id)} className={mob ? "p-4" : "flex items-center gap-4 px-5 py-3.5"}>
              {mob ? (
                <>
                  {/* Mobile: row 1 badges */}
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground">{p.id}</span>
                    <TB type={p.type} />
                    {p.subType && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-border text-muted-foreground">{p.subType}</span>
                    )}
                    <PB phase={p.currentPhase || "New"} />
                    {p.mode === "planning" && (
                      <span className="text-[8px] font-black px-2 py-0.5 rounded" style={{ background: u.purD, color: u.pur }}>DRAFT</span>
                    )}
                  </div>
                  {/* Mobile: name */}
                  <div className="text-sm font-bold mb-1 text-foreground truncate">{p.name}</div>
                  {/* Mobile: desc */}
                  {p.desc && (
                    <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.desc}</div>
                  )}
                  {/* Mobile: health strip */}
                  {p.health && (
                    <div className="mb-2">
                      <HealthStrip health={p.health} issues={p.issues} />
                    </div>
                  )}
                  {/* Mobile: bottom row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Av user={p.owner} size={20} />
                      <span className="text-xs text-secondary-foreground">{p.owner.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16"><GB pct={p.progress} h={4} color={phaseColor} /></div>
                      <span className="text-xs font-bold text-muted-foreground">{p.progress}%</span>
                      <I name="chevR" size={14} color="var(--muted-foreground)" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Desktop layout */}
                  {(() => {
                    const h = calcHealth(p, tasks, gateSt);
                    const override = healthOverrides[p.id];
                    const displayLabel = override?.label || h.label;
                    const overrideScore = override?.label === 'On Track' ? 80 : override?.label === 'At Risk' ? 60 : 30;
                    const displayColor = override?.label ? healthColor(overrideScore) : h.color;
                    return (
                  <>
                  <div className="flex-1 min-w-0">
                    {/* Row 1: badges */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-muted-foreground">{p.id}</span>
                      <TB type={p.type} />
                      {p.subType && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-border text-muted-foreground">{p.subType}</span>
                      )}
                      <PB phase={p.currentPhase || "New"} />
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: healthBg(override?.label ? overrideScore : h.composite), color: displayColor }}>
                        {override?.label ? `${displayLabel} (PM)` : displayLabel} {h.composite}
                      </span>
                      {p.mode === "planning" && (
                        <span className="text-[8px] font-black px-2 py-0.5 rounded" style={{ background: u.purD, color: u.pur }}>DRAFT</span>
                      )}
                    </div>
                    {/* Row 2: name */}
                    <div className="text-sm font-bold text-foreground truncate">{p.name}</div>
                    {/* Row 3: description */}
                    {p.desc && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[400px]">{p.desc}</div>
                    )}
                  </div>

                  {/* Owner + lastUpdate */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Av user={p.owner} size={22} />
                    <div className="text-right">
                      <div className="text-xs text-secondary-foreground">{p.owner.name}</div>
                      {updateDate && <div className="text-[10px] text-muted-foreground">{updateDate}</div>}
                    </div>
                  </div>

                  {/* Health strip (manual signals) */}
                  {p.health ? (
                    <HealthStrip health={p.health} issues={p.issues} />
                  ) : (
                    /* Fallback: auto-calc traffic dots */
                    <div className="flex items-center gap-1.5 flex-shrink-0" title={Object.entries(h.dims).map(([k, v]) => `${DIM_META[k].label}: ${v}`).join(' | ')}>
                      {Object.entries(h.dims).map(([k, v]) => (
                        <div key={k} className="flex flex-col items-center gap-0.5">
                          <span className="rounded-full inline-block" style={{ width: 10, height: 10, background: healthColor(v) }} />
                          <span className="text-[7px] text-muted-foreground">{DIM_META[k].label[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="w-20 flex-shrink-0">
                    <GB pct={p.progress} h={5} color={phaseColor} />
                    <div className="text-center text-xs mt-1 text-muted-foreground">{p.progress}%</div>
                  </div>

                  {/* Comment count */}
                  <span className="text-xs flex items-center gap-1 text-muted-foreground flex-shrink-0">
                    <I name="chat" size={11} color="var(--muted-foreground)" />{commentCount}
                  </span>

                  <I name="chevR" size={14} color="var(--muted-foreground)" />
                  </>
                    );
                  })()}
                </>
              )}
            </Cd>
          );
        })}
      </div>
    </motion.div>
  );
}
