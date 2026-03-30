import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as I } from '../components/Icons';
import { u, ST, PHASE_LISTS, accent, accentText, PROGRESS_COLOR } from '../tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import { Av, SB, TB, PB, GB, Cd } from '../components/ui';
import { USERS } from '../data';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useProgramRole } from '../hooks/useProgramRole';
import type { Program, Comment, Reply, Task, Doc } from '../types';
import Comments from './Comments';
import ProgramMetrics from './ProgramMetrics';
import ProgramIssues from './ProgramIssues';
import { HealthCard, emptyHealth } from '../components/Health';
import { createTask as apiCreateTask, updateTask as apiUpdateTask, createDocument as apiCreateDocument, deleteDocument as apiDeleteDocument } from '../services/api';
import { calcHealth, healthColor, healthLabel, healthBg, DIM_META, HEALTH_WEIGHTS } from '../utils/health';

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
  gateSt?: Record<string, string>;
  back: () => void;
}

const DOC_META: Record<Doc["type"], { icon: string; color: string; label: string }> = {
  sheet: { icon: "sheet", color: "#34A853", label: "Sheet" },
  doc:   { icon: "file",  color: "#4285F4", label: "Doc" },
  slides:{ icon: "external", color: "#FBBC04", label: "Slides" },
  pdf:   { icon: "file",  color: "#F87171", label: "PDF" },
  link:  { icon: "link",  color: "var(--muted-foreground)", label: "Link" },
};

