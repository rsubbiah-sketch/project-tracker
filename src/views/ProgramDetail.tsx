import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as I } from '../components/Icons';
import { u, g, ST, SIG, accent, accentText } from '../tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import { Av, SB, TB, PB, GB, Cd } from '../components/ui';
import { useUsers } from '../hooks/useUsers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useProgramRole } from '../hooks/useProgramRole';
import type { Program, Comment, Reply, Task, Doc } from '../types';
import Comments from './Comments';
import { HealthCard, emptyHealth } from '../components/Health';
import { createTask as apiCreateTask, updateTask as apiUpdateTask, createDocument as apiCreateDocument, deleteDocument as apiDeleteDocument, updateProgram as apiUpdateProgram } from '../services/api';
import { mapTask } from '../services/mappers';
import { calcHealth, healthColor, healthLabel, healthBg, milestoneColor, DIM_META, HEALTH_WEIGHTS } from '../utils/health';
import CreateTaskDialog from '../components/CreateTaskDialog';
import TaskTable from '../components/TaskTable';
import MilestoneTimeline from '../components/MilestoneTimeline';
import TimelineView from './TimelineView';
import { HealthLegend, CategoryBadge } from '../components/HealthLegend';

function MilestoneScoreInput({ initial, onCommit }: { initial: number | undefined; onCommit: (n: number | undefined) => void }) {
  const [val, setVal] = useState(initial != null ? String(initial) : '');
  const parsed = val.trim() === '' ? undefined : Math.max(0, Math.min(100, parseInt(val) || 0));
  const color = milestoneColor(parsed);
  return (
    <input
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => onCommit(parsed)}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      placeholder="0–100"
      className="w-16 px-2 py-1.5 rounded text-sm text-center font-bold outline-none border border-border bg-background"
      style={{ color }}
      inputMode="numeric"
      pattern="[0-9]*"
    />
  );
}

