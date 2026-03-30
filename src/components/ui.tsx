import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { g, ST, PHASE_COLOR } from '../tokens';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { User } from '../types';

export function Av({ user, size = 28 }: { user: User; size?: number }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center flex-shrink-0 font-bold rounded-full bg-border text-foreground"
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {user.av}
    </div>
  );
}

export function SB({ status }: { status: string }) {
  const s = ST[status] || ST["Not Started"];
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 rounded-full"
      style={{ color: s.c, background: s.bg }}
    >
      <span
        className="rounded-full inline-block"
        style={{ width: 5, height: 5, background: s.c }}
      />
      {status}
    </Badge>
  );
}

export function TB({ type }: { type: string }) {
  const m: Record<string, { c: string; bg: string }> = {
    HW: { c: "#60A5FA", bg: "rgba(96,165,250,.12)" },
    SW: { c: "#34D399", bg: "rgba(52,211,153,.12)" },
    Customer: { c: "#A78BFA", bg: "rgba(167,139,250,.12)" },
    NPI: { c: "#FBBF24", bg: "rgba(251,191,36,.12)" },
    ASIC: { c: g[300], bg: "rgba(240,199,94,.1)" },
    Hardware: { c: "#60A5FA", bg: "rgba(96,165,250,.12)" },
    Software: { c: "#34D399", bg: "rgba(52,211,153,.12)" },
  };
  const s = m[type] || m.HW;
  return (
    <Badge
      variant="outline"
      className="rounded-full"
      style={{ color: s.c, background: s.bg, borderColor: s.c + '30' }}
    >
      {type}
    </Badge>
  );
}

export function PB({ phase }: { phase: string }) {
  const c = PHASE_COLOR[phase] || "#64748B";
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 rounded-full"
      style={{ color: c, background: `${c}18` }}
    >
      <span className="rounded-full inline-block" style={{ width: 5, height: 5, background: c }} />
      {phase}
    </Badge>
  );
}

export function GB({ pct, h = 6, color = '#3B82F6' }: { pct: number; h?: number; color?: string }) {
  return (
    <div
      className="w-full bg-card rounded-full overflow-hidden"
      style={{ height: h }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg,${color},${color}99)` }}
      />
    </div>
  );
}

export function Counter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    const start = ref.current ?? 0;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const dur = duration * 1000;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = value;
    };
    requestAnimationFrame(tick);
    return () => { ref.current = value; };
  }, [value, duration]);
  return <span>{display}</span>;
}

export function Spark({ data, color = g[500], w = 80, h = 24 }: { data: number[]; color?: string; w?: number; h?: number }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`sp${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {data.length > 1 && (() => {
        const max = Math.max(...data, 1);
        const pts = data.map((v, i) => [i * (w / (data.length - 1)), h - (v / max) * h * 0.85]);
        const line = pts.map(p => p.join(",")).join(" ");
        const area = `0,${h} ${line} ${w},${h}`;
        return (
          <>
            <polygon points={area} fill={`url(#sp${color.replace('#', '')})`} />
            <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      })()}
    </svg>
  );
}

export function Cd({
  children,
  className: classNameProp = "",
  delay = 0,
  hover = true,
  onClick = undefined as undefined | (() => void),
  style = {},
  ...r
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -3, boxShadow: '0 0 30px rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.08)' } : {}}
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card/90 border-border backdrop-blur-sm",
        classNameProp
      )}
      style={{ cursor: onClick ? "pointer" : "default", ...style }}
      {...r}
    >
      {children}
    </motion.div>
  );
}