export default function ProgramDetail({ p, setPrg, com, setCom, rep, setRep, tasks, setTasks, docs, setDocs, gateSt = {}, back }: ProgramDetailProps) {
  const ME = useCurrentUser();
  const mob=useIsMobile();
  const pRole = useProgramRole(p?.id);
  if(!p)return null;
  const prgTasks=tasks.filter(t=>t.prgId===p.id);
  const[showNewTask,setShowNewTask]=useState(false);
  const[newTask,setNewTask]=useState({title:"",assignee:USERS[0].id,priority:"P1",due:"",desc:""});
  const[editingMs,setEditingMs]=useState<number|null>(null);

  /* Update a milestone field on the parent program */
  const updateMilestone = (idx: number, patch: Partial<{name:string;date:string;status:'pending'|'done';owner:string;keyIssue:string}>) => {
    setPrg(prev => prev.map(prg => prg.id === p.id
      ? { ...prg, milestones: (prg.milestones || []).map((m, i) => i === idx ? { ...m, ...patch } : m), lastUpdate: new Date().toISOString() }
      : prg
    ));
    setEditingMs(null);
  };

  const h = calcHealth(p, tasks, gateSt);
  const w = HEALTH_WEIGHTS[p.type] || HEALTH_WEIGHTS.HW;
  const progressColor = PROGRESS_COLOR[p.currentPhase] || "#3B82F6";
  return(<motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
    <motion.button whileHover={{x:-3}} whileTap={{scale:.95}} onClick={back} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold mb-5 bg-card border border-border cursor-pointer" style={{color:'#2563EB'}}><I name="back" size={14} color={'#2563EB'}/>Back</motion.button>
    <Cd delay={0} hover={false} className="p-5 md:p-6 mb-5">

      {/* ═══ NARRATIVE HEADLINE ═══ */}
      {(() => {
        const displayLabel = h.label;
        const worstDim = Object.entries(h.dims).reduce((a, b) => a[1] < b[1] ? a : b);
        const worstName = DIM_META[worstDim[0]]?.label || worstDim[0];
        const headline = h.composite >= 75
          ? `${p.name} is On Track; all dimensions healthy`
          : h.composite >= 50
            ? `${p.name} remains ${displayLabel}; ${worstName.toLowerCase()} is the primary concern${p.deliveryCommit ? ` while ${new Date(p.deliveryCommit).toLocaleDateString('en-US',{month:'short',year:'numeric'})} delivery remains protected` : ''}`
            : `${p.name} is Critical; ${worstName.toLowerCase()} requires immediate attention`;
        return (
          <>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-foreground leading-snug mb-1">{headline}</h2>
            <p className="text-xs text-muted-foreground mb-5">{p.type} program | milestone-led executive dashboard</p>
          </>
        );
      })()}

      {/* ═══ TWO-COLUMN: TIMELINE + STATUS PANEL ═══ */}
      <div className={`flex ${mob ? 'flex-col' : 'flex-row'} gap-5`}>

        {/* LEFT: Phase timeline + milestones table */}
        <div className="flex-1 min-w-0">

          {/* Phase timeline */}
          {(() => {
            const phaseKey = p.type === 'HW' ? 'Hardware' : p.type === 'SW' ? 'Software' : 'Hardware';
            const phases = PHASE_LISTS[phaseKey] || PHASE_LISTS['Hardware'] || [];
            const currentIdx = phases.indexOf(p.phase || p.currentPhase || '');
            const now = new Date();
            const start = p.assignedDate ? new Date(p.assignedDate) : now;
            const end = p.deliveryCommit ? new Date(p.deliveryCommit) : (p.deliveryAsk ? new Date(p.deliveryAsk) : now);
            const elapsed = end > start ? Math.max(0, Math.min(1, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime()))) : 0;
            const todayIdx = Math.min(Math.floor(elapsed * phases.length), phases.length - 1);

            return (
              <div className="mb-6">
                {/* Today marker */}
                <div className="relative mb-1" style={{ paddingLeft: `${Math.max(4, todayIdx / Math.max(phases.length - 1, 1) * 85)}%` }}>
                  <span className="text-[9px] font-bold text-muted-foreground">Today</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0" style={{ marginLeft: `${Math.max(4, todayIdx / Math.max(phases.length - 1, 1) * 85)}%`, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid var(--muted-foreground)' }} />
                </div>

                {/* Connector line */}
                <div className="relative">
                  <div className="absolute top-3 left-0 right-0 h-[2px] bg-border" />

                  {/* Phase dots */}
                  <div className="flex justify-between relative">
                    {phases.map((ph, i) => {
                      const done = i < currentIdx;
                      const current = i === currentIdx;
                      const future = i > currentIdx;
                      const dotColor = done ? '#34D399' : current ? '#FBBF24' : 'var(--border)';
                      const dotBorder = done ? '#34D399' : current ? '#FBBF24' : 'var(--border)';
                      const msForPhase = (p.milestones || []).find(m => m.name.toLowerCase().includes(ph.toLowerCase().slice(0, 4)));

                      return (
                        <div key={i} className="flex flex-col items-center" style={{ flex: 1 }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center relative z-10" style={{
                            background: done ? dotColor : future ? 'var(--background)' : 'var(--background)',
                            border: `2.5px solid ${dotBorder}`,
                          }}>
                            {done && <I name="check" size={11} color="#fff" />}
                            {current && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FBBF24' }} />}
                          </div>
                          <div className={`text-[10px] font-bold mt-1.5 text-center ${future ? 'text-muted-foreground' : 'text-foreground'}`}>{ph}</div>
                          {msForPhase?.date && <div className={`text-[9px] ${current ? 'font-bold' : ''}`} style={{ color: current ? '#FBBF24' : 'var(--muted-foreground)' }}>{new Date(msForPhase.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Critical milestones table */}
          <div className="mb-2">
            <div className="text-xs font-bold text-foreground mb-2">Critical milestones</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Milestone</th>
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Owner</th>
                    <th className="text-center py-2 px-1 font-semibold text-muted-foreground" title="Technology risk">Tech</th>
                    <th className="text-center py-2 px-1 font-semibold text-muted-foreground" title="Execution risk">Exec</th>
                    <th className="text-center py-2 px-1 font-semibold text-muted-foreground" title="Time-to-market risk">TTM</th>
                    <th className="text-left py-2 pl-2 font-semibold text-muted-foreground">Key issue</th>
                  </tr>
                </thead>
                <tbody>
                  {(p.milestones || []).map((ms, i) => {
                    const now = new Date();
                    const msDate = ms.date ? new Date(ms.date) : null;
                    const done = ms.status === 'done';
                    const overdue = !done && msDate && msDate < now;
                    const isEditing = editingMs === i;
                    // RAG dots — derive from milestone position and health dims
                    const techRag = done ? '#34D399' : h.dims.quality >= 70 ? '#34D399' : h.dims.quality >= 50 ? '#FBBF24' : '#F87171';
                    const execRag = done ? '#34D399' : h.dims.tasks >= 70 ? '#34D399' : h.dims.tasks >= 50 ? '#FBBF24' : '#F87171';
                    const ttmRag = done ? '#34D399' : h.dims.schedule >= 70 ? '#34D399' : h.dims.schedule >= 50 ? '#FBBF24' : '#F87171';

                    return (
                      <tr key={i} className={`border-b border-border/50 ${overdue ? 'bg-destructive/5' : ''} cursor-pointer hover:bg-muted/50 transition-colors`}
                        onClick={() => setEditingMs(isEditing ? null : i)}>
                        <td className={`py-2.5 pr-3 font-semibold ${done ? 'text-muted-foreground' : overdue ? 'text-destructive font-bold' : 'text-foreground'}`}>
                          {ms.name}
                        </td>
                        <td className={`py-2.5 px-2 ${overdue ? 'text-destructive font-bold' : 'text-secondary-foreground'}`}>
                          {ms.date ? new Date(ms.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-secondary-foreground">{ms.owner || p.owner.name.split(' ').pop()}</td>
                        <td className="py-2.5 px-1 text-center"><span className="inline-block w-3 h-3 rounded-full" style={{ background: techRag }} /></td>
                        <td className="py-2.5 px-1 text-center"><span className="inline-block w-3 h-3 rounded-full" style={{ background: execRag }} /></td>
                        <td className="py-2.5 px-1 text-center"><span className="inline-block w-3 h-3 rounded-full" style={{ background: ttmRag }} /></td>
                        <td className="py-2.5 pl-2 text-muted-foreground">
                          {ms.keyIssue || (overdue ? `${Math.floor((now.getTime() - msDate!.getTime()) / 86400000)} days overdue` : '')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Inline milestone editor */}
              <AnimatePresence>
                {editingMs !== null && (p.milestones || [])[editingMs] && (() => {
                  const ms = p.milestones[editingMs];
                  return (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-3 p-4 rounded-xl bg-card border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-bold text-foreground">Edit milestone: {ms.name}</div>
                        <motion.button whileTap={{ scale: .95 }} onClick={(e) => { e.stopPropagation(); setEditingMs(null); }}
                          className="p-1 rounded bg-border/50 cursor-pointer"><I name="x" size={12} color="var(--muted-foreground)" /></motion.button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Owner</label>
                          <input defaultValue={ms.owner || p.owner.name.split(' ').pop() || ''}
                            onBlur={(e) => updateMilestone(editingMs, { owner: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground outline-none" style={{ fontFamily: 'inherit' }} />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Status</label>
                          <select defaultValue={ms.status}
                            onChange={(e) => updateMilestone(editingMs, { status: e.target.value as 'pending' | 'done' })}
                            className="w-full px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground outline-none">
                            <option value="pending">Pending</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Date</label>
                          <input type="date" defaultValue={ms.date}
                            onBlur={(e) => updateMilestone(editingMs, { date: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Key issue / notes</label>
                        <input defaultValue={ms.keyIssue || ''}
                          placeholder="Describe the key issue, blocker, or status note…"
                          onBlur={(e) => updateMilestone(editingMs, { keyIssue: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') { updateMilestone(editingMs, { keyIssue: (e.target as HTMLInputElement).value }); } }}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground outline-none" style={{ fontFamily: 'inherit' }}
                          autoFocus />
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT: Program status & weighted risk roll-up */}
        <div className={mob ? 'w-full' : 'w-72 flex-shrink-0'}>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="text-xs font-bold text-foreground mb-3">Program status &amp; weighted risk roll-up</div>

            {/* Overall status badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Overall status</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: healthBg(h.composite), color: h.color, border: `1px solid ${h.color}33` }}>
                {h.label}
              </span>
            </div>

            {/* Donut chart */}
            <div className="flex justify-center mb-4">
              <svg width="140" height="140" viewBox="0 0 140 140">
                {(() => {
                  const dims = [
                    { key: 'schedule', label: 'Schedule', pct: w.schedule },
                    { key: 'milestones', label: 'Milestones', pct: w.milestones },
                    { key: 'tasks', label: 'Tasks', pct: w.tasks },
                    { key: 'budget', label: 'Budget', pct: w.budget },
                    { key: 'quality', label: 'Quality', pct: w.quality },
                  ];
                  const r = 50, cx = 70, cy = 70, gap = 0.02;
                  let accum = 0;
                  return dims.map(d => {
                    const startAngle = accum * 2 * Math.PI - Math.PI / 2 + gap;
                    accum += d.pct;
                    const endAngle = accum * 2 * Math.PI - Math.PI / 2 - gap;
                    const x1 = cx + r * Math.cos(startAngle);
                    const y1 = cy + r * Math.sin(startAngle);
                    const x2 = cx + r * Math.cos(endAngle);
                    const y2 = cy + r * Math.sin(endAngle);
                    const large = d.pct > 0.5 ? 1 : 0;
                    const color = healthColor(h.dims[d.key]);
                    // Label position
                    const midAngle = (startAngle + endAngle) / 2;
                    const lx = cx + (r - 14) * Math.cos(midAngle);
                    const ly = cy + (r - 14) * Math.sin(midAngle);
                    return (
                      <g key={d.key}>
                        <path d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${cx} ${cy} Z`}
                          fill={color} opacity={0.85} stroke="var(--background)" strokeWidth="2" />
                        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill="var(--background)" fontSize="10" fontWeight="700">
                          {Math.round(d.pct * 100)}
                        </text>
                      </g>
                    );
                  });
                })()}
                {/* Center hole */}
                <circle cx="70" cy="70" r="28" fill="var(--card)" />
                <text x="70" y="67" textAnchor="middle" dominantBaseline="central" fill="var(--foreground)" fontSize="18" fontWeight="800">{h.composite}</text>
                <text x="70" y="82" textAnchor="middle" dominantBaseline="central" fill="var(--muted-foreground)" fontSize="8">/100</text>
              </svg>
            </div>

            {/* Dimension breakdown */}
            <div className="space-y-2">
              {Object.entries(h.dims).map(([key, val]) => {
                const meta = DIM_META[key];
                const c = healthColor(val);
                const ragLabel = val >= 75 ? 'GREEN' : val >= 50 ? 'AMBER' : 'RED';
                const weight = Math.round((w[key] || 0) * 100);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c }} />
                    <span className="text-xs text-foreground font-medium flex-1">{meta.label}</span>
                    <span className="text-[10px] text-muted-foreground">{weight}%</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${c}18`, color: c, minWidth: 48, textAlign: 'center' }}>{ragLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Immediate actions */}
          {h.alerts.length > 0 && (
            <div className="mt-3 p-4 rounded-xl" style={{ background: h.composite < 50 ? u.errD : u.wD, border: `1px solid ${h.composite < 50 ? u.err : u.w}22` }}>
              <div className="text-xs font-bold mb-2" style={{ color: h.composite < 50 ? u.err : '#92400E' }}>Immediate actions</div>
              <ul className="space-y-1.5">
                {h.alerts.map((a, i) => (
                  <li key={i} className="text-xs text-secondary-foreground flex items-start gap-1.5">
                    <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ background: h.composite < 50 ? u.err : '#92400E' }} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {/* ═══ INFO GRID (below the two-column layout) ═══ */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-2">
          {[
            { l: "Owner", v: p.owner.name },
            { l: "Assigned By", v: p.assignedBy?.name || "—" },
            { l: "Assigned Date", v: p.assignedDate || "—" },
            { l: "Delivery ASK", v: p.deliveryAsk || "—" },
            { l: "Delivery Commit", v: p.deliveryCommit || "—" },
          ].map((d, i) => <div key={i}><div className="text-[8px] uppercase tracking-wider mb-0.5 text-muted-foreground">{d.l}</div><div className="text-sm font-bold text-foreground">{d.v}</div></div>)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Team", v: p.team },
            { l: "Budget", v: p.budget },
            { l: "Used", v: `${p.budgetUsed}%` },
            { l: "Last Update", v: p.lastUpdate ? new Date(p.lastUpdate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "—" },
          ].map((d, i) => <div key={i}><div className="text-[8px] uppercase tracking-wider mb-0.5 text-muted-foreground">{d.l}</div><div className="text-sm font-bold text-foreground">{d.v}</div></div>)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-2 text-muted-foreground"><span>Progress</span><span className="font-bold text-foreground">{p.progress}%</span></div>
        <GB pct={p.progress} h={mob ? 8 : 10} color={progressColor} />
      </div>
    </Cd>

    {/* ═══ TRAFFIC SIGNAL HEALTH (unified view + editor) ═══ */}
    <HealthCard
      health={p.health || emptyHealth()}
      issues={p.issues || []}
      isEditor={pRole.isEditor}
      onHealthChange={(h) => setPrg(prev => prev.map(pr => pr.id === p.id ? { ...pr, health: h } : pr))}
      onIssuesChange={(iss) => setPrg(prev => prev.map(pr => pr.id === p.id ? { ...pr, issues: iss } : pr))}
      currentUser={ME.av}
    />

    {/* ═══ HEALTH METRICS + KEY ISSUES (API-backed) ═══ */}
    <ProgramMetrics programId={p.id} isEditor={pRole.isEditor} />
    <ProgramIssues programId={p.id} isEditor={pRole.isEditor} />

    {/* ═══ TASKS ═══ */}
    <Cd delay={.08} hover={false} className="p-4 md:p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><I name="clipboard" size={16} color="var(--foreground)"/><span className="text-sm font-bold text-foreground">Tasks</span><span className="text-xs text-muted-foreground">({prgTasks.length})</span></div>
        <motion.button whileTap={{scale:.95}} onClick={()=>setShowNewTask(!showNewTask)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:showNewTask?'var(--border)':accent,color:showNewTask?'var(--muted-foreground)':accentText}}>
          <I name={showNewTask?"x":"plus"} size={12} color={showNewTask?'var(--muted-foreground)':accentText}/>{showNewTask?"Cancel":"New Task"}
        </motion.button>
      </div>

      {/* New task form */}
      <AnimatePresence>{showNewTask&&(
        <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="mb-5 p-4 md:p-5 rounded-xl bg-muted border border-border">
          <div className="space-y-3">
            <input value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} placeholder="Task title…" className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary"/>
            <textarea value={newTask.desc} onChange={e=>setNewTask({...newTask,desc:e.target.value})} placeholder="Description…" rows={2} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none bg-card border border-border text-foreground focus:border-primary"/>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1"><label className="text-xs mb-1 block text-muted-foreground">Assignee</label>
                <select value={newTask.assignee} onChange={e=>setNewTask({...newTask,assignee:e.target.value})} className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground">
                  {USERS.map(u2=><option key={u2.id} value={u2.id}>{u2.name} ({u2.role})</option>)}
                </select>
              </div>
              <div className="flex gap-3">
              <div className="flex-1"><label className="text-xs mb-1 block text-muted-foreground">Priority</label>
                <select value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})} className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground">
                  {["P0","P1","P2","P3"].map(p2=><option key={p2} value={p2}>{p2}</option>)}
                </select>
              </div>
              <div className="flex-1"><label className="text-xs mb-1 block text-muted-foreground">Due Date</label>
                <input type="date" value={newTask.due} onChange={e=>setNewTask({...newTask,due:e.target.value})} className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground"/>
              </div>
              </div>
            </div>
            <motion.button whileTap={{scale:.95}} disabled={!newTask.title.trim()} onClick={()=>{
              if(!newTask.title.trim())return;
              setTasks(prev=>[...prev,{id:`TK-${String(prev.length+1).padStart(3,"0")}`,title:newTask.title,prgId:p.id,assignee:USERS.find(u2=>u2.id===newTask.assignee)||USERS[0],reporter:ME,priority:newTask.priority,status:"Todo",due:newTask.due,desc:newTask.desc}]);
              apiCreateTask({ title: newTask.title, prgId: p.id, assignee: newTask.assignee, priority: newTask.priority, due: newTask.due, desc: newTask.desc }).catch(() => {});
              setNewTask({title:"",assignee:USERS[0].id,priority:"P1",due:"",desc:""});setShowNewTask(false);
            }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold" style={{background:newTask.title.trim()?accent:'var(--border)',color:newTask.title.trim()?accentText:'var(--muted-foreground)',opacity:newTask.title.trim()?1:.5}}>
              <I name="plus" size={12} color={newTask.title.trim()?accentText:'var(--muted-foreground)'}/>Create Task
            </motion.button>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Task list */}
      {prgTasks.length===0?<div className="text-center py-6 text-xs text-muted-foreground">No tasks yet — create one above</div>:
      <div className="space-y-3">{prgTasks.map((tk,i)=>{
        const priC={"P0":{c:u.err,bg:u.errD},"P1":{c:u.w,bg:u.wD},"P2":{c:u.inf,bg:u.infD},"P3":{c:'#2563EB',bg:"rgba(147,197,253,.1)"}}[tk.priority]||{c:'#2563EB',bg:"rgba(147,197,253,.1)"};
        const stC={"Todo":{c:"var(--muted-foreground)",bg:"var(--muted)"},"In Progress":{c:u.inf,bg:u.infD},"In Review":{c:u.pur,bg:u.purD},"Done":{c:u.ok,bg:u.okD}}[tk.status]||{c:"var(--muted-foreground)",bg:"var(--muted)"};
        return(
          <motion.div key={tk.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.03}} className="p-3 rounded-xl bg-muted border border-border" style={{opacity:tk.status==="Done"?.5:1}}>
            <div className="flex items-start gap-3">
              <motion.button whileTap={{scale:.8}} onClick={()=>{setTasks(prev=>prev.map(t=>t.id===tk.id?{...t,status:t.status==="Done"?"Todo":"Done"}:t));apiUpdateTask(tk.id, { status: tk.status === "Done" ? "Todo" : "Done" }).catch(() => {});}}
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer mt-0.5" style={{border:`1.5px solid ${tk.status==="Done"?u.ok:'var(--muted-foreground)'}`,background:tk.status==="Done"?u.okD:"transparent"}}>
                {tk.status==="Done"&&<I name="check" size={12} color={u.ok}/>}
              </motion.button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">{tk.id}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{color:priC.c,background:priC.bg}}>{tk.priority}</span>
                </div>
                <div className="text-xs font-medium" style={{color:tk.status==="Done"?'var(--muted-foreground)':'var(--foreground)',textDecoration:tk.status==="Done"?"line-through":"none"}}>{tk.title}</div>
                {tk.desc&&<div className="text-xs truncate mt-0.5 text-muted-foreground">{mob?tk.desc.slice(0,50):tk.desc.slice(0,80)}…</div>}
                <div className="flex items-center gap-2 mt-2">
                  <Av user={tk.assignee} size={18}/>
                  <span className="text-xs text-secondary-foreground">{tk.assignee.name}</span>
                  {tk.due&&<span className="text-xs flex items-center gap-1 ml-auto text-muted-foreground"><I name="calendar" size={9} color="var(--muted-foreground)"/>{tk.due}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap mt-3 ml-8">{["Todo","In Progress","In Review","Done"].map(s=>(
              <motion.button key={s} whileTap={{scale:.88}} onClick={()=>{setTasks(prev=>prev.map(t=>t.id===tk.id?{...t,status:s}:t));apiUpdateTask(tk.id, { status: s }).catch(() => {});}}
                className="px-2 py-0.5 rounded-md cursor-pointer text-[8px]" style={{border:`1px solid ${tk.status===s?stC.c:'var(--border)'}`,background:tk.status===s?stC.bg:"transparent",color:tk.status===s?stC.c:'var(--muted-foreground)',fontWeight:tk.status===s?700:400}}>{s}</motion.button>
            ))}</div>
          </motion.div>
        );
      })}</div>}
    </Cd>

    {/* ═══ DOCUMENTS ═══ */}
    <DocumentsSection p={p} docs={docs} setDocs={setDocs} ME={ME}/>

    <Comments eId={p.id} com={com} setCom={setCom} rep={rep} setRep={setRep}/>
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
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: showForm ? 'var(--border)' : accent, color: showForm ? 'var(--muted-foreground)' : accentText }}>
          <I name={showForm ? "x" : "plus"} size={12} color={showForm ? 'var(--muted-foreground)' : accentText} />
          {showForm ? "Cancel" : "Link Document"}
        </motion.button>
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
            <motion.button whileTap={{ scale: 0.95 }} disabled={!form.name.trim() || !form.url.trim()} onClick={addDoc}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
              style={{ background: form.name.trim() && form.url.trim() ? accent : 'var(--border)', color: form.name.trim() && form.url.trim() ? accentText : 'var(--muted-foreground)', opacity: form.name.trim() && form.url.trim() ? 1 : 0.5 }}>
              <I name="plus" size={12} color={form.name.trim() && form.url.trim() ? accentText : 'var(--muted-foreground)'} />Link Document
            </motion.button>
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
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: meta.color, background: `${meta.color}18` }}>{meta.label}</span>
                  {d.category && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent text-primary">{d.category}</span>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Added by {d.addedBy.name}</div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-accent text-primary hover:opacity-80 transition-opacity flex-shrink-0">
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
