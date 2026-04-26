import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as I } from '../components/Icons';
import { PROGRAM_TYPES, SUBTYPES, PROGRAM_PHASES } from '../tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import { Cd } from '../components/ui';
import { useUsers } from '../hooks/useUsers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { Program, Comment, Milestone, MilestoneCategory, Task, HealthOverride, ProgramHealth, KeyIssue } from '../types';
import { createProgram, updateProgram as apiUpdateProgram, deleteProgram as apiDeleteProgram } from '../services/api';
import { mapProgram } from '../services/mappers';
import DescriptionInput from '../components/DescriptionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { calcHealth, healthColor, healthLabel } from '../utils/health';
import { useRBAC } from '../hooks/useRBAC';
import { emptyHealth } from '../components/Health';

interface ProgramListProps {
  prg: Program[];
  setPrg: React.Dispatch<React.SetStateAction<Program[]>>;
  go: (id: string) => void;
  com: Comment[];
  tasks?: Task[];
  healthOverrides?: Record<string, HealthOverride>;
}

const emptyMilestone = (): Milestone => ({ name: "", date: "", status: "pending", category: "product" });

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

export default function ProgramList({ prg, setPrg, go, com, tasks = [], healthOverrides = {} }: ProgramListProps) {
  const mob = useIsMobile();
  const rbac = useRBAC();
  const USERS = useUsers();
  const ME = useCurrentUser();

  const emptyForm = (): FormState => ({
    name: "",
    desc: "",
    type: "HW",
    subType: SUBTYPES["HW"]?.[0] || "",
    customSubType: "",
    currentPhase: "New",
    owner: USERS[0]?.id || ME.id,
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
  const [f, setF] = useState("All");
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [showCustomInput, setShowCustomInput] = useState(false);

  const isEditing = !!editingProgram;
  const showForm = showNew || isEditing;

  const startEdit = (p: Program) => {
    setEditingProgram(p);
    setShowNew(false);
    const knownSubs = SUBTYPES[p.type] || [];
    const isCustomSubType = !!p.subType && !knownSubs.includes(p.subType);
    setForm({
      name: p.name,
      desc: p.desc || '',
      type: p.type as FormState['type'],
      subType: isCustomSubType ? '' : (p.subType || knownSubs[0] || ''),
      customSubType: isCustomSubType ? p.subType : '',
      currentPhase: p.currentPhase as FormState['currentPhase'],
      owner: p.owner.id,
      assignedBy: p.assignedBy?.id || ME.id,
      assignedDate: p.assignedDate || '',
      deliveryAsk: p.deliveryAsk || '',
      deliveryCommit: p.deliveryCommit || '',
      team: String(p.team || ''),
      budget: p.budget || '',
      milestones: (p.milestones && p.milestones.length > 0) ? p.milestones : [emptyMilestone()],
      health: p.health || emptyHealth(),
      issues: p.issues || [],
    });
    setShowCustomInput(isCustomSubType);
  };

  const cancelForm = () => {
    setForm(emptyForm());
    setShowCustomInput(false);
    setShowNew(false);
    setEditingProgram(null);
  };

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
  const [saving, setSaving] = useState(false);
  const createPrg = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    const owner = USERS.find(u2 => u2.id === form.owner) || USERS[0] || ME;
    const ab = USERS.find(u2 => u2.id === form.assignedBy) || ME;
    const subType = showCustomInput ? form.customSubType : form.subType;
    const milestones = form.milestones.filter(m => m.name.trim());
    const mode = form.currentPhase === "New" ? "planning" : "active";

    try {
      const saved = await createProgram({
        name: form.name,
        type: form.type,
        subType,
        currentPhase: form.currentPhase,
        description: form.desc,
        assignedById: form.assignedBy,
        assignedByName: ab.name,
        assignedDate: form.assignedDate || new Date().toISOString().split("T")[0],
        deliveryAsk: form.deliveryAsk,
        deliveryCommit: form.deliveryCommit,
        budget: form.budget || "TBD",
        team: parseInt(form.team) || 0,
        mode,
        milestones,
      });
      // Use real Firestore ID from API response
      setPrg(prev => [...prev, mapProgram(saved)]);
    } catch (err) {
      console.error('Failed to create program:', err);
      alert('Failed to create program. Please try again.');
    } finally {
      setSaving(false);
    }
    cancelForm();
  };

  /* ── update program ── */
  const updatePrg = async () => {
    if (!canSubmit || !editingProgram || saving) return;
    setSaving(true);
    const owner = USERS.find(u2 => u2.id === form.owner) || USERS[0] || ME;
    const ab = USERS.find(u2 => u2.id === form.assignedBy) || ME;
    const subType = showCustomInput ? form.customSubType : form.subType;
    const milestones = form.milestones.filter(m => m.name.trim());

    // Optimistic update
    setPrg(prev => prev.map(p => p.id === editingProgram.id ? {
      ...p,
      name: form.name,
      type: form.type,
      subType,
      currentPhase: form.currentPhase,
      owner,
      assignedBy: ab,
      assignedDate: form.assignedDate || p.assignedDate,
      lastUpdate: new Date().toISOString(),
      deliveryAsk: form.deliveryAsk,
      deliveryCommit: form.deliveryCommit,
      desc: form.desc,
      team: parseInt(form.team) || 0,
      budget: form.budget || p.budget,
      milestones,
      health: form.health,
      issues: form.issues,
    } : p));

    try {
      await apiUpdateProgram(editingProgram.id, {
        name: form.name,
        type: form.type,
        subType,
        currentPhase: form.currentPhase,
        description: form.desc,
        assignedById: form.assignedBy,
        assignedByName: ab.name,
        assignedDate: form.assignedDate,
        deliveryAsk: form.deliveryAsk,
        deliveryCommit: form.deliveryCommit,
        team: parseInt(form.team) || 0,
        budget: form.budget,
        milestones,
        health: form.health,
        issues: form.issues,
      });
    } catch (err) {
      console.error('Failed to update program:', err);
      alert('Failed to save program changes. Please try again.');
    } finally {
      setSaving(false);
    }
    cancelForm();
  };

  const handleSubmit = isEditing ? updatePrg : createPrg;

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
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Programs</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse and manage your program portfolio</p>
        </div>
        {rbac.isProgramAdmin && (
          <button onClick={() => { if (showForm) cancelForm(); else setShowNew(true); }} className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer ${showForm ? 'border border-border bg-background hover:bg-muted text-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
            <I name={showForm ? "x" : "plus"} size={14} color="currentColor" />{showForm ? "Cancel" : "New Program"}
          </button>
        )}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-2 mb-5">
        <select
          value={f}
          onChange={e => setF(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer"
        >
          <option value="All">All Types</option>
          {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background shadow-xs">
          <I name="search" size={14} color="var(--muted-foreground)" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter programs…" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      {/* ═══ PROGRAM FORM (Create / Edit) ═══ */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <Cd delay={0} hover={false} className="p-4 md:p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <I name={isEditing ? "edit" : "folder"} size={16} color="var(--foreground)" />
              <span className="text-sm font-semibold text-foreground">{isEditing ? 'Edit Program' : 'Create New Program'}</span>
              {isEditing && <span className="text-xs text-muted-foreground">— {editingProgram?.name}</span>}
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
                <DescriptionInput value={form.desc} onChange={v => upd({ desc: v })} placeholder="Add program description…" label="Program Description" />
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
                    <div className="flex items-center gap-1.5">
                      <input value={form.customSubType} onChange={e => upd({ customSubType: e.target.value })}
                        placeholder="Custom sub-type…" className={inp} />
                      <button type="button"
                        onClick={() => {
                          setShowCustomInput(false);
                          upd({ subType: SUBTYPES[form.type]?.[0] || "", customSubType: "" });
                        }}
                        title="Back to preset list"
                        className="inline-flex items-center justify-center h-9 w-9 flex-shrink-0 rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
                        <I name="x" size={14} color="currentColor" />
                      </button>
                    </div>
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

              {/* Row 5: Delivery ASK | Delivery Commit */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className={lbl}>Delivery Date (ASK)</label>
                  <input type="date" value={form.deliveryAsk} onChange={e => upd({ deliveryAsk: e.target.value })} className={inp} />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className={lbl}>Delivery Commit</label>
                  <input type="date" value={form.deliveryCommit} onChange={e => upd({ deliveryCommit: e.target.value })} className={inp} />
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
                      <select value={ms.category || 'product'} onChange={e => setMilestone(idx, { category: e.target.value as MilestoneCategory })}
                        className={inp} style={{ width: 145 }}>
                        <option value="product">Product</option>
                        <option value="execution">Execution</option>
                        <option value="ttm">Time to Market</option>
                      </select>
                      <input type="date" value={ms.date} onChange={e => setMilestone(idx, { date: e.target.value })}
                        className={inp} style={{ width: 150 }} />
                      <select value={ms.owner || ''} onChange={e => setMilestone(idx, { owner: e.target.value })}
                        className={inp} style={{ width: 140 }}>
                        <option value="">Owner…</option>
                        {USERS.map(u2 => <option key={u2.id} value={u2.name.split(' ').pop() || u2.name}>{u2.name}</option>)}
                      </select>
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

              {/* Row 7: Cancel + Submit */}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={cancelForm}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer">
                  Cancel
                </button>
                <button disabled={!canSubmit || saving} onClick={handleSubmit}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
                  <I name={isEditing ? "check" : "plus"} size={12} color="currentColor" />{saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </div>
          </Cd>
        </motion.div>
      )}</AnimatePresence>

      {/* ═══ PROGRAMS TABLE — shadcn style ═══ */}
      <ProgramTable list={list} go={go} tasks={tasks} healthOverrides={healthOverrides} setPrg={setPrg} onEdit={startEdit} />
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/* Shadcn-style Programs Table                                   */
/* ────────────────────────────────────────────────────────────── */
function ProgramTable({ list, go, tasks, healthOverrides, setPrg, onEdit }: {
  list: Program[];
  go: (id: string) => void;
  tasks: Task[];
  healthOverrides: Record<string, HealthOverride>;
  setPrg: React.Dispatch<React.SetStateAction<Program[]>>;
  onEdit: (p: Program) => void;
}) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const deleteProgram = async (id: string) => {
    let removed: Program | undefined;
    setPrg(prev => {
      removed = prev.find(p => p.id === id);
      return prev.filter(p => p.id !== id);
    });
    try {
      await apiDeleteProgram(id);
    } catch (err) {
      console.error('Failed to delete program:', err);
      if (removed) setPrg(prev => [...prev, removed!]);
    }
    setDeleteTarget(null);
    setMenuOpen(null);
  };

  const menuItem = "w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2";

  return (
    <div className="rounded-md border border-border overflow-visible">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Program</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-28 hidden md:table-cell">Type</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-28 hidden md:table-cell">Phase</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-36 hidden lg:table-cell">Owner</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-28">Status</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-20">Health</th>
            <th className="w-14 px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-10 text-sm text-muted-foreground">No programs found</td></tr>
          ) : list.map(p => {
            const h = calcHealth(p, tasks);
            const comp = h.composite;
            const label = h.label;
            const isMenuOpen = menuOpen === p.id;

            return (
              <tr key={p.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => go(p.id)}
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-foreground truncate max-w-xs">{p.name}</div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">{p.type}{p.subType ? ` · ${p.subType}` : ''}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">{p.currentPhase}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm text-foreground truncate max-w-[140px] inline-block">{p.owner.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ color: h.color, background: comp < 60 ? 'rgba(248,113,113,0.1)' : comp < 75 ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${h.color}33` }}>
                    {label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold tabular-nums" style={{ color: comp < 60 ? '#F87171' : h.color }}>{comp}</span>
                </td>
                <td className="px-4 py-3 text-right relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpen(isMenuOpen ? null : p.id)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors cursor-pointer bg-transparent border-none"
                    aria-label="Open actions menu"
                  >
                    <I name="more" size={16} color="var(--muted-foreground)" />
                  </button>
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-full mt-1 w-44 bg-popover border border-border rounded-md shadow-md z-50 py-1"
                      style={{ background: 'var(--popover, var(--card))' }}
                    >
                      <button onClick={() => { onEdit(p); setMenuOpen(null); }} className={menuItem}>
                        <I name="edit" size={14} color="var(--muted-foreground)" />
                        Edit
                      </button>
                      <button onClick={() => { go(p.id); setMenuOpen(null); }} className={menuItem}>
                        <I name="folder" size={14} color="var(--muted-foreground)" />
                        View details
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button
                        onClick={() => { setDeleteTarget({ id: p.id, name: p.name }); setMenuOpen(null); }}
                        className={`${menuItem} text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30`}
                        style={{ color: '#dc2626' }}
                      >
                        <I name="trash" size={14} color="#dc2626" />
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Program"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated tasks, comments, and documents will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete Program"
        onConfirm={() => deleteTarget && deleteProgram(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
