import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as I } from '../components/Icons';
import { u, accent, accentText } from '../tokens';
import { Cd, Av } from '../components/ui';
import { USERS } from '../data';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { User } from '../types';

interface Issue {
  id: string;
  programId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  ownerId: string;
  ownerName: string;
  reportedByName?: string;
  escalationNote?: string;
  resolution?: string;
}

const SEV = {
  critical: { color: '#F87171', bg: 'rgba(248,113,113,.12)', label: 'Critical' },
  high:     { color: '#FBBF24', bg: 'rgba(251,191,36,.12)', label: 'High' },
  medium:   { color: '#60A5FA', bg: 'rgba(96,165,250,.12)', label: 'Medium' },
  low:      { color: '#94A3B8', bg: 'rgba(148,163,184,.12)', label: 'Low' },
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open:        { color: '#60A5FA', bg: 'rgba(96,165,250,.12)' },
  in_progress: { color: '#FBBF24', bg: 'rgba(251,191,36,.12)' },
  escalated:   { color: '#F87171', bg: 'rgba(248,113,113,.12)' },
  resolved:    { color: '#34D399', bg: 'rgba(52,211,153,.12)' },
  closed:      { color: '#94A3B8', bg: 'rgba(148,163,184,.12)' },
};

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

interface Props {
  programId: string;
  isEditor: boolean;
}

export default function ProgramIssues({ programId, isEditor }: Props) {
  const ME = useCurrentUser();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium' as Issue['severity'], ownerId: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiFetch<Issue[]>(`/program-issues?programId=${programId}`)
      .then(setIssues)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [programId]);

  useEffect(() => { load(); }, [load]);

  const createIssue = async () => {
    if (!form.title.trim()) return;
    try {
      const issue = await apiFetch<Issue>('/program-issues', {
        method: 'POST',
        body: JSON.stringify({ programId, ...form }),
      });
      setIssues(prev => [issue, ...prev]);
      setForm({ title: '', description: '', severity: 'medium', ownerId: '' });
      setShowForm(false);
    } catch {}
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const updated = await apiFetch<Issue>(`/program-issues/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setIssues(prev => prev.map(iss => iss.id === id ? { ...iss, ...updated } : iss));
    } catch {}
  };

  const resolveIssue = async (id: string, resolution: string) => {
    try {
      const updated = await apiFetch<Issue>(`/program-issues/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      });
      setIssues(prev => prev.map(iss => iss.id === id ? { ...iss, ...updated } : iss));
    } catch {}
  };

  const openCount = issues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;
  const critCount = issues.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;

  return (
    <Cd delay={.12} hover={false} className="p-4 md:p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <I name="alert" size={16} color="var(--foreground)" />
          <span className="text-sm font-bold text-foreground">Key Issues</span>
          <span className="text-xs text-muted-foreground">({openCount} open{critCount > 0 ? `, ${critCount} critical` : ''})</span>
        </div>
        <motion.button whileTap={{ scale: .95 }} onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: showForm ? 'var(--border)' : accent, color: showForm ? 'var(--muted-foreground)' : accentText }}>
          <I name={showForm ? "x" : "plus"} size={12} color={showForm ? 'var(--muted-foreground)' : accentText} />
          {showForm ? "Cancel" : "Report Issue"}
        </motion.button>
      </div>

      {/* New issue form */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          className="mb-4 p-4 rounded-xl bg-muted border border-border">
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Issue title…"
              className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary" />
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description…" rows={2}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none bg-card border border-border text-foreground focus:border-primary" />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs mb-1 block text-muted-foreground">Severity</label>
                <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as Issue['severity'] })}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground">
                  {(['critical', 'high', 'medium', 'low'] as const).map(s => <option key={s} value={s}>{SEV[s].label}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs mb-1 block text-muted-foreground">Owner</label>
                <select value={form.ownerId} onChange={e => setForm({ ...form, ownerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground">
                  <option value="">Self</option>
                  {USERS.map(u2 => <option key={u2.id} value={u2.id}>{u2.name}</option>)}
                </select>
              </div>
            </div>
            <motion.button whileTap={{ scale: .95 }} disabled={!form.title.trim()} onClick={createIssue}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
              style={{ background: form.title.trim() ? accent : 'var(--border)', color: form.title.trim() ? accentText : 'var(--muted-foreground)', opacity: form.title.trim() ? 1 : .5 }}>
              <I name="plus" size={12} color={form.title.trim() ? accentText : 'var(--muted-foreground)'} />Report Issue
            </motion.button>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Issue list */}
      {loading ? <div className="text-center py-4 text-xs text-muted-foreground">Loading…</div> :
       issues.length === 0 ? <div className="text-center py-6 text-xs text-muted-foreground">No issues reported yet</div> :
        <div className="space-y-2">
          {issues.map((iss, i) => {
            const sev = SEV[iss.severity] || SEV.medium;
            const st = STATUS_STYLE[iss.status] || STATUS_STYLE.open;
            const resolved = iss.status === 'resolved' || iss.status === 'closed';
            return (
              <motion.div key={iss.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .03 }}
                className="p-3 rounded-xl bg-muted border border-border" style={{ opacity: resolved ? .5 : 1 }}>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: sev.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: sev.color, background: sev.bg }}>{sev.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: st.color, background: st.bg }}>{iss.status.replace('_', ' ')}</span>
                    </div>
                    <div className="text-xs font-medium text-foreground">{iss.title}</div>
                    {iss.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{iss.description}</div>}
                    {iss.escalationNote && <div className="text-[10px] mt-1 px-2 py-1 rounded" style={{ background: u.errD, color: u.err }}>Escalated: {iss.escalationNote}</div>}
                    {iss.resolution && <div className="text-[10px] mt-1 px-2 py-1 rounded" style={{ background: u.okD, color: u.ok }}>Resolved: {iss.resolution}</div>}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>Owner: {iss.ownerName}</span>
                    </div>
                    {/* Status actions */}
                    {!resolved && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {(['open', 'in_progress'] as const).map(s => (
                          <motion.button key={s} whileTap={{ scale: .88 }} onClick={() => updateStatus(iss.id, s)}
                            className="px-2 py-0.5 rounded-md cursor-pointer text-[8px]"
                            style={{ border: `1px solid ${iss.status === s ? st.color : 'var(--border)'}`, background: iss.status === s ? st.bg : 'transparent', color: iss.status === s ? st.color : 'var(--muted-foreground)', fontWeight: iss.status === s ? 700 : 400 }}>
                            {s.replace('_', ' ')}
                          </motion.button>
                        ))}
                        {isEditor && (
                          <motion.button whileTap={{ scale: .88 }} onClick={() => {
                            const resolution = prompt('Resolution note:');
                            if (resolution) resolveIssue(iss.id, resolution);
                          }}
                            className="px-2 py-0.5 rounded-md cursor-pointer text-[8px] font-bold"
                            style={{ border: `1px solid ${u.ok}`, color: u.ok, background: u.okD }}>
                            resolve
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      }
    </Cd>
  );
}
