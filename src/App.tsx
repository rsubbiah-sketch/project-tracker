import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";

import { g, u } from "./tokens";
import { useIsMobile } from "./hooks/useIsMobile";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { useAuth } from "./hooks/useAuth";
import Login from "./views/Login";
import type { Program, Comment, Reply, Notification, Task, Doc, User, HealthOverride } from "./types";
import { setUsersMap, mapProgram, mapTask, mapComment, mapReply, mapNotification, mapDoc } from "./services/mappers";
import { useSetUsers } from "./hooks/useUsers";

import Sidebar from "./layout/Sidebar";
import TopBar from "./layout/TopBar";
import BottomNav from "./layout/BottomNav";
import NotificationDrawer from "./layout/NotificationDrawer";
import CommandPalette from "./layout/CommandPalette";

import Dashboard from "./views/Dashboard";
import ProgramList from "./views/ProgramList";
import ProgramDetail from "./views/ProgramDetail";
import TasksView from "./views/TasksView";
import AdminView from "./views/AdminView";
import HelpView from "./views/HelpView";
import { useRBAC } from "./hooks/useRBAC";

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) return <div className="flex items-center justify-center h-screen bg-background"><div className="text-muted-foreground text-sm">Loading...</div></div>;
  if (!isAuthenticated) return <Login />;

  return <AppMain />;
}

