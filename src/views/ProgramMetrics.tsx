import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Icon as I } from '../components/Icons';
import { u, accent, accentText } from '../tokens';
import { Cd } from '../components/ui';
import { healthColor } from '../utils/health';

interface MetricDim {
  score: number | null;
  note: string;
}

interface ProgramMetrics {
  id?: string;
  programId: string;
  technology: MetricDim;
  execution: MetricDim;
  timeToMarket: MetricDim;
  composite: number | null;
  updatedByName?: string;
}

const DIMS: { key: 'technology' | 'execution' | 'timeToMarket'; label: string; icon: string }[] = [
  { key: 'technology',   label: 'Product Readiness', icon: 'shield' },
  { key: 'execution',    label: 'Execution',       icon: 'clipboard' },
  { key: 'timeToMarket', label: 'Time to Market',  icon: 'calendar' },
];

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const DEFAULT: ProgramMetrics = {
  programId: '',
  technology: { score: null, note: '' },
  execution: { score: null, note: '' },
  timeToMarket: { score: null, note: '' },
  composite: null,
};

interface Props {
  programId: string;
  isEditor: boolean;
  onMetricsSaved?: () => void;
}

export default function ProgramMetrics({ programId, isEditor, onMetricsSaved }: Props) {
  const [metrics, setMetrics] = useState<ProgramMetrics>({ ...DEFAULT, programId });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProgramMetrics>({ ...DEFAULT, programId });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch<ProgramMetrics>(`/program-metrics/${programId}`)
      .then(d => { setMetrics(d); setDraft(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [programId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const result = await apiFetch<ProgramMetrics>(`/program-metrics/${programId}`, {
        method: 'PUT',
        body: JSON.stringify({
          technology: draft.technology,
          execution: draft.execution,
          timeToMarket: draft.timeToMarket,
        }),
      });
      setMetrics(result);
      setDraft(result);
      setEditing(false);
      onMetricsSaved?.();
    } catch {}
    setSaving(false);
  };

  const updateDim = (key: 'technology' | 'execution' | 'timeToMarket', field: 'score' | 'note', val: string) => {
    setDraft(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'score' ? (val === '' ? null : Math.min(100, Math.max(0, parseInt(val) || 0))) : val,
      },
    }));
  };

  const scores = [metrics.technology.score, metrics.execution.score, metrics.timeToMarket.score].filter(s => s !== null) as number[];
  const composite = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  if (loading) return null;

  return (
    <Cd delay={.1} hover={false} className="p-4 md:p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <I name="activity" size={16} color="var(--foreground)" />
          <span className="text-sm font-bold text-foreground">Health Metrics</span>
          {composite !== null && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${healthColor(composite)}18`, color: healthColor(composite) }}>
              {composite}/100
            </span>
          )}
        </div>
        {isEditor && !editing && (
          <motion.button whileTap={{ scale: .95 }} onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: accent, color: accentText }}>
            <I name="edit" size={12} color={accentText} />Update Metrics
          </motion.button>
        )}
      </div>

      {/* Display mode */}
      {!editing && (
        <div className="space-y-3">
          {DIMS.map(dim => {
            const val = metrics[dim.key];
            const score = val.score;
            const color = score !== null ? healthColor(score) : 'var(--muted-foreground)';
            const ragLabel = score === null ? '—' : score >= 90 ? 'GREEN' : score >= 70 ? 'AMBER' : 'RED';
            return (
              <div key={dim.key} className="p-3 rounded-xl bg-muted border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <I name={dim.icon} size={12} color={color} />
                  <span className="text-xs font-bold text-foreground flex-1">{dim.label}</span>
                  {score !== null && (
                    <>
                      <span className="text-sm font-black" style={{ color }}>{score}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color, minWidth: 48, textAlign: 'center' }}>{ragLabel}</span>
                    </>
                  )}
                  {score === null && <span className="text-xs text-muted-foreground">Not set</span>}
                </div>
                {val.note && <div className="text-xs text-muted-foreground mt-1">{val.note}</div>}
              </div>
            );
          })}
          {metrics.updatedByName && (
            <div className="text-xs text-muted-foreground text-right">Last updated by {metrics.updatedByName}</div>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="space-y-4">
          {DIMS.map(dim => {
            const val = draft[dim.key];
            const score = val.score;
            const color = score !== null ? healthColor(score) : 'var(--border)';
            return (
              <div key={dim.key} className="p-3 rounded-xl bg-muted border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <I name={dim.icon} size={12} color="var(--foreground)" />
                  <span className="text-xs font-bold text-foreground">{dim.label}</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <input type="range" min="0" max="100" value={score ?? 50}
                    onChange={e => updateDim(dim.key, 'score', e.target.value)}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#3B82F6' }} />
                  <input type="number" min="0" max="100" value={score ?? ''}
                    onChange={e => updateDim(dim.key, 'score', e.target.value)}
                    placeholder="—"
                    className="w-14 px-2 py-1 rounded-lg text-xs text-center font-bold outline-none bg-card border border-border text-foreground" />
                </div>
                <textarea value={val.note} onChange={e => updateDim(dim.key, 'note', e.target.value)}
                  placeholder={`${dim.label} assessment notes…`} rows={1}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none bg-card border border-border text-foreground" style={{ fontFamily: 'inherit' }} />
              </div>
            );
          })}
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: .95 }} onClick={save} disabled={saving}
              className="flex-1 py-2 rounded-lg text-xs font-bold"
              style={{ background: accent, color: accentText, opacity: saving ? .5 : 1 }}>
              {saving ? 'Saving…' : 'Save Metrics'}
            </motion.button>
            <motion.button whileTap={{ scale: .95 }} onClick={() => { setDraft(metrics); setEditing(false); }}
              className="py-2 px-4 rounded-lg text-xs font-bold bg-card border border-border text-muted-foreground cursor-pointer">
              Cancel
            </motion.button>
          </div>
        </div>
      )}
    </Cd>
  );
}
