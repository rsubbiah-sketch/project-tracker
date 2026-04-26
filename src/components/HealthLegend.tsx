import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as I } from './Icons';
import type { Milestone, MilestoneCategory } from '../types';

export const CATEGORY_META: Record<MilestoneCategory, { label: string; icon: string; color: string; desc: string }> = {
  product:   { label: 'Product Readiness', icon: 'shield',    color: '#60A5FA', desc: 'Core product readiness, including feature completeness, performance, and quality' },
  execution: { label: 'Execution',         icon: 'clipboard', color: '#A78BFA', desc: 'External dependencies that impact program success, including partner integration, interoperability, ecosystem and critical enabling resources' },
  ttm:       { label: 'Time to Market',    icon: 'calendar',  color: '#F59E0B', desc: 'Customer-facing milestones required to qualify, release, and bring the product to market (e.g. Customer Qual)' },
};

const BANDS = [
  { range: '90–100', color: '#34D399', bg: 'rgba(52,211,153,.12)', label: 'Green', meaning: 'On track, no action needed' },
  { range: '70–89',  color: '#FBBF24', bg: 'rgba(251,191,36,.12)', label: 'Yellow', meaning: 'At risk, monitor closely' },
  { range: '< 70',   color: '#F87171', bg: 'rgba(248,113,113,.12)', label: 'Red', meaning: 'Off track, action required' },
];

/** Compact inline legend */
export function HealthLegendCompact() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
      {BANDS.map(b => (
        <span key={b.label} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
          {b.label} ({b.range})
        </span>
      ))}
    </div>
  );
}

/** Category badge for a milestone */
export function CategoryBadge({ category }: { category?: MilestoneCategory }) {
  if (!category) return <span className="text-xs text-muted-foreground">—</span>;
  const meta = CATEGORY_META[category];
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold"
      style={{ background: `${meta.color}14`, color: meta.color, border: `1px solid ${meta.color}22` }}
      title={meta.desc}>
      <I name={meta.icon} size={8} color={meta.color} />
      {meta.label.split(' / ')[0]}
    </span>
  );
}

/** Full expandable legend with pillar definitions, color bands, and milestone mapping */
export function HealthLegend({ compact = false, milestones = [] }: { compact?: boolean; milestones?: Milestone[] }) {
  const [open, setOpen] = useState(false);

  if (compact) return <HealthLegendCompact />;

  // Group milestones by category
  const grouped: Record<MilestoneCategory, Milestone[]> = { product: [], execution: [], ttm: [] };
  milestones.forEach(m => { if (m.category) grouped[m.category].push(m); });
  const hasMapping = milestones.some(m => m.category);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground cursor-pointer bg-transparent border-none hover:text-foreground transition-colors"
      >
        <I name="info" size={12} color="var(--muted-foreground)" />
        Traffic-Light Legend
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <I name="chevD" size={10} color="var(--muted-foreground)" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-xl bg-muted border border-border">
              {/* Pillar definitions with milestone mapping */}
              <div className="text-xs font-bold uppercase tracking-[0.15em] mb-2 text-muted-foreground">
                Three Health Dimensions {hasMapping && '& Milestone Mapping'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {(Object.entries(CATEGORY_META) as [MilestoneCategory, typeof CATEGORY_META['product']][]).map(([key, p]) => (
                  <div key={key} className="flex flex-col gap-2 p-2.5 rounded-lg bg-card border border-border">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: `${p.color}18` }}>
                        <I name={p.icon} size={14} color={p.color} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{p.label}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">{p.desc}</div>
                      </div>
                    </div>
                    {/* Milestone mapping */}
                    {grouped[key].length > 0 && (
                      <div className="border-t border-border pt-2 mt-1">
                        <div className="text-xs font-bold uppercase tracking-[0.12em] mb-1" style={{ color: p.color }}>
                          Milestones ({grouped[key].length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {grouped[key].map(m => (
                            <span key={m.name} className="px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{
                                background: m.status === 'done' ? 'rgba(52,211,153,.1)' : `${p.color}08`,
                                color: m.status === 'done' ? '#34D399' : 'var(--secondary-foreground)',
                                border: `1px solid ${m.status === 'done' ? '#34D39922' : `${p.color}15`}`,
                                textDecoration: m.status === 'done' ? 'line-through' : 'none',
                              }}>
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Color threshold bands */}
              <div className="text-xs font-bold uppercase tracking-[0.15em] mb-2 text-muted-foreground">Milestone Score Thresholds</div>
              <div className="flex gap-2 flex-wrap">
                {BANDS.map(b => (
                  <div key={b.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: b.bg, border: `1px solid ${b.color}22` }}>
                    <span className="w-3 h-3 rounded-full" style={{ background: b.color }} />
                    <span className="text-xs font-bold" style={{ color: b.color }}>{b.label}</span>
                    <span className="text-xs text-secondary-foreground">{b.range}</span>
                    <span className="text-xs text-muted-foreground">— {b.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
