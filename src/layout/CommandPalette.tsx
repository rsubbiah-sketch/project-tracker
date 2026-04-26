import { motion, AnimatePresence } from 'framer-motion';


import { Icon } from '../components/Icons';
import { TB } from '../components/ui';
import type { Program } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface CommandPaletteProps {
  cmdOpen: boolean;
  setCmdOpen: (v: boolean) => void;
  prg: Program[];
  nav: NavItem[];
  setSel: (id: string | null) => void;
  setView: (v: string) => void;
  goTo: (id: string) => void;
}

export default function CommandPalette({ cmdOpen, setCmdOpen, prg, nav, setSel, setView, goTo }: CommandPaletteProps) {
  return (
    <AnimatePresence>
      {cmdOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center pt-12 md:pt-24 px-3 md:px-0 bg-black/70 backdrop-blur-[8px]" onClick={() => setCmdOpen(false)}>
          <motion.div initial={{ opacity: 0, y: -20, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: .98 }} transition={{ type: "spring", damping: 24, stiffness: 400 }}
            onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-border overflow-hidden bg-background" style={{ boxShadow: `0 25px 80px rgba(0,0,0,.15), 0 0 60px rgba(0,0,0,.03)` }}>
            <div className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 border-b border-border">
              <Icon name="search" size={18} color={'#2563EB'} />
              <input autoFocus placeholder="Search programs, tasks, people..." className="flex-1 bg-transparent text-sm outline-none text-foreground font-[inherit]" />
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-border text-muted-foreground">ESC</span>
            </div>
            <div className="p-2 max-h-[60vh] md:max-h-80 overflow-auto">
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Programs</div>
              {prg.map(p => (
                <button key={p.id} onClick={() => { setSel(p.id); setView("programs"); setCmdOpen(false); }}
                  className="flex items-center gap-2 md:gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-[rgba(147,197,253,.06)] text-foreground border-none bg-transparent cursor-pointer font-[inherit]">
                  <TB type={p.type} /><span className="text-xs font-medium truncate">{p.name}</span><span className="ml-auto text-xs flex-shrink-0 text-muted-foreground">{p.id}</span>
                </button>
              ))}
              <div className="px-3 py-1.5 mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</div>
              {nav.map(ni => (
                <button key={ni.id} onClick={() => { goTo(ni.id); setCmdOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors hover:bg-[rgba(147,197,253,.06)] border-none bg-transparent cursor-pointer font-[inherit]" style={{ color: '#2563EB' }}>
                  <Icon name={ni.icon} size={14} color="var(--secondary-foreground)" /><span className="text-xs">{ni.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
