import { useState } from "react";
import { motion } from "framer-motion";
import { Icon as I } from "../components/Icons";
import { u, ST } from "../tokens";
import { useIsMobile } from "../hooks/useIsMobile";
import { SB, TB, GB, Cd } from "../components/ui";
import type { Program } from "../types";

export default function PlanView({prg,setPrg}){
  const mob=useIsMobile();
  const planning=prg.filter(p=>p.mode==="planning"),active=prg.filter(p=>p.mode==="active");
  const[cf,setCf]=useState(null);const activate=id=>{setPrg(p=>p.map(x=>x.id===id?{...x,mode:"active",status:"On Track"}:x));setCf(null);};
  const ph={ASIC:["Spec","RTL","Verification","Tapeout","Bring-up","Characterization","Production"],Hardware:["Schematic","Layout","Fabrication","Assembly","Bring-up","Validation","Production"],Software:["Planning","Development","Integration","Testing","Staging","Release"]};
  return(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <Cd delay={0} hover={false} className="p-4 md:p-5 mb-5" style={{background:`linear-gradient(135deg,var(--card),rgba(167,139,250,.05))`}}>
      <div className="flex items-center gap-2 mb-3 flex-wrap"><I name="plan" size={18} color={u.pur}/><span className="text-sm font-bold text-foreground">Plan Mode</span><span className="text-xs font-black px-2 py-0.5 rounded" style={{background:u.purD,color:u.pur}}>READ-ONLY</span></div>
      <p className="text-xs leading-relaxed text-secondary-foreground">Map phases, milestones, and dependencies before execution. Activate to lock baseline and begin tracking.</p>
    </Cd>
    {planning.length>0&&<>{planning.map((p,i)=>{const pl=ph[p.type]||ph.Software;const ci=pl.indexOf(p.phase);return(
      <Cd key={p.id} delay={i*.06} hover={false} className="p-4 md:p-5 mb-4 relative" style={{borderStyle:"dashed",borderColor:'var(--border)'}}>
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded font-black tracking-[0.15em] text-xs" style={{background:u.purD,color:u.pur}}>DRAFT</div>
        <div className="flex items-center gap-2 mb-3 flex-wrap"><TB type={p.type}/><span className="text-sm md:text-base font-bold text-foreground">{p.name}</span></div>
        <p className="text-xs mb-5 text-secondary-foreground">{p.desc}</p>
        <div className="text-xs font-bold uppercase tracking-[0.15em] mb-3 text-muted-foreground">Phase Timeline</div>
        <div className={mob?"overflow-x-auto -mx-3 px-3 pb-2":""}><div className="flex gap-1.5 mb-5" style={mob?{minWidth:pl.length*72}:{}}>{pl.map((pn,j)=><motion.div key={pn} initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.1+j*.06}} className="flex-1 h-9 rounded-lg flex items-center justify-center text-xs relative" style={{background:j<ci?u.okD:j===ci?u.purD:'var(--muted)',border:`1.5px solid ${j===ci?u.pur:'var(--border)'}`,color:j<ci?u.ok:j===ci?u.pur:'var(--muted-foreground)',fontWeight:j===ci?700:400}}>{pn}</motion.div>)}</div></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2"><span className="text-xs text-muted-foreground">{p.owner.name} · Team {p.team} · {p.start} → {p.target}</span>
          {cf===p.id?<div className="flex items-center gap-2"><span className="text-xs font-bold" style={{color:u.w}}>Lock baseline?</span><motion.button whileTap={{scale:.95}} onClick={()=>activate(p.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:u.ok,color:'var(--background)'}}>Confirm</motion.button><button onClick={()=>setCf(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-border text-secondary-foreground border-none cursor-pointer">Cancel</button></div>
          :<motion.button whileTap={{scale:.95}} onClick={()=>setCf(p.id)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold" style={{background:u.pur,color:"#fff"}}><I name="check" size={12} color="#fff"/>Activate</motion.button>}
        </div>
      </Cd>)})}</>}
    <div className="text-xs font-bold uppercase tracking-[0.15em] mb-3 mt-5 flex items-center gap-2" style={{color:'#2563EB'}}><span className="w-2 h-2 rounded-full" style={{background:'#2563EB'}}/>Active — Plan vs Actual ({active.length})</div>
    {/* Gantt-style timeline */}
    <Cd delay={.15} hover={false} className="p-4 md:p-5 mb-4"><div className="text-xs font-bold mb-3 text-foreground">Program Timeline</div>
      <div className="space-y-3">{active.map((p,i)=>{const pl=ph[p.type]||ph.Software;const ci=pl.indexOf(p.phase);const pct=((ci+p.progress/100)/(pl.length))*100;return(
        <div key={p.id}>
          {mob&&<div className="mb-2"><div className="text-xs font-bold truncate text-foreground">{p.name}</div></div>}
          <div className="flex items-center gap-2 md:gap-3">
          {!mob&&<div className="w-40 flex-shrink-0"><div className="text-xs font-bold truncate text-foreground">{p.name}</div><div className="text-xs text-muted-foreground">{p.phase}</div></div>}
          <div className="flex-1 relative h-8 rounded-lg overflow-hidden bg-muted">
            <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1,delay:.2+i*.1}} className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-2"
              style={{background:`linear-gradient(90deg,${ST[p.status]?.c||'#2563EB'}22,${ST[p.status]?.c||'#2563EB'}44)`}}>
              <span className="text-xs font-bold" style={{color:ST[p.status]?.c||'#2563EB'}}>{p.progress}%</span>
            </motion.div>
            {/* Phase markers */}
            {pl.map((_,j)=><div key={j} className="absolute top-0 bottom-0 w-px bg-border" style={{left:`${(j/pl.length)*100}%`}}/>)}
          </div>
          <SB status={p.status}/>
        </div></div>);})}</div>
    </Cd>
  </motion.div>);
}
