import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as I } from "../components/Icons";
import { g, u } from "../tokens";
import { useIsMobile } from "../hooks/useIsMobile";
import { SB, GB, Counter, Cd } from "../components/ui";
import type { ImplPhase } from "../types";
import { updateImplTaskStatus } from '../services/api';

export default function TodoView({phases,setPhases}){
  const mob=useIsMobile();
  const[exp,setExp]=useState(phases[0]?.id);const[gExp,setGExp]=useState(null);
  const toggle=(pid,tid)=>{const phase=phases.find(p2=>p2.id===pid);const task=phase?.items.find(t=>t.id===tid);setPhases(p=>p.map(x=>x.id===pid?{...x,items:x.items.map(t=>t.id===tid?{...t,s:t.s==="Done"?"Pending":"Done"}:t)}:x));updateImplTaskStatus(pid, tid, task?.s === "Done" ? "Pending" : "Done").catch(() => {});};
  const setSt=(pid,tid,s)=>{setPhases(p=>p.map(x=>x.id===pid?{...x,items:x.items.map(t=>t.id===tid?{...t,s}:t)}:x));updateImplTaskStatus(pid, tid, s).catch(() => {});};
  const allD=phases.reduce((a,p)=>a+p.items.filter(t=>t.s==="Done").length,0),allT=phases.reduce((a,p)=>a+p.items.length,0);
  const so=["Pending","In Progress","Done","Blocked"];
  const sC={Pending:{c:"var(--muted-foreground)",bg:"transparent"},"In Progress":{c:u.inf,bg:u.infD},Done:{c:u.ok,bg:u.okD},Blocked:{c:u.err,bg:u.errD}};
  return(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <Cd delay={0} hover={false} className="p-4 md:p-5 mb-5" style={{background:`linear-gradient(135deg,rgba(147,197,253,.05),rgba(96,165,250,.03))`}}>
      <div className="flex items-center justify-between mb-3"><div><h3 className="text-base md:text-lg font-black text-foreground">Implementation TODO</h3><p className="text-xs mt-0.5 text-secondary-foreground">6 phases · 45 tasks · 20 weeks</p></div><div className="text-right"><div className="text-2xl md:text-3xl font-black text-foreground"><Counter value={allD}/><span className="text-base md:text-lg text-muted-foreground">/{allT}</span></div><div className="text-xs text-muted-foreground">complete</div></div></div>
      <GB pct={(allD/allT)*100} h={10}/>
    </Cd>
    <div className="space-y-3">{phases.map((phase,pi)=>{const done=phase.items.filter(t=>t.s==="Done").length,total=phase.items.length,isE=exp===phase.id,isG=gExp===phase.id;return(
      <Cd key={phase.id} delay={.05+pi*.04} hover={false} className="overflow-hidden">
        <motion.div whileHover={{backgroundColor:`rgba(226,230,236,.13)`}} onClick={()=>setExp(isE?null:phase.id)} className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 cursor-pointer">
          <motion.div animate={{rotate:isE?90:0}}><I name="chevR" size={13} color="var(--muted-foreground)"/></motion.div>
          {!mob&&<div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black" style={{background:`rgba(147,197,253,.1)`,color:'#2563EB',border:`1px solid rgba(147,197,253,.2)`}}>{phase.id}</div>}
          <div className="flex-1 min-w-0"><div className="text-sm font-bold truncate text-foreground">{phase.name}</div><div className="text-xs text-muted-foreground">{mob?`Wk ${phase.wk}`:`Weeks ${phase.wk} · ${total} tasks`}</div></div>
          <div className="w-16 md:w-24 flex-shrink-0"><GB pct={(done/total)*100} h={5}/><div className="text-center text-xs mt-1 text-muted-foreground">{done}/{total}</div></div>
          {!mob&&<SB status={done===total?"Completed":done>0?"On Track":"Not Started"}/>}
        </motion.div>
        <AnimatePresence>{isE&&(<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.3}} className="px-5 pb-5">
          <div className="space-y-3">{phase.items.map((task,ti)=>(
            <motion.div key={task.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:ti*.03}} className="px-3 py-2.5 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-2 md:gap-3">
                <motion.button whileTap={{scale:.8}} onClick={()=>toggle(phase.id,task.id)} className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer" style={{border:`1.5px solid ${task.s==="Done"?u.ok:'var(--muted-foreground)'}`,background:task.s==="Done"?u.okD:"transparent"}}>{task.s==="Done"&&<I name="check" size={12} color={u.ok}/>}</motion.button>
                <span className="flex-1 text-xs min-w-0" style={{color:task.s==="Done"?'var(--muted-foreground)':'var(--foreground)',textDecoration:task.s==="Done"?"line-through":"none",fontWeight:task.s==="Done"?400:500}}>{task.t}</span>
                {!mob&&<span className="text-[9px] px-2 py-0.5 rounded-md flex-shrink-0 bg-card text-muted-foreground">{task.o}</span>}
              </div>
              <div className="flex gap-1 flex-wrap mt-3 ml-7 md:ml-8">{so.map(x=>{const sty=sC[x]||sC.Pending;return<motion.button key={x} whileTap={{scale:.88}} onClick={()=>setSt(phase.id,task.id,x)} className="px-2 py-0.5 rounded-md cursor-pointer text-[8px]" style={{border:`1px solid ${task.s===x?sty.c:'var(--border)'}`,background:task.s===x?sty.bg:"transparent",color:task.s===x?sty.c:'var(--muted-foreground)',fontWeight:task.s===x?700:400}}>{x}</motion.button>;})}</div>
            </motion.div>))}</div>
          <motion.button whileTap={{scale:.98}} onClick={()=>setGExp(isG?null:phase.id)} className="flex items-center gap-2 w-full mt-3 px-4 py-2 rounded-xl text-xs font-bold text-left" style={{background:`rgba(147,197,253,.06)`,border:`1px solid rgba(147,197,253,.15)`,color:'var(--foreground)'}}><I name="shield" size={14} color="#2563EB"/>Gate Verification ({phase.gc.length})<motion.span animate={{rotate:isG?180:0}} className="ml-auto"><I name="chevD" size={12} color="#2563EB"/></motion.span></motion.button>
          <AnimatePresence>{isG&&(<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="mt-3 p-5 rounded-xl bg-muted border border-border">
            {phase.gc.map((ck,ci)=><div key={ci} className={`flex items-center gap-3 py-2.5 ${ci<phase.gc.length-1?'border-b border-border':''}`}><div className="w-5 h-5 rounded-md border border-border flex-shrink-0"/><span className="text-xs text-secondary-foreground">{ck}</span></div>)}
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-lg" style={{background:u.wD}}><I name="alert" size={13} color={u.w}/><span className="text-xs font-bold" style={{color:u.w}}>PM must verify all before advancing</span></div>
          </motion.div>)}</AnimatePresence>
        </motion.div>)}</AnimatePresence>
      </Cd>);})}</div>
  </motion.div>);
}
