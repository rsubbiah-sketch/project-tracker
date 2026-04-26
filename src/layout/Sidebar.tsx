import { motion, AnimatePresence } from 'framer-motion';
import { accent, accentText } from '../tokens';
import { Icon } from '../components/Icons';

import { Av } from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { cn } from '@/lib/utils';
import type { Task } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  divider?: boolean;
}

interface SidebarProps {
  mob: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  view: string;
  nav: NavItem[];
  goTo: (id: string) => void;
  myTasks: Task[];
  setCmdOpen: (v: boolean) => void;
}

export default function Sidebar({ mob, sidebarOpen, setSidebarOpen, view, nav, goTo, myTasks, setCmdOpen }: SidebarProps) {
  const ME = useCurrentUser();
  const { logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  return (
    <AnimatePresence>
      {(!mob || sidebarOpen) && (
        <motion.aside
          initial={mob ? { x: -280 } : { x: -230 }}
          animate={{ x: 0 }}
          exit={mob ? { x: -280 } : {}}
          transition={{ duration: mob ? .3 : .6, ease: [.25, .46, .45, .94] }}
          className={cn(
            "flex flex-col flex-shrink-0 border-r border-border relative z-50 backdrop-blur-[20px]",
            mob && "fixed top-0 left-0 h-full"
          )}
          style={{ width: mob ? 280 : 228, background: "hsl(var(--muted) / 0.94)" }}>
          <div className="px-4 pt-5 pb-4 border-b border-border flex items-center justify-between">
            <div>
              <img src="/upscaleai-logo.svg" alt="UpscaleAI" width={150} height={30} className="dark:invert" />
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Project Tracker</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-black" style={{ background: `rgba(147,197,253,.1)`, color: '#2563EB' }}>BETA</span>
              </div>
            </div>
            {mob && <button onClick={() => setSidebarOpen(false)} className="bg-transparent border-none cursor-pointer"><Icon name="x" size={20} color="var(--secondary-foreground)" /></button>}
          </div>
          <nav className="flex-1 p-3 space-y-1 mt-2">
            {nav.map((ni) => (
              <div key={ni.id}>
                {ni.divider && <div className="my-2 mx-3 border-t border-border" />}
                <motion.button whileHover={{ x: 4 }} whileTap={{ scale: .97 }} onClick={() => goTo(ni.id)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all"
                  style={{ background: view === ni.id ? `${accent}18` : "transparent", color: view === ni.id ? accentText : 'var(--secondary-foreground)', borderLeft: view === ni.id ? `2px solid ${accentText}` : "2px solid transparent" }}>
                  <Icon name={ni.icon} size={16} color={view === ni.id ? accentText : 'var(--muted-foreground)'} />
                  {ni.label}
                  {ni.id === "todo" && <span className="ml-auto text-xs px-1.5 rounded-full bg-border text-muted-foreground">45</span>}
                  {ni.id === "tasks" && myTasks.filter(t => t.status !== "Done").length > 0 && <span className="ml-auto text-xs px-1.5 rounded-full" style={{ background: `rgba(147,197,253,.15)`, color: '#2563EB' }}>{myTasks.filter(t => t.status !== "Done").length}</span>}
                  {ni.id === "admin" && <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,.12)', color: '#F87171' }}>Admin</span>}
                  {ni.id === "help" && <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(96,165,250,.12)', color: '#60A5FA' }}>?</span>}
                </motion.button>
              </div>
            ))}
          </nav>
          {/* Quick actions */}
          <div className="px-3 pb-2">
            <button onClick={() => { setCmdOpen(true); setSidebarOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-muted-foreground cursor-pointer">
              <Icon name="search" size={13} color="var(--muted-foreground)" />
              <span>Search</span>
              <span className="ml-auto px-1.5 py-0.5 rounded text-xs font-mono bg-border text-muted-foreground">&#8984;K</span>
            </button>
          </div>
          <div className="p-3 border-t border-border flex items-center gap-2.5">
            <Av user={ME} size={32} />
            <div className="flex-1 min-w-0"><div className="text-xs font-bold truncate text-foreground">{ME.name}</div><div className="text-xs text-muted-foreground capitalize">{ME.role}</div></div>
            <button onClick={toggleTheme} className="bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-border transition-colors" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark'
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
            <button onClick={logout} className="bg-transparent border-none cursor-pointer" title="Sign out"><Icon name="x" size={14} color="var(--muted-foreground)" /></button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