function AppMain() {
  const [view, setView] = useState("dashboard");
  const [prg, setPrg] = useState<Program[]>([]);
  const [com, setCom] = useState<Comment[]>([]);
  const [rep, setRep] = useState<Reply[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  // Tracks which view the user was on before opening a program detail,
  // so the detail's Back button can restore it instead of always landing on Programs.
  const [originView, setOriginView] = useState<string>("programs");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mob = useIsMobile();
  const ME = useCurrentUser();
  const rbac = useRBAC();
  const setContextUsers = useSetUsers();
  const [users, setUsers] = useState<User[]>([]);
  const [healthOverrides, setHealthOverrides] = useState<Record<string, HealthOverride>>({});


  /* ═══ LOAD DATA FROM API (fall back to hardcoded) ═══ */
  const loadData = useCallback(async () => {
    const api = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const base = api.replace(/\/api\/?$/, '');
    try {
      const healthRes = await fetch(base + '/health', { cache: 'no-store' });
      if (!healthRes.ok) throw new Error('API down');
      console.info("API connected");

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const get = (path: string) => fetch(`${api}${path}`, { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : []);

      // Fetch users first (needed for mapping)
      const usersData = await get('/users');
      if (usersData.length) {
        setUsersMap(usersData);
        const mapped = usersData.map((u: any) => ({
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'Unknown',
          role: u.role || 'viewer',
          av: u.av || u.initials || (u.name || '??').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          team: u.team || '',
        }));
        setUsers(mapped);
        setContextUsers(mapped);
      }

      // Fetch all data in parallel
      const [programs, tasks, comments, replies, notifications, documents] = await Promise.all([
        get('/programs'),
        get('/tasks'),
        get('/comments?programId='),
        get('/replies?commentId='),
        get('/notifications'),
        get('/documents'),
      ]);

      setPrg(programs.map(mapProgram));
      setTasks(tasks.map(mapTask));
      setCom(comments.map(mapComment));
      setRep(replies.map(mapReply));
      setNotifs(notifications.map(mapNotification));
      setDocs(documents.map(mapDoc));

      console.info(`Loaded from API: ${programs.length} programs, ${tasks.length} tasks, ${documents.length} docs`);
    } catch {
      console.info("API unavailable, using local data");
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const myTasks = tasks.filter((t) => t.assignee?.id === ME.id);
  const nav = [
    // Daily views (everyone)
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "tasks", label: "My Tasks", icon: "clipboard" },
    { id: "programs", label: "Programs", icon: "folder" },
    // Admin (admin only)
    ...(rbac.isAdmin ? [{ id: "admin", label: "Admin", icon: "settings", divider: true }] : []),
    // Help (everyone) — divider separates utility from business views
    { id: "help", label: "Help", icon: "help", divider: true },
  ];
  const goTo = (v: string) => {
    setView(v);
    setSel(null);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setNotifOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  const handleNotifClick = useCallback(async (n: Notification) => {
    if (!n.read) {
      try {
        const { markNotificationRead } = await import('./services/api');
        markNotificationRead(n.id).catch(() => {});
      } catch {}
    }
    if (n.programId) {
      setOriginView(view);
      setView('programs');
      setSel(n.programId);
    }
    // Defer scroll until after the view renders
    if (n.entityType && n.entityId) {
      const targetId = `${n.entityType}-${n.entityId}`;
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('notif-highlight');
          setTimeout(() => el.classList.remove('notif-highlight'), 2000);
        }
      }, 300);
    }
  }, []);
  const bottomNav = [
    { id: "dashboard", label: "Home", icon: "home" },
    { id: "tasks", label: "Tasks", icon: "clipboard" },
    { id: "programs", label: "Programs", icon: "folder" },
    { id: "help", label: "Help", icon: "help" },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden relative bg-background text-foreground font-sans">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full opacity-[0.04]" style={{ width: 600, height: 600, top: -200, right: -100, background: `radial-gradient(circle,${g[500]},transparent 70%)` }} />
        <div className="absolute rounded-full opacity-[0.03]" style={{ width: 400, height: 400, bottom: -100, left: "30%", background: `radial-gradient(circle,${u.inf},transparent 70%)` }} />
      </div>

      <Sidebar mob={mob} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} view={view} nav={nav} goTo={goTo} myTasks={myTasks} setCmdOpen={setCmdOpen} />

      <main className="flex-1 overflow-auto relative z-10" style={{ paddingBottom: mob ? 72 : 0 }}>
        <TopBar mob={mob} sel={sel} view={view} nav={nav} prg={prg} setSidebarOpen={setSidebarOpen} setCmdOpen={setCmdOpen} notifOpen={notifOpen} setNotifOpen={setNotifOpen} unread={unread} />

        <div className="relative p-4 md:p-6">
          <AnimatePresence mode="wait">
            {view === "dashboard" && !sel && <Dashboard key="d" prg={prg} com={com} tasks={tasks} go={(id) => { setOriginView("dashboard"); setSel(id); setView("programs"); }} />}
            {view === "programs" && !sel && <ProgramList key="l" prg={prg} setPrg={setPrg} go={(id) => { setOriginView("programs"); setSel(id); }} com={com} tasks={tasks} healthOverrides={healthOverrides} />}
            {sel && <ProgramDetail key="det" p={prg.find((x) => x.id === sel)} setPrg={setPrg} com={com} setCom={setCom} rep={rep} setRep={setRep} tasks={tasks} setTasks={setTasks} docs={docs} setDocs={setDocs} back={() => { setSel(null); if (originView && originView !== view) setView(originView); }} />}
            {view === "tasks" && !sel && <TasksView key="tasks" tasks={tasks} setTasks={setTasks} prg={prg} goDetail={(id) => { setOriginView("tasks"); setSel(id); setView("programs"); }} com={com} setCom={setCom} rep={rep} setRep={setRep} />}

            {view === "admin" && !sel && rbac.isAdmin && <AdminView key="admin" users={users} setUsers={(fn) => { setUsers(fn); setContextUsers(fn); }} />}
            {view === "help" && !sel && <HelpView key="help" />}
          </AnimatePresence>
        </div>
      </main>

      <BottomNav mob={mob} view={view} goTo={goTo} bottomNav={bottomNav} setSidebarOpen={setSidebarOpen} />
      <NotificationDrawer mob={mob} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifs={notifs} setNotifs={setNotifs} unread={unread} onNotifClick={handleNotifClick} />
      <CommandPalette cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} prg={prg} nav={nav} setSel={setSel} setView={setView} goTo={goTo} />
    </div>
  );
}
