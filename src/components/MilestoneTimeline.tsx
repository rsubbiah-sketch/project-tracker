import type { Milestone } from '../types';
import { ragColor } from '../utils/health';

interface Props {
  milestones: Milestone[];
  onItemClick?: (index: number) => void;
}

/** Horizontal milestone timeline — shadcn style with colored dots + connecting line + today marker */
export default function MilestoneTimeline({ milestones, onItemClick }: Props) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">No milestones yet</div>
    );
  }

  const now = new Date();
  const nowMs = now.getTime();

  // Sort chronologically
  const sorted = [...milestones]
    .map((m, idx) => ({ ...m, _originalIdx: idx }))
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  // Find where "today" falls: index of the first milestone after today
  const todayInsertIdx = sorted.findIndex(
    (m) => m.date && new Date(m.date + (m.date.includes('T') ? '' : 'T00:00:00')).getTime() > nowMs
  );
  // -1 means today is after all milestones; sorted.length means before all
  const todayIdx = todayInsertIdx === -1 ? sorted.length : todayInsertIdx;

  const fmtD = (d: string) =>
    d
      ? new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—';

  // Score-based RAG colouring to match the Key Milestones table.
  // Overdue is indicated separately via a ring on the dot, not via colour.
  const statusOf = (m: Milestone) => {
    const overdue = !!(m.date && new Date(m.date) < now) && m.status !== 'done';
    const c = ragColor(m.score);
    const label =
      m.score != null ? `${m.score}` :
      m.status === 'done' ? 'Done' :
      overdue ? 'Overdue' : 'Upcoming';
    return { c, bg: `${c}20`, label, overdue };
  };

  const categoryLabel = (c?: string) =>
    c === 'ttm' ? 'TTM' : c === 'execution' ? 'Execution' : c === 'product' ? 'Product' : '';

  // Build render items: milestones + today marker interleaved
  const items: { type: 'milestone'; data: (typeof sorted)[0]; idx: number }[] | { type: 'today' }[] = [];
  const renderItems: Array<
    | { type: 'milestone'; data: (typeof sorted)[0]; idx: number }
    | { type: 'today' }
  > = [];

  sorted.forEach((m, i) => {
    if (i === todayIdx) renderItems.push({ type: 'today' });
    renderItems.push({ type: 'milestone', data: m, idx: i });
  });
  if (todayIdx >= sorted.length) renderItems.push({ type: 'today' });

  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-max py-4 px-2">
        {/* Connecting line */}
        <div
          className="absolute left-0 right-0 top-1/2 h-px bg-border"
          style={{ transform: 'translateY(-50%)' }}
        />

        {/* Milestone dots + today marker */}
        <div className="relative flex items-center gap-8">
          {renderItems.map((item, ri) => {
            if (item.type === 'today') {
              return (
                <div
                  key="today-marker"
                  className="relative flex flex-col items-center gap-0 min-w-[48px] max-w-[48px] pointer-events-none z-20"
                >
                  {/* Label */}
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-foreground text-background whitespace-nowrap mb-1">
                    Today
                  </span>
                  {/* Down arrow */}
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="mb-0.5">
                    <path d="M6 8L0 0H12L6 8Z" fill="currentColor" className="text-foreground" />
                  </svg>
                  {/* Dot on line */}
                  <div className="h-2.5 w-2.5 rounded-full bg-foreground border-2 border-background" style={{ boxShadow: '0 0 0 2px var(--foreground)' }} />
                  {/* Date below */}
                  <div className="text-[10px] text-muted-foreground tabular-nums mt-1.5">
                    {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            }

            const m = item.data;
            const s = statusOf(m);
            return (
              <button
                key={ri}
                onClick={() => onItemClick?.(m._originalIdx)}
                className="relative flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group min-w-[120px] max-w-[160px]"
                title={`${m.name} — ${s.label}`}
              >
                {/* Label above dot */}
                <div className="flex flex-col items-center gap-0.5 pb-1">
                  <div className="text-xs font-semibold text-foreground text-center line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {m.name}
                  </div>
                  {m.category && (
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {categoryLabel(m.category)}
                    </div>
                  )}
                </div>

                {/* Dot on line — overdue items get an extra red ring */}
                <div
                  className="relative z-10 h-3 w-3 rounded-full border-2 border-background transition-transform group-hover:scale-125"
                  style={{ background: s.c, boxShadow: s.overdue ? `0 0 0 2px #ef4444` : `0 0 0 2px ${s.c}` }}
                />

                {/* Label below dot */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className="text-xs text-muted-foreground tabular-nums">{fmtD(m.date)}</div>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ color: s.c, background: s.bg }}
                  >
                    {s.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
