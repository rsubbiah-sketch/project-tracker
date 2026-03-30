import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as I } from "../components/Icons";
import { u, accent, accentText } from "../tokens";
import { useIsMobile } from "../hooks/useIsMobile";
import { Av, TB, Counter, Cd } from "../components/ui";
import { USERS } from "../data";
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { Task, Program } from "../types";
import { createTask as apiCreateTask, updateTask as apiUpdateTask } from '../services/api';

export default function TasksView({tasks,setTasks,prg,goDetail}){
  const ME = useCurrentUser();
  const mob=useIsMobile();
  const[filter,setFilter]=useState("All");
  const[assigneeFilter,setAssigneeFilter]=useState("mine");
  const[sortBy,setSortBy]=useState("priority");
  const[showNewTask,setShowNewTask]=useState(false);
  const[nt,setNt]=useState({title:"",prgId:prg[0]?.id||"",assignee:USERS[0].id,priority:"P1",due:"",desc:""});

  const createTask=()=>{
    if(!nt.title.trim()||!nt.prgId)return;
    setTasks(prev=>[...prev,{id:`TK-${String(prev.length+1).padStart(3,"0")}`,title:nt.title,prgId:nt.prgId,assignee:USERS.find(u2=>u2.id===nt.assignee)||USERS[0],reporter:ME,priority:nt.priority,status:"Todo",due:nt.due,desc:nt.desc}]);
    apiCreateTask({ title: nt.title, prgId: nt.prgId, assignee: nt.assignee, priority: nt.priority, due: nt.due, desc: nt.desc }).catch(() => {});
    setNt({title:"",prgId:prg[0]?.id||"",assignee:USERS[0].id,priority:"P1",due:"",desc:""});setShowNewTask(false);
  };

  const filtered=tasks.filter(t=>{
    if(assigneeFilter==="mine"&&t.assignee.id!==ME.id)return false;
    if(filter!=="All"&&t.status!==filter)return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==="priority"){const p={"P0":0,"P1":1,"P2":2,"P3":3};return (p[a.priority]||9)-(p[b.priority]||9);}
    if(sortBy==="due")return (a.due||"z").localeCompare(b.due||"z");
    if(sortBy==="status"){const s={"Todo":0,"In Progress":1,"In Review":2,"Done":3};return (s[a.status]||9)-(s[b.status]||9);}
    return 0;
  });

  const myOpen=tasks.filter(t=>t.assignee.id===ME.id&&t.status!=="Done");
  const allOpen=tasks.filter(t=>t.status!=="Done");
  const p0Count=tasks.filter(t=>t.priority==="P0"&&t.status!=="Done").length;
  const overdue=tasks.filter(t=>t.due&&new Date(t.due)<new Date()&&t.status!=="Done").length;

  const priC={"P0":{c:u.err,bg:u.errD},"P1":{c:u.w,bg:u.wD},"P2":{c:u.inf,bg:u.infD},"P3":{c:'#2563EB',bg:"rgba(147,197,253,.1)"}};
  const stC2={"Todo":{c:"var(--muted-foreground)",bg:"var(--muted)"},"In Progress":{c:u.inf,bg:u.infD},"In Review":{c:u.pur,bg:u.purD},"Done":{c:u.ok,bg:u.okD}};

  return(
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      {/* Header with New Task button top-right */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-bold text-foreground">My Tasks</h2>
        <motion.button whileTap={{scale:.95}} onClick={()=>setShowNewTask(!showNewTask)} className="px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5" style={{background:showNewTask?'var(--border)':accent,color:showNewTask?'var(--foreground)':accentText,border:`1px solid ${showNewTask?'var(--border)':accent}`}}>
          <I name={showNewTask?"x":"plus"} size={12} color={showNewTask?'var(--foreground)':accentText}/>{showNewTask?"Cancel":"New Task"}
        </motion.button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[{l:"My Open Tasks",v:myOpen.length,c:"var(--foreground)",ic:"clipboard"},{l:"All Open",v:allOpen.length,c:u.inf,ic:"list"},{l:"P0 Critical",v:p0Count,c:u.err,ic:"flag"},{l:"Overdue",v:overdue,c:u.err,ic:"alert"}].map((s,i)=>(
          <Cd key={i} delay={i*.06} className="p-4 md:p-5"><div className="flex justify-between items-center mb-3"><span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{s.l}</span><I name={s.ic} size={14} color={s.c}/></div><div className="text-2xl md:text-3xl font-black" style={{color:s.c}}><Counter value={s.v}/></div></Cd>
        ))}
      </div>

      {/* New Task Form */}
      <AnimatePresence>{showNewTask&&(
        <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}>
          <Cd delay={0} hover={false} className="p-4 mb-5">
            <div className="flex items-center gap-2 mb-3"><I name="clipboard" size={16} color="var(--foreground)"/><span className="text-sm font-bold text-foreground">Create New Task</span></div>
            <div className="space-y-3">
              <input value={nt.title} onChange={e=>setNt({...nt,title:e.target.value})} placeholder="Task title…" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none bg-card border border-border text-foreground focus:border-primary"/>
              <textarea value={nt.desc} onChange={e=>setNt({...nt,desc:e.target.value})} placeholder="Description…" rows={2} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none bg-card border border-border text-foreground focus:border-primary"/>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="text-xs mb-1 block font-medium text-muted-foreground">Program</label>
                  <select value={nt.prgId} onChange={e=>setNt({...nt,prgId:e.target.value})} className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground">
                    {prg.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs mb-1 block font-medium text-muted-foreground">Assignee</label>
                  <select value={nt.assignee} onChange={e=>setNt({...nt,assignee:e.target.value})} className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground">
                    {USERS.map(u2=><option key={u2.id} value={u2.id}>{u2.name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs mb-1 block font-medium text-muted-foreground">Priority</label>
                  <select value={nt.priority} onChange={e=>setNt({...nt,priority:e.target.value})} className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground">
                    {["P0","P1","P2","P3"].map(p2=><option key={p2} value={p2}>{p2}</option>)}
                  </select>
                </div>
                <div><label className="text-xs mb-1 block font-medium text-muted-foreground">Due Date</label>
                  <input type="date" value={nt.due} onChange={e=>setNt({...nt,due:e.target.value})} className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground"/>
                </div>
              </div>
              <motion.button whileTap={{scale:.95}} disabled={!nt.title.trim()} onClick={createTask} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold" style={{background:nt.title.trim()?accent:'var(--border)',color:nt.title.trim()?accentText:'var(--muted-foreground)',opacity:nt.title.trim()?1:.5}}>
                <I name="plus" size={12} color={nt.title.trim()?accentText:'var(--muted-foreground)'}/>Create Task
              </motion.button>
            </div>
          </Cd>
        </motion.div>
      )}</AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-5">
        <div className="flex gap-1.5">
          {["mine","all"].map(x=><motion.button key={x} whileTap={{scale:.95}} onClick={()=>setAssigneeFilter(x)} className="px-3 md:px-4 py-1.5 rounded-full text-xs font-bold capitalize" style={{background:assigneeFilter===x?accent:'var(--card)',color:assigneeFilter===x?accentText:'var(--secondary-foreground)',border:`1px solid ${assigneeFilter===x?accent:'var(--border)'}`}}>{x==="mine"?"My Tasks":"All Tasks"}</motion.button>)}
          {!mob&&<div className="w-px h-6 mx-1 bg-border"/>}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 flex-shrink-0">{["All","Todo","In Progress","In Review","Done"].map(x=><motion.button key={x} whileTap={{scale:.95}} onClick={()=>setFilter(x)} className="px-2.5 md:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{background:filter===x?`${accent}18`:'var(--card)',color:filter===x?accentText:'var(--muted-foreground)',border:`1px solid ${filter===x?accent+"55":'var(--border)'}`}}>{x}</motion.button>)}</div>
        <div className="md:ml-auto flex items-center gap-1"><span className="text-xs text-muted-foreground">Sort:</span>{["priority","due","status"].map(x=><motion.button key={x} whileTap={{scale:.95}} onClick={()=>setSortBy(x)} className="px-2 py-1 rounded text-xs capitalize border-none cursor-pointer" style={{background:sortBy===x?'var(--border)':"transparent",color:sortBy===x?accentText:'var(--muted-foreground)'}}>{x}</motion.button>)}</div>
      </div>

      {/* Task list */}
      {filtered.length===0?<Cd delay={.1} hover={false} className="p-10 text-center"><div className="text-sm text-muted-foreground">No tasks match your filters</div></Cd>:
      <div className="space-y-3">{filtered.map((tk,i)=>{
        const pri=priC[tk.priority]||priC["P3"];
        const st=stC2[tk.status]||stC2["Todo"];
        const prgName=prg.find(x=>x.id===tk.prgId)?.name||"";
        const prgType=prg.find(x=>x.id===tk.prgId)?.type||"Software";
        const isOverdue=tk.due&&new Date(tk.due)<new Date()&&tk.status!=="Done";
        return(
          <Cd key={tk.id} delay={.05+i*.03} className="p-4 md:p-5" style={{borderColor:isOverdue?`${u.err}44`:undefined}}>
            <div className="flex items-start gap-3">
              <motion.button whileTap={{scale:.8}} onClick={()=>{setTasks(prev=>prev.map(t=>t.id===tk.id?{...t,status:t.status==="Done"?"Todo":"Done"}:t));apiUpdateTask(tk.id, { status: tk.status === "Done" ? "Todo" : "Done" }).catch(() => {});}}
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer mt-0.5" style={{border:`1.5px solid ${tk.status==="Done"?u.ok:'var(--muted-foreground)'}`,background:tk.status==="Done"?u.okD:"transparent"}}>
                {tk.status==="Done"&&<I name="check" size={12} color={u.ok}/>}
              </motion.button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">{tk.id}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{color:pri.c,background:pri.bg}}>{tk.priority}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{color:st.c,background:st.bg}}>{tk.status}</span>
                  {isOverdue&&<span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{color:u.err,background:u.errD}}>OVERDUE</span>}
                </div>
                <div className="text-sm font-bold mb-2" style={{color:tk.status==="Done"?'var(--muted-foreground)':'var(--foreground)',textDecoration:tk.status==="Done"?"line-through":"none"}}>{tk.title}</div>
                {tk.desc&&<div className="text-xs mb-3 text-muted-foreground">{mob?tk.desc.slice(0,80):tk.desc}</div>}
                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                  <button onClick={()=>goDetail(tk.prgId)} className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md bg-border border-none cursor-pointer" style={{color:'#2563EB'}}><TB type={prgType}/>{!mob&&<span>{prgName}</span>}</button>
                  {tk.due&&<span className="flex items-center gap-1 text-xs" style={{color:isOverdue?u.err:'var(--muted-foreground)'}}><I name="calendar" size={10} color={isOverdue?u.err:'var(--muted-foreground)'}/>{tk.due}</span>}
                  {!mob&&<span className="flex items-center gap-1 text-xs text-muted-foreground"><I name="user" size={10} color="var(--muted-foreground)"/>Reported by {tk.reporter.name}</span>}
                </div>
                {/* Assignee row - inline on mobile */}
                <div className="flex items-center gap-2 mt-3">
                  <Av user={tk.assignee} size={mob?20:22}/>
                  <span className="text-xs font-bold text-foreground">{tk.assignee.name}</span>
                  {!mob&&<span className="text-xs text-muted-foreground">{tk.assignee.role}</span>}
                  <select value={tk.assignee.id} onChange={e=>{const newUser=USERS.find(u2=>u2.id===e.target.value);if(newUser)setTasks(prev=>prev.map(t=>t.id===tk.id?{...t,assignee:newUser}:t));}}
                    className="text-[9px] px-2 py-1 rounded-md outline-none cursor-pointer ml-auto bg-card border border-border text-secondary-foreground">
                    {USERS.map(u2=><option key={u2.id} value={u2.id}>{u2.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {/* Status buttons */}
            <div className="flex gap-1 md:gap-1.5 mt-3 ml-8 flex-wrap">{["Todo","In Progress","In Review","Done"].map(s=>(
              <motion.button key={s} whileTap={{scale:.9}} onClick={()=>{setTasks(prev=>prev.map(t=>t.id===tk.id?{...t,status:s}:t));apiUpdateTask(tk.id, { status: s }).catch(() => {});}}
                className="px-2 md:px-3 py-1 rounded-lg cursor-pointer text-xs font-medium" style={{border:`1px solid ${tk.status===s?(stC2[s]||stC2.Todo).c:'var(--border)'}`,background:tk.status===s?(stC2[s]||stC2.Todo).bg:"transparent",color:tk.status===s?(stC2[s]||stC2.Todo).c:'var(--muted-foreground)'}}>{s}</motion.button>
            ))}</div>
          </Cd>
        );
      })}</div>}
    </motion.div>
  );
}
