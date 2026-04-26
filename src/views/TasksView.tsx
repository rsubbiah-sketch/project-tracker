import { useState } from "react";
import { motion } from "framer-motion";
import { Icon as I } from "../components/Icons";
import { u } from "../tokens";
import { useIsMobile } from "../hooks/useIsMobile";
import CreateTaskDialog from "../components/CreateTaskDialog";
import TaskTable from "../components/TaskTable";
import { Cd } from "../components/ui";
import { useUsers } from '../hooks/useUsers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { Task, Program, Comment, Reply } from "../types";
import { createTask as apiCreateTask, updateTask as apiUpdateTask } from '../services/api';
import { mapTask } from '../services/mappers';
import Comments from './Comments';

export default function TasksView({tasks,setTasks,prg,goDetail,com,setCom,rep,setRep}:{tasks:Task[];setTasks:React.Dispatch<React.SetStateAction<Task[]>>;prg:Program[];goDetail:(id:string)=>void;com:Comment[];setCom:React.Dispatch<React.SetStateAction<Comment[]>>;rep:Reply[];setRep:React.Dispatch<React.SetStateAction<Reply[]>>}){
  const ME = useCurrentUser();
  const USERS = useUsers();
  const mob=useIsMobile();
  const[filter,setFilter]=useState("All");
  const[assigneeFilter,setAssigneeFilter]=useState("mine");
  const[sortBy,setSortBy]=useState("priority");
  const[showNewTask,setShowNewTask]=useState(false);
  const[expanded,setExpanded]=useState<string|null>(null);
  const[editingTask,setEditingTask]=useState<Task|null>(null);
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

  const statsCfg = [
    { l: "My Open Tasks", v: myOpen.length, icon: "clipboard", desc: "Assigned to you", trend: `${tasks.length ? Math.round((myOpen.length / Math.max(1, tasks.filter(t=>t.assignee.id===ME.id).length)) * 100) : 0}%`, trendUp: myOpen.length < 5 },
    { l: "All Open", v: allOpen.length, icon: "list", desc: "Portfolio-wide", trend: `${tasks.length}`, trendUp: true },
    { l: "P0 Critical", v: p0Count, icon: "flag", desc: "Need immediate action", trend: p0Count > 0 ? "Urgent" : "Clear", trendUp: p0Count === 0 },
    { l: "Overdue", v: overdue, icon: "alert", desc: "Past due date", trend: overdue > 0 ? "Attention" : "On time", trendUp: overdue === 0 },
  ];

  return(
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your assigned tasks and action items</p>
        </div>
        <button onClick={()=>setShowNewTask(true)} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
          <I name="plus" size={14} color="currentColor"/>New Task
        </button>
      </div>
      {/* Stats — dashboard style */}
      <div className={`grid gap-4 mb-6 ${mob ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {statsCfg.map((s,i)=>(
          <Cd key={i} delay={i*.06} hover={false} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{s.l}</span>
              <I name={s.icon} size={16} color="var(--muted-foreground)" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-2">{s.v}</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{color:s.trendUp?u.ok:u.w,background:s.trendUp?u.okD:u.wD}}>
                {s.trendUp?'↑':'↓'} {s.trend}
              </span>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </div>
          </Cd>
        ))}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showNewTask}
        onClose={() => setShowNewTask(false)}
        onSubmit={async (d) => {
          try {
            const saved = await apiCreateTask({ title: d.title, programId: d.prgId, assigneeId: d.assignee, priority: d.priority, status: d.status, dueDate: d.due, description: d.desc });
            setTasks(prev => [...prev, mapTask(saved)]);
          } catch (err) {
            console.error('Failed to create task:', err);
            alert('Failed to create task. Please try again.');
          }
        }}
        programs={prg}
        currentUser={ME}
      />

      {/* Edit Task Dialog */}
      <CreateTaskDialog
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={async (d) => {
          if (!editingTask) return;
          const assignee = d.assignee === ME.id ? ME : (USERS.find(u2=>u2.id===d.assignee) || ME);
          setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, title: d.title, prgId: d.prgId, assignee, priority: d.priority, status: d.status, due: d.due, desc: d.desc } : t));
          try {
            await apiUpdateTask(editingTask.id, { title: d.title, programId: d.prgId, assigneeId: d.assignee, priority: d.priority, status: d.status, dueDate: d.due, description: d.desc });
          } catch (err) {
            console.error('Failed to update task:', err);
          }
        }}
        initialTask={editingTask}
        programs={prg}
        currentUser={ME}
      />

      {/* Filters — shadcn tasks style */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-2 mb-5">
        <select
          value={assigneeFilter}
          onChange={e=>setAssigneeFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer"
        >
          <option value="mine">My Tasks</option>
          <option value="all">All Tasks</option>
        </select>
        <select
          value={filter}
          onChange={e=>setFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Done">Done</option>
        </select>
        <div className="md:ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by</span>
          <select
            value={sortBy}
            onChange={e=>setSortBy(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer capitalize"
          >
            <option value="priority">Priority</option>
            <option value="due">Due Date</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Task table — shadcn style */}
      <TaskTable
        tasks={filtered}
        setTasks={setTasks}
        programs={prg}
        showProgramColumn={true}
        onEdit={(tk)=>setEditingTask(tk)}
        expandedId={expanded}
        onRowClick={(id)=>setExpanded(expanded===id?null:id)}
        renderExpanded={(tk)=>(
          <div className="p-4 md:p-5 space-y-3">
            <Comments eId={tk.id} com={com} setCom={setCom} rep={rep} setRep={setRep}/>
          </div>
        )}
      />
    </motion.div>
  );
}
