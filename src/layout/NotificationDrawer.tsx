import { motion, AnimatePresence } from 'framer-motion';


import { Icon } from '../components/Icons';
import { Av } from '../components/ui';
import { cn } from '@/lib/utils';
import { fmtD } from '../utils';
import type { Notification } from '../types';

interface NotificationDrawerProps {
  mob: boolean;
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
  notifs: Notification[];
  setNotifs: React.Dispatch<React.SetStateAction<Notification[]>>;
  unread: number;
}

export default function NotificationDrawer({ mob, notifOpen, setNotifOpen, notifs, setNotifs, unread }: NotificationDrawerProps) {
  return (
    <AnimatePresence>
      {notifOpen && (
        <>
          {mob && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-black/30" onClick={() => setNotifOpen(false)} />}
          <motion.div initial={mob ? { y: "100%" } : { x: 360 }} animate={mob ? { y: 0 } : { x: 0 }} exit={mob ? { y: "100%" } : { x: 360 }} transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className={cn(
              "z-40 flex flex-col backdrop-blur-[24px]",
              mob ? "fixed inset-x-0 bottom-0 rounded-t-2xl" : "absolute top-0 right-0 h-full border-l border-border"
            )}
            style={{ width: mob ? "100%" : 340, maxHeight: mob ? "85vh" : "100%", background: "hsl(var(--muted) / 0.97)" }}>
            {mob && <div className="flex justify-center py-2"><div className="w-10 h-1 rounded-full bg-border" /></div>}
            <div className="flex items-center justify-between px-5 h-14 border-b border-border">
              <span className="text-sm font-bold text-foreground">Notifications</span>
              <div className="flex items-center gap-2">
                {unread > 0 && <button onClick={() => setNotifs(p => p.map(x => ({ ...x, read: true })))} className="text-xs font-semibold px-2 py-1 rounded bg-transparent border-none cursor-pointer" style={{ color: '#2563EB' }}>Mark all read</button>}
                <button onClick={() => setNotifOpen(false)} className="bg-transparent border-none cursor-pointer"><Icon name="x" size={16} color="var(--secondary-foreground)" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {notifs.map((ni, idx) => (
                <motion.div key={ni.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * .04 }}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg",
                    !ni.read && "bg-card border border-border",
                    ni.read && "bg-transparent border border-transparent"
                  )}>
                  <Av user={ni.from} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-xs", ni.read ? "text-muted-foreground" : "text-foreground")}>
                      <span className={cn("font-bold", ni.read ? "text-secondary-foreground" : "text-foreground")}>{ni.from.name}</span> {ni.text}
                    </div>
                    <div className="text-xs mt-1 text-muted-foreground">{fmtD(ni.ts)}</div>
                  </div>
                  {!ni.read && <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#2563EB' }} />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
