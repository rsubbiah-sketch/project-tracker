import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Icon as I } from '../components/Icons';
import { u } from '../tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import { Av, TB, GB, Counter, Cd } from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { Program, Comment, Task } from '../types';
import { fmtD } from '../utils';
import { calcHealth, healthColor, healthLabel, healthBg, DIM_META } from '../utils/health';

interface MetricsDim { score: number | null; note: string }
interface ProgramMetric { programId: string; schedule: MetricsDim; budget: MetricsDim; risk: MetricsDim; composite: number | null }

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

interface DashboardProps {
  prg: Program[];
  com: Comment[];
  tasks: Task[];
  go: (id: string) => void;
  gateSt?: Record<string, string>;
}

export default function Dashboard({ prg, com, tasks, go, gateSt = {} }: DashboardProps) {
  const ME = useCurrentUser();
  const mob=useIsMobile();
  const myTasks=tasks.filter(t=>t.assignee.id===ME.id&&t.status!=="Done");

  // Fetch API metrics to overlay on calculated health
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

  // Calculate health for all programs — prefer API metrics composite when available
  const healthMap = prg.reduce((acc, p) => {
    acc[p.id] = calcHealth(p, tasks, gateSt);
    return acc;
  }, {} as Record<string, ReturnType<typeof calcHealth>>);

  const getComposite = (pid: string) => apiMetrics[pid]?.composite ?? healthMap[pid]?.composite ?? 0;

  const atRiskCount = prg.filter(p => {
    const c = getComposite(p.id);
    return c < 75;
  }).length;
  const criticalCount = prg.filter(p => {
    const c = getComposite(p.id);
    return c < 50;
  }).length;

  const stats=[
    {l:"Active",v:prg.filter(p=>p.mode==="active").length,c:u.ok,ic:"zap"},
    {l:"My Tasks",v:myTasks.length,c:"var(--foreground)",ic:"clipboard"},
    {l:"At Risk",v:atRiskCount,c:u.w,ic:"alert"},
    {l:"Critical",v:criticalCount,c:u.err,ic:"shield"},
  ];
  const chartData=prg.map(p=>({name:p.name.split(" ").slice(0,2).join(" "),progress:p.progress,budget:p.budgetUsed}));

  // Health-based status distribution for pie chart — use API metrics when available
  const healthDist = { "On Track": 0, "At Risk": 0, "Critical": 0 };
  prg.forEach(p => {
    const c = getComposite(p.id);
    const label = healthLabel(c);
    healthDist[label as keyof typeof healthDist]++;
  });
  const statusData = Object.entries(healthDist).filter(([,v]) => v > 0).map(([name,value]) => ({ name, value }));
  const PIE_COLORS: Record<string, string> = { "On Track": "#34D399", "At Risk": "#FBBF24", "Critical": "#F87171" };

  const recent=[...com].sort((a,b)=>new Date(b.ts).getTime()-new Date(a.ts).getTime()).slice(0,4);

  return(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    {/* Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">{stats.map((s,i)=><Cd key={i} delay={i*.07} className="p-4 md:p-5"><div className="flex justify-between items-start mb-3"><span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{s.l}</span><div className="p-1.5 md:p-2 rounded-lg" style={{background:`${s.c}12`}}><I name={s.ic} size={mob?13:15} color={s.c}/></div></div><div className="text-2xl md:text-4xl font-black tracking-tight" style={{color:s.c}}><Counter value={s.v}/></div></Cd>)}</div>

    {/* Charts */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      <Cd delay={.3} className="md:col-span-2 p-4 md:p-5" hover={false}><div className="text-xs font-bold mb-4 text-foreground">Progress vs Budget Utilization</div><ResponsiveContainer width="100%" height={mob?160:200}><BarChart data={chartData} barGap={mob?4:8}><XAxis dataKey="name" tick={{fill:'var(--muted-foreground)',fontSize:mob?8:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'var(--muted-foreground)',fontSize:9}} axisLine={false} tickLine={false} domain={[0,100]} hide={mob}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,fontSize:11,color:'var(--foreground)',boxShadow:'0 12px 40px rgba(0,0,0,.1)'}}/><Bar dataKey="progress" fill={'#2563EB'} radius={[6,6,0,0]} name="Progress %"/><Bar dataKey="budget" fill="#475569" radius={[6,6,0,0]} name="Budget %"/></BarChart></ResponsiveContainer></Cd>
      <Cd delay={.35} className="p-4 md:p-5" hover={false}><div className="text-xs font-bold mb-3 text-foreground">Health Distribution</div><ResponsiveContainer width="100%" height={140}><PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value" paddingAngle={4} strokeWidth={0}>{statusData.map((_,i)=><Cell key={i} fill={PIE_COLORS[statusData[i].name]||'#2563EB'}/>)}</Pie><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,fontSize:10,color:'var(--foreground)'}}/></PieChart></ResponsiveContainer>
        <div className="flex flex-wrap gap-2 justify-center mt-2">{statusData.map((s,i)=><span key={i} className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="rounded-full" style={{width:6,height:6,background:PIE_COLORS[s.name]||'#2563EB'}}/>{s.name} ({s.value})</span>)}</div>
      </Cd>
    </div>

    {/* Programs + Recent Activity */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="md:col-span-2">
        <div className="text-xs font-bold mb-3 uppercase tracking-[0.15em] text-secondary-foreground">Programs</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{prg.map((p,i)=>{
          const h = healthMap[p.id];
          const am = apiMetrics[p.id];
          const comp = am?.composite ?? h?.composite ?? 0;
          const color = healthColor(comp);
          const label = healthLabel(comp);
          return(<Cd key={p.id} delay={.4+i*.05} onClick={()=>go(p.id)} className="p-4 relative overflow-hidden group">
          {p.mode==="planning"&&<div className="absolute top-2 right-2 px-2 py-0.5 rounded font-black tracking-[0.15em] text-[7px]" style={{background:u.purD,color:u.pur}}>DRAFT</div>}
          <div className="flex items-center gap-2 mb-2"><TB type={p.type}/><span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{background:healthBg(comp),color}}>{label} {comp}</span></div>
          <div className="text-sm font-bold mb-1 text-foreground">{p.name}</div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Av user={p.owner} size={18}/><span className="text-xs text-secondary-foreground">{p.owner.name}</span></div>
            {h&&<div className="flex items-center gap-1">{Object.entries(h.dims).map(([k,v])=><span key={k} className="rounded-full inline-block" style={{width:8,height:8,background:healthColor(am ? (am[k as keyof ProgramMetric] as MetricsDim)?.score ?? v : v)}} title={`${DIM_META[k].label}: ${v}`}/>)}</div>}
          </div>
          <GB pct={p.progress} color={color}/>
          <div className="flex justify-between mt-1.5"><span className="text-xs text-muted-foreground">{p.progress}%</span><span className="text-xs flex items-center gap-1 text-muted-foreground"><I name="chat" size={9} color="var(--muted-foreground)"/>{com.filter(c=>c.eId===p.id).length}</span></div>
        </Cd>)})}</div>
      </div>

      {/* Recent activity feed */}
      <div>
        <div className="text-xs font-bold mb-3 uppercase tracking-[0.15em] text-secondary-foreground">Recent Activity</div>
        <Cd delay={.5} hover={false} className="p-4">
          <div className="space-y-3">{recent.map((c,i)=>(
            <motion.div key={c.id} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:.5+i*.06}}
              className={`flex gap-2.5 pb-3 ${i<recent.length-1?'border-b border-border':''}`}>
              <Av user={c.author} size={24}/>
              <div className="flex-1 min-w-0"><div className="text-xs font-bold truncate text-foreground">{c.author.name}</div><div className="text-xs truncate text-muted-foreground">{c.body.slice(0,60)}…</div><div className="text-xs mt-1 text-muted-foreground">{fmtD(c.ts)}</div></div>
            </motion.div>
          ))}</div>
        </Cd>
        <Cd delay={.6} hover={false} className="p-4 mt-3">
          <div className="text-xs font-bold mb-3 text-foreground">Upcoming Milestones</div>
          {(() => {
            const now = new Date();
            const upcoming = prg.flatMap(p => (p.milestones || [])
              .filter(m => m.date && m.status === 'pending' && new Date(m.date) >= now)
              .map(m => ({ ...m, prgName: p.name.split(' ').slice(0, 2).join(' '), prgId: p.id }))
            ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4);
            const overdue = prg.flatMap(p => (p.milestones || [])
              .filter(m => m.date && m.status === 'pending' && new Date(m.date) < now)
              .map(m => ({ ...m, prgName: p.name.split(' ').slice(0, 2).join(' '), prgId: p.id }))
            ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 2);
            const all = [...overdue.map(m => ({ ...m, overdue: true })), ...upcoming.map(m => ({ ...m, overdue: false }))];
            return all.length === 0
              ? <div className="text-xs text-muted-foreground py-4 text-center">No upcoming milestones</div>
              : all.map((m, i) => (
                <div key={i} className={`flex items-center gap-2 py-2 ${i < all.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="w-1.5 rounded-full h-6" style={{ background: m.overdue ? u.err : u.ok }} />
                  <div className="flex-1"><div className="text-xs font-semibold text-foreground">{m.name}</div><div className="text-xs text-muted-foreground">{m.prgName}</div></div>
                  <div className="flex items-center gap-1">
                    {m.overdue && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: u.errD, color: u.err }}>LATE</span>}
                    <I name="calendar" size={10} color="var(--muted-foreground)" />
                    <span className="text-xs font-mono text-secondary-foreground">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ));
          })()}
        </Cd>
      </div>
    </div>
  </motion.div>);
}