interface ProgramDetailProps {
  p: Program | undefined;
  setPrg: React.Dispatch<React.SetStateAction<Program[]>>;
  com: Comment[];
  setCom: React.Dispatch<React.SetStateAction<Comment[]>>;
  rep: Reply[];
  setRep: React.Dispatch<React.SetStateAction<Reply[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  docs: Doc[];
  setDocs: React.Dispatch<React.SetStateAction<Doc[]>>;
  back: () => void;
}

const DOC_META: Record<Doc["type"], { icon: string; color: string; label: string }> = {
  sheet: { icon: "sheet", color: "#34A853", label: "Sheet" },
  doc:   { icon: "file",  color: "#4285F4", label: "Doc" },
  slides:{ icon: "external", color: "#FBBC04", label: "Slides" },
  pdf:   { icon: "file",  color: "#F87171", label: "PDF" },
  link:  { icon: "link",  color: "var(--muted-foreground)", label: "Link" },
};

/* ═══ DRAGGABLE TIMELINE COMPONENT ═══ */
function DraggableTimeline({ phases, currentIndex, milestones, canEdit, onUpdate }: {
  phases: string[];
  currentIndex: number;
  milestones: { name: string; date: string; status: string }[];
  canEdit: boolean;
  onUpdate: (newIndex: number) => void;
}) {
  const [todayIndex, setTodayIndex] = useState(currentIndex);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStartIndex = useRef(todayIndex);

  // Sync if parent changes currentIndex
  useEffect(() => { setTodayIndex(currentIndex); }, [currentIndex]);

  const getClosestIndex = useCallback((clientX: number) => {
    let closest = 0, minDist = Infinity;
    nodeRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(clientX - center);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    return closest;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    dragStartIndex.current = todayIndex;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [canEdit, todayIndex]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragging) return;
    setTodayIndex(getClosestIndex(e.clientX));
  }, [dragging, getClosestIndex]);

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    setTodayIndex(current => {
      if (current !== dragStartIndex.current) onUpdate(current);
      return current;
    });
  }, [dragging, onUpdate]);

  // Attach window-level listeners while dragging for smooth tracking
  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragging, handlePointerMove, handlePointerUp]);

  const progressPct = phases.length > 1 ? (todayIndex / (phases.length - 1)) * 100 : 0;

  return (
    <div className="mb-6 select-none" ref={trackRef}>
      {!canEdit && (
        <div className="text-xs text-muted-foreground mb-2 italic">read-only — only admin &amp; editor can edit</div>
      )}

      <div className="relative" style={{ padding: '0 20px' }}>
        {/* "Today" floating label */}
        <div className="flex flex-col items-center absolute -top-6 transition-all duration-200 ease-out pointer-events-none"
          style={{ left: `${progressPct}%`, transform: 'translateX(-50%)' }}>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today</span>
          <svg width="10" height="6" viewBox="0 0 10 6" className="mt-0.5">
            <polygon points="5,6 0,0 10,0" fill="var(--muted-foreground)" />
          </svg>
        </div>

        {/* Track line (background) */}
        <div className="absolute left-5 right-5 h-[3px] rounded-full bg-border" style={{ top: 20 }} />
        {/* Track line (filled / completed) */}
        <div className="absolute left-5 h-[3px] rounded-full transition-all duration-200 ease-out"
          style={{ top: 20, width: `calc(${progressPct}% - ${progressPct > 0 ? 0 : 20}px)`, background: '#3B82F6', maxWidth: 'calc(100% - 40px)' }} />

        {/* Phase nodes */}
        <div className="relative flex justify-between" style={{ paddingTop: 8 }}>
          {phases.map((ph, i) => {
            const isCompleted = i < todayIndex;
            const isCurrent = i === todayIndex;
            const isFuture = i > todayIndex;
            const msForPhase = milestones.find(m => m.name.toLowerCase().includes(ph.toLowerCase().slice(0, 4)));

            return (
              <div key={i} className="flex flex-col items-center" style={{ flex: 1 }}
                ref={el => { nodeRefs.current[i] = el; }}>
                {/* Circle */}
                <div
                  onPointerDown={isCurrent ? handlePointerDown : undefined}
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center relative z-10
                    border-2 transition-all duration-200 ease-out
                    ${isCompleted
                      ? 'bg-[#3B82F6] border-[#3B82F6]'
                      : isCurrent && canEdit
                        ? 'bg-background border-[#3B82F6] shadow-lg cursor-grab active:cursor-grabbing ring-4 ring-blue-500/20'
                        : isCurrent
                          ? 'bg-background border-[#3B82F6] shadow-md'
                          : 'bg-background border-border'
                    }
                  `}
                  style={{ touchAction: 'none' }}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-border" />
                  )}
                </div>

                {/* Label */}
                <span className={`
                  mt-2 text-xs font-bold text-center whitespace-nowrap
                  ${isCompleted ? 'text-[#3B82F6]' : isCurrent ? 'text-foreground font-extrabold' : 'text-muted-foreground'}
                `}>
                  {ph}
                </span>

                {/* Milestone date */}
                {msForPhase?.date && (
                  <div className={`text-xs mt-0.5 ${isCurrent ? 'font-bold text-[#3B82F6]' : 'text-muted-foreground'}`}>
                    {new Date(msForPhase.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {canEdit && (
        <div className="mt-2 text-xs text-muted-foreground text-center italic">
          Drag the highlighted circle to move current phase
        </div>
      )}
    </div>
  );
}

export default function ProgramDetail({ p, setPrg, com, setCom, rep, setRep, tasks, setTasks, docs, setDocs, back }: ProgramDetailProps) {
  const ME = useCurrentUser();
  const USERS = useUsers();
  const mob=useIsMobile();
  const pRole = useProgramRole(p?.id);
  if(!p)return null;
  const prgTasks=tasks.filter(t=>t.prgId===p.id);
  const[showNewTask,setShowNewTask]=useState(false);
  const[expandedTask,setExpandedTask]=useState<string|null>(null);
  const[editingTask,setEditingTask]=useState<any>(null);
  // insertAt: -1 = hidden, >= 0 = insert after that index, Infinity = append at end
  const[insertAt,setInsertAt]=useState<number>(-1);
  const[newMsForm,setNewMsForm]=useState({name:'',date:'',owner:'',keyIssue:'',tech:'G' as 'G'|'A'|'R',exec:'G' as 'G'|'A'|'R',ttm:'G' as 'G'|'A'|'R',category:'product' as 'product'|'execution'|'ttm'});
  const resetAddForm = () => { setInsertAt(-1); setNewMsForm({ name: '', date: '', owner: '', keyIssue: '', tech: 'G', exec: 'G', ttm: 'G', category: 'product' }); };
  const[detailTab,setDetailTab]=useState<"overview"|"milestones"|"timeline">("overview");
  const[msMenuOpen,setMsMenuOpen]=useState<number|null>(null);
  const[msEditing,setMsEditing]=useState<number|null>(null);
  const[ctxMenu,setCtxMenu]=useState<{x:number;y:number;idx:number}|null>(null);
  // Snapshot of milestones before editing — used for "previous value" display and reset
  const[msSnapshot,setMsSnapshot]=useState<typeof p.milestones|null>(null);
  // Take snapshot when milestones tab is opened (so Reset is always available)
  useEffect(() => {
    if (detailTab === 'milestones' && msSnapshot === null) {
      setMsSnapshot(JSON.parse(JSON.stringify(p.milestones || [])));
    }
    if (detailTab !== 'milestones') {
      setMsSnapshot(null);
      setMsEditing(null);
    }
  }, [detailTab]);
  const startEditing = (idx: number) => {
    if (msSnapshot === null) setMsSnapshot(JSON.parse(JSON.stringify(p.milestones || [])));
    setMsEditing(idx);
  };
  const resetMilestone = (idx: number) => {
    if (!msSnapshot || !msSnapshot[idx]) return;
    const orig = msSnapshot[idx];
    savePrg(pr => ({ ...pr, milestones: (pr.milestones || []).map((m, j) => j === idx ? { ...orig } : m), lastUpdate: new Date().toISOString() }));
    setMsEditing(null);
  };
  const resetAllMilestones = () => {
    if (!msSnapshot) return;
    savePrg(pr => ({ ...pr, milestones: JSON.parse(JSON.stringify(msSnapshot)), lastUpdate: new Date().toISOString() }));
    setMsSnapshot(null);
    setMsEditing(null);
  };
  const msMenuRef=useRef<HTMLDivElement|null>(null);
  const ctxMenuRef=useRef<HTMLDivElement|null>(null);

  // Close milestone menus on outside click
  useEffect(()=>{
    const h=(e:MouseEvent)=>{
      if(msMenuRef.current&&!msMenuRef.current.contains(e.target as Node))setMsMenuOpen(null);
      if(ctxMenuRef.current&&!ctxMenuRef.current.contains(e.target as Node))setCtxMenu(null);
    };
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  /* ═══ PERSIST PROGRAM CHANGES ═══ */
  const savePrg = (updater: (pr: Program) => Program) => {
    setPrg(prev => prev.map(pr => {
      if (pr.id !== p.id) return pr;
      const updated = updater(pr);
      const diff: Record<string, any> = {};
      for (const k of ['milestones', 'health', 'issues', 'progress', 'description', 'deliveryAsk', 'deliveryCommit', 'name', 'mode', 'lastUpdate', 'team', 'budget', 'spark'] as const) {
        if ((updated as any)[k] !== (pr as any)[k]) diff[k] = (updated as any)[k];
      }
      if (Object.keys(diff).length) {
        apiUpdateProgram(p.id, diff).catch(err => {
          console.error('Failed to save program changes:', err);
        });
      }
      return updated;
    }));
  };

  /* ═══ OWNERSHIP FLAGS ═══ */
  const isProgramOwner = ME.id === p.owner.id || ME.name === p.owner.name || pRole.isAdmin;

  const h = calcHealth(p, tasks);
  const w = HEALTH_WEIGHTS[p.type] || HEALTH_WEIGHTS.HW;

  return(<motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
    <div id="program-tabs" className="sticky top-0 z-20 flex items-center gap-4 mb-4 flex-wrap py-3 -mx-4 px-4 md:-mx-6 md:px-6 backdrop-blur-xl" style={{ background: 'hsl(var(--background) / 0.85)' }}>
      <button onClick={back} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium border border-border bg-background hover:bg-muted hover:text-foreground transition-colors cursor-pointer"><I name="back" size={14} color="currentColor"/>Back</button>
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground overflow-x-auto">
        {([
          {id:"overview" as const,label:"Overview",icon:"folder"},
          {id:"milestones" as const,label:"Milestones",icon:"flag"},
          {id:"timeline" as const,label:"NPI Timeline",icon:"calendar"},
        ]).map(tab=>{
          const active=detailTab===tab.id;
          const count = tab.id==="milestones"?(p.milestones||[]).length : 0;
          return(
            <button key={tab.id} onClick={()=>{ setDetailTab(tab.id); document.getElementById('program-tabs')?.scrollIntoView({ behavior: 'smooth' }); }}
              data-state={active?'active':'inactive'}
              className={`inline-flex items-center justify-center gap-1.5 h-[calc(100%-1px)] px-3 rounded-md border border-transparent text-sm font-medium cursor-pointer whitespace-nowrap flex-shrink-0 transition-[color,background-color,box-shadow] ${active?'bg-background text-foreground shadow-sm':'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
              <I name={tab.icon} size={12} color="currentColor"/>{tab.label}
              {count>0&&<span className={`ml-0.5 inline-flex items-center justify-center rounded-md px-1.5 text-xs font-semibold ${active?'bg-muted text-foreground':'bg-muted-foreground/20 text-muted-foreground'}`}>{count}</span>}
            </button>
          );
        })}
      </div>
    </div>

    {detailTab==="timeline" && <TimelineView p={p} />}

    {detailTab==="overview" && <>
    {/* ═══ HEALTH SUMMARY BAR ═══ */}
    <div className={`grid ${mob ? 'grid-cols-2' : 'grid-cols-5'} gap-4 mb-5`}>
      {/* Health Score */}
      <Cd delay={0} hover={false} className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Health</span>
          <I name="activity" size={16} color="var(--muted-foreground)" />
        </div>
        <div className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: h.composite < 60 ? '#F87171' : h.color }}>{h.composite}</div>
        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: healthBg(h.composite), color: h.composite < 60 ? '#F87171' : h.color, border: `1px solid ${h.composite < 60 ? '#F8717133' : h.color + '33'}` }}>
          {h.label}
        </span>
      </Cd>
      {/* Dimension scores */}
      {Object.entries(h.dims).map(([key, val]) => {
        const meta = DIM_META[key]; const c = val < 60 ? '#F87171' : healthColor(val);
        return (
          <Cd key={key} delay={0.04} hover={false} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{meta.label}</span>
              <I name={meta.icon} size={16} color="var(--muted-foreground)" />
            </div>
            <div className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: c }}>{val}</div>
            <span className="text-xs text-muted-foreground mt-1">{healthLabel(val)}</span>
          </Cd>
        );
      })}
      {/* Last Updated */}
      <Cd delay={0.12} hover={false} className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
          <I name="calendar" size={16} color="var(--muted-foreground)" />
        </div>
        <div className="text-lg font-bold tracking-tight text-foreground">
          {p.lastUpdate ? new Date(p.lastUpdate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {p.lastUpdate ? new Date(p.lastUpdate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
        </span>
      </Cd>
    </div>

    {/* ═══ PROGRAM INFO ═══ */}
    <div className={`flex ${mob ? 'flex-col' : 'flex-row'} gap-5 mb-5`}>
      <Cd delay={0.05} hover={false} className="p-5 md:p-6 flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-4">{p.type} program | milestone-led executive dashboard</p>
        <div className="mt-1 pt-3 border-t border-border">
          {(() => {
            const fmtD = (d: string) => d ? new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
            type InfoItem = { l: string; v: string; color?: string; bg?: string };
            const items: InfoItem[] = [
              { l: "Owner", v: p.owner.name },
              { l: "Phase", v: p.currentPhase || '—' },
              { l: "Delivery ASK", v: fmtD(p.deliveryAsk) },
              { l: "Delivery Commit", v: fmtD(p.deliveryCommit) },
              { l: "Progress", v: `${p.progress}%` },
            ];
            return (
              <div className={`flex ${mob ? 'flex-col gap-3' : 'flex-row flex-wrap items-center gap-6'}`}>
                {items.map((d, i) => (
                  <div key={i} className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground">{d.l}</span>
                    <span className="text-sm font-semibold text-foreground truncate">{d.v}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        {/* Alerts */}
        {h.alerts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border space-y-1.5">
            {h.alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <I name="alert" size={12} color="#F87171" />
                <span className="text-muted-foreground">{a}</span>
              </div>
            ))}
          </div>
        )}
      </Cd>
    </div>

    {/* ═══ MILESTONE TIMELINE ═══ */}
    <Cd delay={0.1} hover={false} className="p-5 md:p-6 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Key Milestones</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{(p.milestones || []).length} milestones — chronological view</p>
        </div>
        <button
          onClick={() => setDetailTab('milestones')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
        >
          View all →
        </button>
      </div>
      <MilestoneTimeline
        milestones={p.milestones || []}
        onItemClick={() => setDetailTab('milestones')}
      />
    </Cd>

    {/* ═══ TASKS in Overview (with inline comments) ═══ */}
    <Cd delay={0.15} hover={false} className="p-5 md:p-6 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Tasks</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{prgTasks.length} tasks for this program</p>
        </div>
        <button onClick={() => setShowNewTask(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
          <I name="plus" size={12} color="currentColor" />New Task
        </button>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showNewTask}
        onClose={() => setShowNewTask(false)}
        onSubmit={async (d) => {
          try {
            const saved = await apiCreateTask({ title: d.title, programId: p.id, assigneeId: d.assignee, priority: d.priority, status: d.status, dueDate: d.due, description: d.desc });
            setTasks(prev => [...prev, mapTask(saved)]);
          } catch (err) {
            console.error('Failed to create task:', err);
            alert('Failed to create task. Please try again.');
          }
        }}
        defaultProgramId={p.id}
        hideProgramField={true}
        currentUser={ME}
      />

      {/* Edit Task Dialog */}
      <CreateTaskDialog
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={async (d) => {
          if (!editingTask) return;
          const assignee = d.assignee === ME.id ? ME : (USERS.find(u2 => u2.id === d.assignee) || ME);
          setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, title: d.title, assignee, priority: d.priority, status: d.status, due: d.due, desc: d.desc } : t));
          try {
            await apiUpdateTask(editingTask.id, { title: d.title, assigneeId: d.assignee, priority: d.priority, status: d.status, dueDate: d.due, description: d.desc });
          } catch (err) {
            console.error('Failed to update task:', err);
          }
        }}
        initialTask={editingTask}
        defaultProgramId={p.id}
        hideProgramField={true}
        currentUser={ME}
      />

      <TaskTable
        tasks={prgTasks}
        setTasks={setTasks}
        onEdit={(tk) => setEditingTask(tk)}
        expandedId={expandedTask}
        onRowClick={(id) => setExpandedTask(expandedTask === id ? null : id)}
        renderExpanded={(tk) => (
          <div className="p-4 md:p-5 space-y-3">
            <Comments eId={tk.id} com={com} setCom={setCom} rep={rep} setRep={setRep} />
          </div>
        )}
      />
    </Cd>

    {/* ═══ DOCUMENTS in Overview ═══ */}
    <DocumentsSection p={p} docs={docs} setDocs={setDocs} ME={ME}/>
    </>}

    {/* ═══ FULL-WIDTH MILESTONE TABLE — shadcn style ═══ */}
    {detailTab==="milestones" && <Cd delay={0.05} hover={false} className="p-4 md:p-5 mb-5" id="milestone-table">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-foreground">Critical milestones</div>
        <div className="flex items-center gap-2">
          {msSnapshot && JSON.stringify(msSnapshot) !== JSON.stringify(p.milestones) && (
            <button onClick={resetAllMilestones}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer">
              <I name="x" size={12} color="currentColor" />Reset All
            </button>
          )}
          {isProgramOwner && (
            <button onClick={() => setInsertAt(Infinity)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
              <I name="plus" size={12} color="currentColor" />Add milestone
            </button>
          )}
        </div>
      </div>
      <HealthLegend milestones={p.milestones || []} />

      {/* Right-click context menu */}
      {ctxMenu && (() => {
        const idx = ctxMenu.idx;
        const ms = (p.milestones || [])[idx];
        if (!ms) return null;
        const done = ms.status === 'done';
        const menuItem = "w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2";
        return (
          <div ref={ctxMenuRef} className="fixed w-48 bg-popover border border-border rounded-md shadow-md z-[100] py-1"
            style={{ top: ctxMenu.y, left: ctxMenu.x, background: 'var(--popover, var(--card))' }}>
            <button onClick={() => { startEditing(idx); setCtxMenu(null); }} className={menuItem}>
              <I name="edit" size={14} color="var(--muted-foreground)" /> Edit
            </button>
            <button onClick={() => {
              const newStatus = done ? 'pending' : 'done';
              savePrg(pr => ({ ...pr, milestones: (pr.milestones || []).map((m, j) => j === idx ? { ...m, status: newStatus } : m), lastUpdate: new Date().toISOString() }));
              setCtxMenu(null);
            }} className={menuItem}>
              <I name="check" size={14} color="var(--muted-foreground)" /> {done ? 'Mark Pending' : 'Mark Done'}
            </button>
            {msSnapshot && msSnapshot[idx] && JSON.stringify(msSnapshot[idx]) !== JSON.stringify(ms) && (
              <button onClick={() => { resetMilestone(idx); setCtxMenu(null); }} className={menuItem}>
                <I name="x" size={14} color="var(--muted-foreground)" /> Reset to Original
              </button>
            )}
            {isProgramOwner && <>
              <button onClick={() => { setInsertAt(idx); setCtxMenu(null); }} className={menuItem}>
                <I name="plus" size={14} color="var(--muted-foreground)" /> Insert Below
              </button>
              <div className="h-px bg-border my-1" />
              <button onClick={() => {
                savePrg(pr => ({ ...pr, milestones: (pr.milestones || []).filter((_, j) => j !== idx), lastUpdate: new Date().toISOString() }));
                setCtxMenu(null); setMsEditing(null);
              }} className={`${menuItem} hover:!bg-red-50 dark:hover:!bg-red-950/30`} style={{ color: '#dc2626' }}>
                <I name="trash" size={14} color="#dc2626" /> Delete
              </button>
            </>}
          </div>
        );
      })()}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Milestone</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground w-24">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground w-28">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground w-28">Owner</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground w-16" title="Health score (0-100)">Score</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Key Issue</th>
              <th className="w-14 px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(p.milestones || []).length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-sm text-muted-foreground">No milestones</td></tr>
            ) : (p.milestones || []).map((ms, i) => {
              const now = new Date();
              const msDate = ms.date ? new Date(ms.date) : null;
              const done = ms.status === 'done';
              const overdue = !done && msDate && msDate < now;
              const meLastName = ME.name.split(' ').pop()?.toLowerCase() || '';
              const meFirstName = ME.name.split(' ')[0]?.toLowerCase() || '';
              const msOwnerLower = (ms.owner || '').toLowerCase();
              const isMsOwner = ms.owner && (msOwnerLower === meLastName || msOwnerLower === meFirstName || msOwnerLower === ME.name.toLowerCase() || msOwnerLower === ME.av.toLowerCase());
              const canEdit = isProgramOwner || !!isMsOwner;
              const isEditing = msEditing === i;
              const scoreC = done ? '#34D399' : milestoneColor(ms.score);
              const cellInp = "w-full px-2 py-1.5 rounded-md text-sm bg-background border border-border text-foreground outline-none focus:border-primary";
              const patch = (field: string, value: any) => savePrg(pr => ({ ...pr, milestones: (pr.milestones || []).map((m, j) => j === i ? { ...m, [field]: value } : m), lastUpdate: new Date().toISOString() }));
              const isMenuOpen = msMenuOpen === i;

              return (<React.Fragment key={i}>
                <tr className={`border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${overdue ? 'bg-destructive/5' : ''}`}
                  onContextMenu={e => { if (canEdit) { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, idx: i }); setMsMenuOpen(null); } }}>
                  {/* Milestone name */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input defaultValue={ms.name} onBlur={e => { if (e.target.value.trim()) patch('name', e.target.value.trim()); }}
                        className={`${cellInp} font-medium`} autoFocus />
                    ) : (
                      <div className="flex items-center gap-2">
                        {done && <I name="check" size={14} color="#34D399" />}
                        <span className={`text-sm font-medium ${done ? 'text-muted-foreground' : overdue ? 'text-destructive' : 'text-foreground'}`}>{ms.name}</span>
                      </div>
                    )}
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select value={ms.category || 'product'} onChange={e => patch('category', e.target.value)} className={cellInp}>
                        <option value="product">Product</option>
                        <option value="execution">Execution</option>
                        <option value="ttm">TTM</option>
                      </select>
                    ) : (
                      <CategoryBadge category={ms.category} />
                    )}
                  </td>
                  {/* Date */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input type="date" defaultValue={ms.date} onBlur={e => patch('date', e.target.value)} className={cellInp} />
                    ) : (
                      <span className={`text-sm ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {ms.date ? new Date(ms.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    )}
                  </td>
                  {/* Owner */}
                  <td className="px-4 py-3">
                    {isEditing && isProgramOwner ? (
                      <select value={ms.owner || ''} onChange={e => patch('owner', e.target.value)} className={cellInp}>
                        <option value="">—</option>
                        {USERS.map(u2 => <option key={u2.id} value={u2.name.split(' ').pop() || u2.name}>{u2.name}</option>)}
                      </select>
                    ) : (
                      <span className="text-sm text-foreground">{ms.owner || '—'}</span>
                    )}
                  </td>
                  {/* Score */}
                  <td className="px-4 py-3 text-center">
                    {isEditing && !done ? (() => {
                      const prevScore = msSnapshot?.[i]?.score;
                      const changed = prevScore != null && ms.score !== prevScore;
                      return (
                        <div className="flex flex-col items-center gap-0.5">
                          <MilestoneScoreInput
                            key={`score-${i}-${msEditing}`}
                            initial={ms.score}
                            onCommit={(n) => patch('score', n)}
                          />
                          {prevScore != null && (
                            <span className={`text-xs ${changed ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
                              title="Previous value">
                              was {prevScore}
                            </span>
                          )}
                        </div>
                      );
                    })() : (
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: scoreC }} />
                        {ms.score != null && <span className="text-sm font-semibold" style={{ color: scoreC }}>{ms.score}</span>}
                      </span>
                    )}
                  </td>
                  {/* Key issue */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input defaultValue={ms.keyIssue || ''} placeholder="Key issue…" onBlur={e => patch('keyIssue', e.target.value)} className={`${cellInp}`} />
                    ) : (
                      <span className="text-sm text-muted-foreground">{ms.keyIssue || (overdue ? `${Math.floor((now.getTime() - msDate!.getTime()) / 86400000)}d overdue` : '')}</span>
                    )}
                  </td>
                  {/* Actions — 3-dot menu */}
                  <td className="px-4 py-3 text-right relative">
                    {canEdit && (
                      <>
                        <button onClick={() => { setMsMenuOpen(isMenuOpen ? null : i); setCtxMenu(null); }}
                          className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors cursor-pointer bg-transparent border-none"
                          aria-label="Milestone actions">
                          <I name="more" size={16} color="var(--muted-foreground)" />
                        </button>
                        {isMenuOpen && (
                          <div ref={msMenuRef}
                            className="absolute right-2 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-md z-50 py-1"
                            style={{ background: 'var(--popover, var(--card))' }}>
                            <button onClick={() => { if (isEditing) setMsEditing(null); else startEditing(i); setMsMenuOpen(null); }}
                              className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2">
                              <I name="edit" size={14} color="var(--muted-foreground)" /> {isEditing ? 'Stop Editing' : 'Edit'}
                            </button>
                            <button onClick={() => { patch('status', done ? 'pending' : 'done'); setMsMenuOpen(null); }}
                              className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2">
                              <I name="check" size={14} color="var(--muted-foreground)" /> {done ? 'Mark Pending' : 'Mark Done'}
                            </button>
                            {msSnapshot && msSnapshot[i] && JSON.stringify(msSnapshot[i]) !== JSON.stringify(ms) && (
                              <button onClick={() => { resetMilestone(i); setMsMenuOpen(null); }}
                                className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2">
                                <I name="x" size={14} color="var(--muted-foreground)" /> Reset to Original
                              </button>
                            )}
                            {isProgramOwner && <>
                              <button onClick={() => { setInsertAt(i); setMsMenuOpen(null); }}
                                className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2">
                                <I name="plus" size={14} color="var(--muted-foreground)" /> Insert Below
                              </button>
                              <div className="h-px bg-border my-1" />
                              <button onClick={() => {
                                savePrg(pr => ({ ...pr, milestones: (pr.milestones || []).filter((_, j) => j !== i), lastUpdate: new Date().toISOString() }));
                                setMsMenuOpen(null); setMsEditing(null);
                              }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2"
                                style={{ color: '#dc2626' }}>
                                <I name="trash" size={14} color="#dc2626" /> Delete
                              </button>
                            </>}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
                {/* Inline insert row */}
                {insertAt === i && (() => {
                  const inp = "w-full px-3 py-2 rounded-md text-sm bg-background border border-border text-foreground outline-none";
                  const saveMs = () => {
                    if (!newMsForm.name) return;
                    const newMs = { name: newMsForm.name, date: newMsForm.date, status: 'pending' as const, owner: newMsForm.owner, keyIssue: newMsForm.keyIssue, category: newMsForm.category as any, score: newMsForm.tech ? parseInt(String(newMsForm.tech)) || undefined : undefined };
                    savePrg(pr => { const ms = [...(pr.milestones || [])]; ms.splice(i + 1, 0, newMs); return { ...pr, milestones: ms, lastUpdate: new Date().toISOString() }; });
                    resetAddForm();
                  };
                  return (
                    <tr key={`insert-${i}`} className="border-b border-border bg-blue-50/30 dark:bg-blue-950/10">
                      <td className="px-4 py-2"><input value={newMsForm.name} onChange={e => setNewMsForm(f => ({ ...f, name: e.target.value }))} placeholder="Milestone name…" className={inp} autoFocus /></td>
                      <td className="px-4 py-2"><select value={newMsForm.category} onChange={e => setNewMsForm(f => ({ ...f, category: e.target.value as any }))} className={inp}><option value="product">Product</option><option value="execution">Execution</option><option value="ttm">TTM</option></select></td>
                      <td className="px-4 py-2"><input type="date" value={newMsForm.date} onChange={e => setNewMsForm(f => ({ ...f, date: e.target.value }))} className={inp} /></td>
                      <td className="px-4 py-2"><select value={newMsForm.owner} onChange={e => setNewMsForm(f => ({ ...f, owner: e.target.value }))} className={inp}><option value="">Owner…</option>{USERS.map(u2 => <option key={u2.id} value={u2.name.split(' ').pop() || u2.name}>{u2.name}</option>)}</select></td>
                      <td className="px-4 py-2 text-center"><input type="number" min={0} max={100} value={newMsForm.tech || ''} placeholder="—" onChange={e => setNewMsForm(f => ({ ...f, tech: e.target.value as any }))} className="w-14 px-1 py-1.5 rounded text-sm text-center font-bold outline-none border border-border bg-background text-foreground" /></td>
                      <td className="px-4 py-2" colSpan={2}><div className="flex items-center gap-2">
                        <input value={newMsForm.keyIssue} onChange={e => setNewMsForm(f => ({ ...f, keyIssue: e.target.value }))} placeholder="Key issue…" className={`${inp} flex-1`} onKeyDown={e => { if (e.key === 'Enter') saveMs(); }} />
                        <button onClick={saveMs} disabled={!newMsForm.name} className="inline-flex items-center gap-1 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"><I name="check" size={12} color="currentColor" />Save</button>
                        <button onClick={resetAddForm} className="inline-flex items-center h-8 px-3 rounded-md text-sm font-medium border border-border bg-background hover:bg-muted text-foreground cursor-pointer">Cancel</button>
                      </div></td>
                    </tr>
                  );
                })()}
              </React.Fragment>);
            })}
            {/* Add row at end */}
            {insertAt >= 0 && insertAt === Infinity && (() => {
              const inp = "w-full px-3 py-2 rounded-md text-sm bg-background border border-border text-foreground outline-none";
              const saveMs = () => {
                if (!newMsForm.name) return;
                const newMs = { name: newMsForm.name, date: newMsForm.date, status: 'pending' as const, owner: newMsForm.owner, keyIssue: newMsForm.keyIssue, category: newMsForm.category as any, score: newMsForm.tech ? parseInt(String(newMsForm.tech)) || undefined : undefined };
                savePrg(pr => ({ ...pr, milestones: [...(pr.milestones || []), newMs], lastUpdate: new Date().toISOString() }));
                resetAddForm();
              };
              return (
                <tr className="border-b border-border bg-blue-50/30 dark:bg-blue-950/10">
                  <td className="px-4 py-2"><input value={newMsForm.name} onChange={e => setNewMsForm(f => ({ ...f, name: e.target.value }))} placeholder="Milestone name…" className={inp} autoFocus /></td>
                  <td className="px-4 py-2"><select value={newMsForm.category} onChange={e => setNewMsForm(f => ({ ...f, category: e.target.value as any }))} className={inp}><option value="product">Product</option><option value="execution">Execution</option><option value="ttm">TTM</option></select></td>
                  <td className="px-4 py-2"><input type="date" value={newMsForm.date} onChange={e => setNewMsForm(f => ({ ...f, date: e.target.value }))} className={inp} /></td>
                  <td className="px-4 py-2"><select value={newMsForm.owner} onChange={e => setNewMsForm(f => ({ ...f, owner: e.target.value }))} className={inp}><option value="">Owner…</option>{USERS.map(u2 => <option key={u2.id} value={u2.name.split(' ').pop() || u2.name}>{u2.name}</option>)}</select></td>
                  <td className="px-4 py-2 text-center"><input type="number" min={0} max={100} value={newMsForm.tech || ''} placeholder="—" onChange={e => setNewMsForm(f => ({ ...f, tech: e.target.value as any }))} className="w-14 px-1 py-1.5 rounded text-sm text-center font-bold outline-none border border-border bg-background text-foreground" /></td>
                  <td className="px-4 py-2" colSpan={2}><div className="flex items-center gap-2">
                    <input value={newMsForm.keyIssue} onChange={e => setNewMsForm(f => ({ ...f, keyIssue: e.target.value }))} placeholder="Key issue…" className={`${inp} flex-1`} onKeyDown={e => { if (e.key === 'Enter') saveMs(); }} />
                    <button onClick={saveMs} disabled={!newMsForm.name} className="inline-flex items-center gap-1 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"><I name="check" size={12} color="currentColor" />Save</button>
                    <button onClick={resetAddForm} className="inline-flex items-center h-8 px-3 rounded-md text-sm font-medium border border-border bg-background hover:bg-muted text-foreground cursor-pointer">Cancel</button>
                  </div></td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>
    </Cd>}

    {/* ═══ TASKS ═══ */}
    {/* ═══ DOCUMENTS ═══ */}

    {/* ═══ COMMENTS ═══ */}

  </motion.div>);
}

/* ─── Documents sub-component ─── */
function DocumentsSection({ p, docs, setDocs, ME }: { p: Program; docs: Doc[]; setDocs: React.Dispatch<React.SetStateAction<Doc[]>>; ME: import('../types').User }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "sheet" as Doc["type"], category: "", url: "" });
  const prgDocs = docs.filter(d => d.prgId === p.id).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

  const addDoc = () => {
    if (!form.name.trim() || !form.url.trim()) return;
    const newDoc: Doc = {
      id: `DOC-${Date.now()}`,
      prgId: p.id,
      name: form.name.trim(),
      type: form.type,
      url: form.url.trim(),
      addedBy: ME,
      addedAt: new Date().toISOString(),
      category: form.category.trim(),
    };
    setDocs(prev => [...prev, newDoc]);
    apiCreateDocument({ programId: p.id, name: form.name.trim(), type: form.type, url: form.url.trim(), category: form.category.trim() }).catch(() => {});
    setForm({ name: "", type: "sheet", category: "", url: "" });
    setShowForm(false);
  };

  const removeDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    apiDeleteDocument(id).catch(() => {});
  };

  return (
    <Cd delay={0.12} hover={false} className="p-4 md:p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <I name="file" size={16} color="var(--foreground)" />
          <span className="text-sm font-bold text-foreground">Documents</span>
          <span className="text-xs text-muted-foreground">({prgDocs.length})</span>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${showForm ? 'border border-border bg-background text-foreground hover:bg-muted' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
          <I name={showForm ? "x" : "plus"} size={12} color="currentColor" />
          {showForm ? "Cancel" : "Link Document"}
        </button>
      </div>

      {/* Add document form */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-5 p-4 md:p-5 rounded-xl bg-muted border border-border">
          <div className="space-y-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Document name…" className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary" />
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs mb-1 block text-muted-foreground">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Doc["type"] })} className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground">
                  <option value="sheet">Google Sheet</option>
                  <option value="doc">Google Doc</option>
                  <option value="slides">Slides</option>
                  <option value="pdf">PDF</option>
                  <option value="link">Other Link</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs mb-1 block text-muted-foreground">Category</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Design, Spec…" className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary" />
              </div>
            </div>
            <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="URL…" className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary" />
            <button disabled={!form.name.trim() || !form.url.trim()} onClick={addDoc}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
              <I name="plus" size={12} color="currentColor" />Link Document
            </button>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Document list */}
      {prgDocs.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">No documents linked yet</div>
      ) : (
        <div className="space-y-2">{prgDocs.map((d, i) => {
          const meta = DOC_META[d.type];
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="group flex items-center gap-3 p-3 rounded-xl bg-muted border border-border hover:border-primary/30 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}18` }}>
                <I name={meta.icon} size={16} color={meta.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground truncate">{d.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ color: meta.color, background: `${meta.color}18` }}>{meta.label}</span>
                  {d.category && <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-accent text-primary">{d.category}</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Added by {d.addedBy.name}</div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-accent text-primary hover:opacity-80 transition-opacity flex-shrink-0">
                <I name="external" size={10} color="var(--primary)" />Open
              </a>
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => removeDoc(d.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 flex-shrink-0 cursor-pointer">
                <I name="trash" size={14} color="var(--destructive, #EF4444)" />
              </motion.button>
            </motion.div>
          );
        })}</div>
      )}
    </Cd>
  );
}

/* ═══ PROGRAM NPI TIMELINE TAB ═══ */
function ProgramTimeline({ p }: { p: Program }) {
  const mob = useIsMobile();
  const milestones = p.milestones || [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });
  const [hoveredMs, setHoveredMs] = useState<typeof milestones[0] | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  /* Drag handlers */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, scrollLeft: containerRef.current.scrollLeft };
    containerRef.current.style.cursor = "grabbing";
    containerRef.current.style.userSelect = "none";
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    containerRef.current.scrollLeft = dragStart.current.scrollLeft - (e.clientX - dragStart.current.x);
  }, [isDragging]);
  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    if (containerRef.current) { containerRef.current.style.cursor = "grab"; containerRef.current.style.removeProperty("user-select"); }
  }, []);
  useEffect(() => { const h = () => setIsDragging(false); window.addEventListener("mouseup", h); return () => window.removeEventListener("mouseup", h); }, []);
  const onTouchStart = useCallback((e: React.TouchEvent) => { if (!containerRef.current) return; dragStart.current = { x: e.touches[0].clientX, scrollLeft: containerRef.current.scrollLeft }; }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => { if (!containerRef.current) return; containerRef.current.scrollLeft = dragStart.current.scrollLeft - (e.touches[0].clientX - dragStart.current.x); }, []);

  if (milestones.length === 0) {
    return (
      <Cd delay={0} hover={false} className="p-8 text-center">
        <I name="calendar" size={32} color="var(--muted-foreground)" />
        <div className="text-sm text-muted-foreground mt-3">No milestones defined yet</div>
        <div className="text-xs text-muted-foreground mt-1">Add milestones in the Overview tab to see them on the timeline</div>
      </Cd>
    );
  }

  /* Timeline math */
  const parseDate = (d: string) => new Date(d + "T00:00:00").getTime();
  const allDates = milestones.map(m => parseDate(m.date));
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);
  const PAD = 30 * 24 * 60 * 60 * 1000;
  const timeStart = minDate - PAD;
  const timeEnd = maxDate + PAD;
  const timeSpan = timeEnd - timeStart;
  const BASE_WIDTH = mob ? 800 : 1100;
  const TIMELINE_WIDTH = BASE_WIDTH * zoom;
  const TRACK_HEIGHT = 150;
  const dateToX = (d: string) => ((parseDate(d) - timeStart) / timeSpan) * TIMELINE_WIDTH;
  const TODAY = new Date();
  const todayX = ((TODAY.getTime() - timeStart) / timeSpan) * TIMELINE_WIDTH;

  /* Month grid */
  const months: { label: string; x: number }[] = [];
  const cursor = new Date(timeStart);
  cursor.setDate(1); cursor.setMonth(cursor.getMonth() + 1);
  while (cursor.getTime() < timeEnd) {
    months.push({ label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), x: ((cursor.getTime() - timeStart) / timeSpan) * TIMELINE_WIDTH });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  /* Scroll to today on mount */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = Math.max(0, todayX - containerRef.current.clientWidth / 2);
    }
  }, [zoom]);

  /* Color for milestone — shadcn-aligned palette */
  const msColor = (ms: typeof milestones[0]) => {
    if (ms.status === "done") return '#10b981';
    if (parseDate(ms.date) < TODAY.getTime()) return '#ef4444';
    return '#3b82f6';
  };
  const msBg = (ms: typeof milestones[0]) => {
    if (ms.status === "done") return 'rgba(16,185,129,0.12)';
    if (parseDate(ms.date) < TODAY.getTime()) return 'rgba(239,68,68,0.12)';
    return 'rgba(59,130,246,0.12)';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Program header */}
      <Cd delay={0} hover={false} className="p-4 md:p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <I name="calendar" size={16} color="var(--foreground)" />
          <span className="text-sm font-semibold text-foreground">{p.name} — Milestone Timeline</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
            {milestones.filter(m => m.status === 'done').length}/{milestones.length} done
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Drag to pan, hover milestones for details. Arrow marks today.</p>
      </Cd>

      {/* Zoom controls */}
      <div className="flex items-center justify-end gap-1 mb-3">
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors cursor-pointer text-sm font-medium">−</button>
        <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors cursor-pointer text-sm font-medium">+</button>
      </div>

      {/* Draggable timeline */}
      <Cd delay={0.05} hover={false} className="p-0 mb-5 overflow-hidden">
        <div ref={containerRef} className="overflow-x-auto overflow-y-hidden" style={{ cursor: "grab" }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
          <div style={{ width: TIMELINE_WIDTH, height: TRACK_HEIGHT + 60, position: "relative" }}>
            {/* Month grid */}
            {months.map((m, i) => (
              <div key={i} style={{ position: "absolute", left: m.x, top: 0, bottom: 0, width: 1, background: "var(--border)", opacity: 0.5 }}>
                <span className="text-xs text-muted-foreground font-bold absolute" style={{ top: 4, left: 6, whiteSpace: "nowrap" }}>{m.label}</span>
              </div>
            ))}
            {/* Today — down arrow marker */}
            <div style={{ position: "absolute", left: todayX, top: 30 + TRACK_HEIGHT / 2 - 28, transform: "translateX(-50%)", zIndex: 15, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pointerEvents: "none" }}>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-foreground text-background" style={{ whiteSpace: "nowrap" }}>Today</span>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path d="M7 10L0 0H14L7 10Z" fill="currentColor" className="text-foreground" />
              </svg>
            </div>
            {/* Track bg */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 30, bottom: 0, background: "var(--muted)", opacity: 0.3 }} />
            {/* Track line */}
            <div style={{ position: "absolute", left: 40, right: 40, top: 30 + TRACK_HEIGHT / 2, height: 1, background: "var(--border)", borderRadius: 1 }} />

            {/* Milestone dots — stagger labels to avoid overlap */}
            {(() => {
              const sorted = milestones.map((ms, oi) => ({ ms, oi, x: dateToX(ms.date) })).sort((a, b) => a.x - b.x);
              const MIN_GAP = 60;
              const tiers = [-70, -44, 30, 56];
              const connH = [40, 14, 14, 40];
              const assigned: number[] = [];
              sorted.forEach((item, i) => {
                if (i === 0) { assigned.push(item.ms.status === "done" ? 1 : 2); return; }
                const gap = item.x - sorted[i - 1].x;
                if (gap >= MIN_GAP) { assigned.push(item.ms.status === "done" ? 1 : 2); return; }
                const prev = assigned[i - 1];
                const candidates = [0, 1, 2, 3].filter(t => t !== prev);
                const preferred = item.ms.status === "done" ? candidates.find(t => t < 2) ?? candidates[0] : candidates.find(t => t >= 2) ?? candidates[0];
                assigned.push(preferred);
              });
              return sorted.map(({ ms, oi, x }, mi) => {
                const done = ms.status === "done";
                const isPast = parseDate(ms.date) < TODAY.getTime();
                const c = msColor(ms);
                const tier = tiers[assigned[mi]];
                const cH = connH[assigned[mi]];
                const cTop = tier < 0 ? tier + cH : 14;
                return (
                  <motion.div key={ms.name + oi} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 + mi * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                    style={{ position: "absolute", left: x, top: 30 + TRACK_HEIGHT / 2, transform: "translate(-50%, -50%)", zIndex: 20 }}
                    onMouseEnter={(e) => { if (!isDragging) { setHoveredMs(ms); setTooltipPos({ x: e.clientX, y: e.clientY }); } }}
                    onMouseLeave={() => setHoveredMs(null)}>
                    <div style={{ position: "absolute", left: "50%", top: cTop, width: 1, height: cH, background: c, opacity: 0.4 }} />
                    <div className="rounded-full flex items-center justify-center"
                      style={{ width: done ? 20 : 16, height: done ? 20 : 16, background: done ? c : "var(--card)", border: `2.5px solid ${c}`, boxShadow: done ? `0 0 12px ${c}44` : "none", cursor: "pointer" }}>
                      {done && <I name="check" size={10} color="var(--background)" />}
                    </div>
                    <div className="absolute text-center" style={{ left: "50%", transform: "translateX(-50%)", top: tier, whiteSpace: "nowrap" }}>
                      <div className="text-xs font-bold" style={{ color: done ? c : "var(--foreground)" }}>{ms.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(ms.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                      </div>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </Cd>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredMs && !isDragging && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed z-50 rounded-md shadow-md p-3 max-w-xs bg-popover border border-border"
            style={{ left: Math.min(tooltipPos.x + 12, window.innerWidth - 280), top: tooltipPos.y - 80, background: "var(--card)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: msColor(hoveredMs) }} />
              <span className="text-sm font-semibold text-foreground">{hoveredMs.name}</span>
              {hoveredMs.status === "done" && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: msBg(hoveredMs), color: msColor(hoveredMs) }}>Done</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mb-1">
              {new Date(hoveredMs.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {hoveredMs.owner && ` · ${hoveredMs.owner}`}
            </div>
            {hoveredMs.keyIssue && (
              <div className="text-xs mt-1 px-2 py-1 rounded-md bg-muted text-foreground">
                {hoveredMs.keyIssue}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
