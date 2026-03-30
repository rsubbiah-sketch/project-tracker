import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as I } from "../components/Icons";
import { g, u, accent, accentText } from "../tokens";
import { useIsMobile } from "../hooks/useIsMobile";
import { SB, TB, GB, Counter, Cd } from "../components/ui";
import { useCurrentUser } from '../hooks/useCurrentUser';
import { GATES } from "../data/gates";
import type { Program } from "../types";
import { setGateItemStatus, addCustomGateItem } from '../services/api';

export default function GateReview({prg,setPrg,gateSt,setGateSt,customGates,setCustomGates}){
  const ME = useCurrentUser();
  const mob=useIsMobile();
  const[sel,setSel]=useState(prg.filter(p=>p.mode==="active")[0]?.id);
  const[approved,setApproved]=useState(null);
  const[newItem,setNewItem]=useState("");
  const p=prg.find(x=>x.id===sel);const gd=GATES[p?.type]||GATES.Software;const cp=p?.phase;const cg=gd?.find(x=>x.ph===cp);
  /* Merge default gate items with custom ones */
  const customKey=`${sel}-${cp}`;
  const customItems=customGates[customKey]||[];
  const gs=item=>gateSt[`${sel}-${cp}-${item}`]||"Pending";const ss=(item,s)=>{setGateSt(prev=>({...prev,[`${sel}-${cp}-${item}`]:s}));setGateItemStatus({ id: `${sel}-${cp}-${item}`, done: s === "Passed" }).catch(() => {});};
  const addGateItem=()=>{if(!newItem.trim())return;setCustomGates(prev=>({...prev,[customKey]:[...(prev[customKey]||[]),newItem.trim()]}));addCustomGateItem({ programId: sel, phase: cp, label: newItem.trim() }).catch(() => {});setNewItem("");};
  const removeGateItem=(item)=>setCustomGates(prev=>({...prev,[customKey]:(prev[customKey]||[]).filter(x=>x!==item)}));
  const sc={Pending:{c:"var(--muted-foreground)",bg:"var(--muted)"},Passed:{c:u.ok,bg:u.okD},Failed:{c:u.err,bg:u.errD},Waived:{c:u.w,bg:u.wD},"In Progress":{c:u.inf,bg:u.infD}};
  const phaseList={"ASIC":["Spec","RTL","Verification","Tapeout","Bring-up","Characterization","Production"],"Hardware":["Schematic","Layout","Fabrication","Assembly","Bring-up","Validation","Production"],"Software":["Planning","Development","Integration","Testing","Staging","Release"]};
  if(!p)return null;const baseItems=cg?.items||[];const items=[...baseItems,...customItems];const sts=items.map(gs);
  const passed=sts.filter(s=>s==="Passed").length,failed=sts.filter(s=>s==="Failed").length,waived=sts.filter(s=>s==="Waived").length,pending=sts.filter(s=>s==="Pending"||s==="In Progress").length;
  const ok=pending===0&&failed===0&&items.length>0;

  const approveGate=()=>{
    if(!ok||!p)return;
    const phases=phaseList[p.type]||phaseList.Software;
    const currentIdx=phases.indexOf(p.phase);
    const nextPhase=phases[currentIdx+1];
    if(!nextPhase){setApproved("final");return;}
    setPrg(prev=>prev.map(x=>x.id===p.id?{...x,phase:nextPhase,progress:Math.min(x.progress+Math.round((1/phases.length)*100),99)}:x));
    setApproved(nextPhase);
    setTimeout(()=>setApproved(null),3000);
  };

  return(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    {/* Success toast */}
    <AnimatePresence>{approved&&(
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="mb-5 p-4 rounded-xl flex items-center gap-3" style={{background:u.okD,border:`1px solid ${u.ok}`}}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:u.ok}}><I name="check" size={20} color="var(--background)"/></div>
        <div><div className="text-sm font-bold" style={{color:u.ok}}>{approved==="final"?"All gates passed — program complete!":` Gate approved! ${p.name} advanced to ${approved}`}</div><div className="text-xs mt-0.5 text-secondary-foreground">Gate review recorded · {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})} · Approved by {ME.name}</div></div>
      </motion.div>
    )}</AnimatePresence>

    <div className="flex gap-2 mb-5 flex-wrap overflow-x-auto pb-1">{prg.filter(x=>x.mode==="active").map(x=><motion.button key={x.id} whileTap={{scale:.95}} onClick={()=>{setSel(x.id);setApproved(null);}} className="px-3 md:px-4 py-1.5 rounded-full text-xs font-bold flex-shrink-0" style={{background:sel===x.id?accent:'var(--card)',color:sel===x.id?accentText:'var(--secondary-foreground)',border:`1px solid ${sel===x.id?accent:'var(--border)'}`}}>{mob?x.name.split(" ").slice(0,2).join(" "):x.name}</motion.button>)}</div>
    <Cd delay={0} hover={false} className="p-4 md:p-5 mb-5"><div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2"><div><h3 className="text-base md:text-lg font-black text-foreground">{p.name} — {cp} Gate</h3><p className="text-xs mt-0.5 text-muted-foreground">Verify all checklist items before advancing</p></div><div className="flex gap-2"><SB status={p.status}/><TB type={p.type}/></div></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">{[{l:"Passed",v:passed,c:u.ok},{l:"Failed",v:failed,c:u.err},{l:"Waived",v:waived,c:u.w},{l:"Pending",v:pending,c:"var(--muted-foreground)"}].map((s,i)=><div key={i} className="text-center rounded-xl p-2 md:p-3 bg-muted border border-border"><div className="text-xl md:text-2xl font-black" style={{color:s.c}}><Counter value={s.v}/></div><div className="text-xs text-muted-foreground">{s.l}</div></div>)}</div>
      <GB pct={items.length?((passed+waived)/items.length)*100:0} h={8} color={u.ok}/>
    </Cd>
    <Cd delay={.1} hover={false} className="p-4 md:p-5 mb-5"><div className="flex items-center gap-2 mb-3"><I name="shield" size={16} color="var(--foreground)"/><span className="text-sm font-bold text-foreground">Checklist — {cp}</span><span className="text-xs text-muted-foreground">({items.length} items)</span></div>
      <div className="space-y-3">{items.map((item,idx)=>{const st=gs(item);const s=sc[st];const isCustom=customItems.includes(item);return(
        <motion.div key={idx} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:idx*.04}} className="p-3 rounded-xl bg-muted border border-border">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:s.bg,border:`1.5px solid ${s.c}`}}>{st==="Passed"&&<I name="check" size={14} color={u.ok}/>}{st==="Failed"&&<I name="x" size={12} color={u.err}/>}{st==="Waived"&&<span className="text-xs font-bold" style={{color:u.w}}>W</span>}</div>
            <span className="flex-1 text-xs font-medium pt-1" style={{color:st==="Passed"?'var(--muted-foreground)':'var(--foreground)',textDecoration:st==="Passed"?"line-through":"none"}}>{item}</span>
            {isCustom&&<button onClick={()=>removeGateItem(item)} className="flex-shrink-0 p-1 rounded bg-transparent border-none cursor-pointer" title="Remove custom item"><I name="x" size={12} color="var(--muted-foreground)"/></button>}
          </div>
          <div className="flex gap-1 flex-wrap mt-3 ml-10">{["Passed","Failed","Waived","In Progress"].map(x=><motion.button key={x} whileTap={{scale:.88}} onClick={()=>ss(item,x)} className="px-2 md:px-2.5 py-1 rounded-lg cursor-pointer text-[9px]" style={{border:`1px solid ${st===x?sc[x].c:'var(--border)'}`,background:st===x?sc[x].bg:"transparent",color:st===x?sc[x].c:'var(--muted-foreground)',fontWeight:st===x?700:400}}>{x}</motion.button>)}</div>
        </motion.div>);})}</div>
      {/* Add custom gate item */}
      <div className="flex gap-2 mt-3">
        <input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Add checklist item…" className="flex-1 px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addGateItem();}}}/>
        <motion.button whileTap={{scale:.9}} onClick={addGateItem} disabled={!newItem.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold" style={{background:newItem.trim()?accent:'var(--border)',color:newItem.trim()?accentText:'var(--muted-foreground)',opacity:newItem.trim()?1:.5}}>
          <I name="plus" size={12} color={newItem.trim()?accentText:'var(--muted-foreground)'}/>Add
        </motion.button>
      </div>
      <motion.div animate={{borderColor:ok?u.ok:'var(--border)'}} className="mt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 md:p-4 rounded-xl" style={{background:ok?u.okD:'var(--muted)',border:`1px solid ${ok?u.ok:'var(--border)'}`}}>
        <div><div className="text-xs font-bold" style={{color:ok?u.ok:'var(--muted-foreground)'}}>{ok?"All verified — ready to approve":"Complete all items"}</div>{!ok&&<div className="text-xs mt-0.5 text-muted-foreground">{pending} pending · {failed} failed</div>}{ok&&<div className="text-xs mt-0.5 text-secondary-foreground">Click to advance {p.name} to next phase</div>}</div>
        <motion.button whileTap={{scale:.95}} whileHover={ok?{scale:1.03}:{}} disabled={!ok} onClick={approveGate} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold w-full md:w-auto justify-center" style={{background:ok?accent:'var(--border)',color:ok?accentText:'var(--muted-foreground)',opacity:ok?1:.4,cursor:ok?"pointer":"not-allowed"}}><I name="check" size={14} color={ok?accentText:'var(--muted-foreground)'}/>Approve Gate</motion.button>
      </motion.div>
    </Cd>
    {/* All phases overview */}
    <Cd delay={.2} hover={false} className="p-4 md:p-5"><div className="text-xs font-bold mb-3 text-foreground">All Gates — {p.type}</div>
      <div className="grid gap-2" style={{gridTemplateColumns:mob?`repeat(3,1fr)`:`repeat(${gd.length},1fr)`}}>{gd.map((gate,j)=>{const cur=gate.ph===p.phase,past=gd.findIndex(x=>x.ph===p.phase)>j;return(
        <motion.div key={gate.ph} initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:.3+j*.05}} className="text-center rounded-lg p-3" style={{background:cur?`rgba(147,197,253,.1)`:past?`rgba(52,211,153,.05)`:'var(--muted)',border:`1px solid ${cur?'#93C5FD':'var(--border)'}`}}>
          <div className="text-xs mb-2" style={{color:cur?'var(--foreground)':past?u.ok:'var(--muted-foreground)',fontWeight:cur?700:400}}>{gate.ph}</div>
          <div className="text-lg font-black" style={{color:past?u.ok:cur?'var(--foreground)':'var(--muted-foreground)'}}>{past?"✓":gate.items.length}</div>
          <div className="text-[8px]" style={{color:'var(--muted-foreground)'}}>{past?"Passed":"items"}</div>
        </motion.div>);})}</div>
    </Cd>
  </motion.div>);
}
