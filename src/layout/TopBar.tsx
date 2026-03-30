import { motion } from 'framer-motion';
import { u } from '../tokens';
import { Icon } from '../components/Icons';
import { UpscaleLogoMark } from '../components/Logo';
import { cn } from '@/lib/utils';
import type { Program } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface TopBarProps {
  mob: boolean;
  sel: string | null;
  view: string;
  nav: NavItem[];
  prg: Program[];
  setSidebarOpen: (v: boolean) => void;
  setCmdOpen: (v: boolean) => void;
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
  unread: number;
}

export default function TopBar({ mob, sel, view, nav, prg, setSidebarOpen, setCmdOpen, notifOpen, setNotifOpen, unread }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-border" style={{ background: "hsl(var(--background) / 0.8)", backdropFilter: "blur(24px) saturate(180%)" }}>
      <div className="flex items-center justify-between px-3 md:px-6 h-14">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {mob && <button onClick={() => setSidebarOpen(true)} className="bg-transparent border-none cursor-pointer p-1"><Icon name="list" size={20} color="var(--foreground)" /></button>}
          {!mob && <UpscaleLogoMark size={24} id="tb" />}
          {!mob && <div className="w-px h-5 bg-border" />}
          <motion.h1 key={sel || view} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-sm md:text-base font-bold tracking-tight truncate text-foreground">
            {sel ? prg.find(p => p.id === sel)?.name : nav.find(ni => ni.id === view)?.label}
          </motion.h1>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          {!mob && <button onClick={() => setCmdOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-card border border-border text-muted-foreground cursor-pointer">
            <Icon name="search" size={13} color="var(--muted-foreground)" />Search...
            <span className="font-mono px-1 rounded text-[9px] bg-border text-muted-foreground">&#8984;K</span>
          </button>}
          {mob && <button onClick={() => setCmdOpen(true)} className="p-2 rounded-lg bg-card border border-border cursor-pointer"><Icon name="search" size={16} color="var(--muted-foreground)" /></button>}
          <motion.button whileTap={{ scale: .9 }} onClick={() => setNotifOpen(!notifOpen)} className={cn(
            "relative p-2 rounded-lg border border-border cursor-pointer",
            notifOpen ? "bg-[rgba(147,197,253,0.1)]" : "bg-card"
          )}>
            <Icon name="bell" size={16} color={'#2563EB'} />
            {unread > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] text-white" style={{ background: u.err }}>{unread}</motion.span>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
