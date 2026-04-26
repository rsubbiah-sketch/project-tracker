import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as I } from './Icons';
import { u, SIG, ISEV, PILLARS, DEFAULT_SUBS } from '../tokens';
import { Cd } from './ui';
import type { Sig, ProgramHealth, KeyIssue, HealthSub, Milestone } from '../types';

/* ─── Signal Dot ─── */
function Dot({ sig, size = 10 }: { sig: Sig; size?: number }) {
  const s = SIG[sig];
  return (
    <span className="inline-block rounded-full flex-shrink-0"
      style={{ width: size, height: size, background: s.c, boxShadow: `0 0 ${size/2}px ${s.c}44` }} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEALTH STRIP — compact inline display for program list cards
   Shows 3 signal dots (T/E/M) + issue count badge
   ═══════════════════════════════════════════════════════════════ */
export function HealthStrip({ health, issues = [] }: { health?: ProgramHealth; issues?: KeyIssue[] }) {
  if (!health) return null;
  const unresolved = issues.filter(i => !i.res);
  const hasCrit = unresolved.some(i => i.sev === 'C');

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {PILLARS.map(p => (
        <div key={p.key} className="flex items-center gap-1" title={`${p.label}: ${SIG[health[p.key as keyof ProgramHealth] as Sig].l}`}>
          <Dot sig={health[p.key as keyof ProgramHealth] as Sig} size={7} />
          <span className="text-xs font-bold text-muted-foreground tracking-wide">{p.icon}</span>
        </div>
      ))}
      {unresolved.length > 0 && (
        <span className="text-xs font-extrabold px-1.5 py-0.5 rounded-full"
          style={{
            color: hasCrit ? u.err : u.w,
            background: hasCrit ? u.errD : u.wD,
          }}>
          {unresolved.length}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEALTH CARD — unified display + inline editor for detail page
   Shows 3 pillar columns with sub-metrics + key issues.
   When isEditor=true, pillar signals become toggleable and
   an issue-add form appears at the bottom.
   ═══════════════════════════════════════════════════════════════ */
export function HealthCard({
  health, issues = [], isEditor = false, onHealthChange, onIssuesChange, currentUser = "PM", milestones = []
}: {
  health?: ProgramHealth;
  issues?: KeyIssue[];
  isEditor?: boolean;
  onHealthChange?: (h: ProgramHealth) => void;
  onIssuesChange?: (iss: KeyIssue[]) => void;
  currentUser?: string;
  milestones?: Milestone[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newIssue, setNewIssue] = useState({ text: '', sev: 'H' as KeyIssue['sev'], milestone: '' });

  if (!health) return (
    <Cd delay={0.04} hover={false} className="p-4 md:p-5 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <I name="activity" size={16} color="var(--foreground)" />
        <span className="text-sm font-bold text-foreground">Program Health</span>
      </div>
      <div className="text-center py-6 text-xs text-muted-foreground">
        No health metrics set
      </div>
    </Cd>
  );

  const unresolvedIssues = (issues || []).filter(i => !i.res);
  const resolvedIssues = (issues || []).filter(i => i.res);
  const allIssues = issues || [];

  /* editor helpers */
  const setSig = (pillarKey: string, sig: Sig) => {
    if (!onHealthChange) return;
    onHealthChange({ ...health, [pillarKey]: sig });
  };
  const setSubSig = (subKey: string, idx: number, sig: Sig) => {
    if (!onHealthChange) return;
    const subs = [...((health as any)[subKey] || [])];
    subs[idx] = { ...subs[idx], s: sig };
    onHealthChange({ ...health, [subKey]: subs });
  };
  const setSubNote = (subKey: string, idx: number, note: string) => {
    if (!onHealthChange) return;
    const subs = [...((health as any)[subKey] || [])];
    subs[idx] = { ...subs[idx], n: note };
    onHealthChange({ ...health, [subKey]: subs });
  };
  const addIssue = () => {
    if (!onIssuesChange || !newIssue.text.trim()) return;
    onIssuesChange([...allIssues, {
      id: `i-${Date.now()}`,
      text: newIssue.text.trim(),
      sev: newIssue.sev,
      milestone: newIssue.milestone || undefined,
      by: currentUser,
      dt: new Date().toISOString().split('T')[0],
    }]);
    setNewIssue({ text: '', sev: 'H', milestone: '' });
  };
  const toggleResolved = (id: string) => {
    if (!onIssuesChange) return;
    onIssuesChange(allIssues.map(i => i.id === id ? { ...i, res: !i.res } : i));
  };
  const removeIssue = (id: string) => {
    if (!onIssuesChange) return;
    onIssuesChange(allIssues.filter(i => i.id !== id));
  };

  const inp = "w-full px-2.5 py-1.5 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary";

  return (
    <Cd delay={0.04} hover={false} className="p-4 md:p-5 mb-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <I name="activity" size={16} color="var(--foreground)" />
        <span className="text-sm font-bold text-foreground">Program Health</span>
        <span className="text-xs text-muted-foreground">Traffic signal assessment</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex gap-1.5">
            {PILLARS.map(p => <Dot key={p.key} sig={health[p.key as keyof ProgramHealth] as Sig} size={10} />)}
          </div>
          {isEditor && (
            <motion.button whileTap={{ scale: .9 }}
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer"
              style={{
                background: editing ? u.infD : 'var(--muted)',
                color: editing ? u.inf : 'var(--muted-foreground)',
                border: `1px solid ${editing ? u.inf + '33' : 'var(--border)'}`,
              }}>
              <I name={editing ? "check" : "settings"} size={10} color={editing ? u.inf : 'var(--muted-foreground)'} />
              {editing ? "Done" : "Edit"}
            </motion.button>
          )}
        </div>
      </div>

      {/* Three Pillars */}
      <div className="grid grid-cols-3 gap-2.5">
        {PILLARS.map(pillar => {
          const sig = health[pillar.key as keyof ProgramHealth] as Sig;
          const subs = (health[pillar.subKey as keyof ProgramHealth] as HealthSub[] | undefined) || [];
          const isExp = expanded === pillar.key;
          const s = SIG[sig];

          return (
            <div key={pillar.key}
              className="rounded-xl transition-all"
              style={{ background: s.bg, border: `1.5px solid ${s.c}22`, padding: '10px 12px' }}>
              {/* Pillar header */}
              <div className="flex items-center gap-1.5 mb-1">
                <Dot sig={sig} size={9} />
                <span className="text-xs font-extrabold text-foreground flex-1">{pillar.label}</span>
                {/* Edit mode: signal toggle */}
                {editing && isEditor && (
                  <div className="flex gap-1">
                    {(['G','A','R'] as Sig[]).map(sv => (
                      <motion.button key={sv} whileTap={{ scale: 0.85 }}
                        onClick={() => setSig(pillar.key, sv)}
                        className="w-5 h-5 rounded-md flex items-center justify-center cursor-pointer"
                        style={{
                          border: sig === sv ? `2px solid ${SIG[sv].c}` : '1px solid var(--border)',
                          background: sig === sv ? SIG[sv].bg : 'var(--card)',
                        }}>
                        <Dot sig={sv} size={5} />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs font-bold" style={{ color: s.c }}>{s.l}</div>

              {/* Sub-metrics: always expandable on click */}
              {subs.length > 0 && (
                <div className="mt-1.5 cursor-pointer" onClick={() => setExpanded(isExp ? null : pillar.key)}>
                  {!isExp && (
                    <div className="text-xs text-muted-foreground font-medium">
                      {subs.length} sub-metrics &#9662;
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence>{isExp && subs.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 pt-2 flex flex-col gap-1.5"
                  style={{ borderTop: '1px solid rgba(0,0,0,.06)' }}>
                  {subs.map((sub, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Dot sig={sub.s} size={5} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-foreground leading-tight">{sub.l}</span>
                          {/* Edit mode: sub-metric signal toggle */}
                          {editing && isEditor && (
                            <div className="flex gap-0.5 ml-auto">
                              {(['G','A','R'] as Sig[]).map(sv => (
                                <motion.button key={sv} whileTap={{ scale: 0.85 }}
                                  onClick={(e) => { e.stopPropagation(); setSubSig(pillar.subKey, i, sv); }}
                                  className="w-[14px] h-[14px] rounded flex items-center justify-center cursor-pointer"
                                  style={{
                                    border: sub.s === sv ? `1.5px solid ${SIG[sv].c}` : '1px solid var(--border)',
                                    background: sub.s === sv ? SIG[sv].bg : 'var(--card)',
                                  }}>
                                  <Dot sig={sv} size={3} />
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Context note (view or edit) */}
                        {editing && isEditor ? (
                          <input value={sub.n || ''} onChange={e => setSubNote(pillar.subKey, i, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            placeholder="Context note…"
                            className="mt-0.5 w-full px-1.5 py-0.5 rounded text-xs outline-none bg-card border border-border text-foreground focus:border-primary" />
                        ) : (
                          sub.n && <div className="text-xs text-muted-foreground leading-snug mt-0.5">{sub.n}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Collapse hint */}
                  <div className="text-xs text-muted-foreground font-medium text-center mt-1 cursor-pointer"
                    onClick={() => setExpanded(null)}>
                    &#9652; collapse
                  </div>
                </motion.div>
              )}</AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ═══ KEY ISSUES SECTION ═══ */}
      {(unresolvedIssues.length > 0 || (editing && isEditor)) && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <I name="alert" size={13} color={unresolvedIssues.some(i => i.sev === 'C') ? u.err : unresolvedIssues.length > 0 ? u.w : 'var(--muted-foreground)'} />
            <span className="text-xs font-extrabold text-foreground">Key Issues</span>
            {unresolvedIssues.length > 0 && (
              <span className="text-xs font-extrabold px-1.5 py-0.5 rounded-full"
                style={{
                  color: unresolvedIssues.some(i => i.sev === 'C') ? u.err : u.w,
                  background: unresolvedIssues.some(i => i.sev === 'C') ? u.errD : u.wD,
                }}>
                {unresolvedIssues.length} open
              </span>
            )}
          </div>

          {/* Unresolved issues */}
          {unresolvedIssues.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {unresolvedIssues.map(issue => {
                const sv = ISEV[issue.sev];
                return (
                  <div key={issue.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2"
                    style={{ background: sv.bg, border: `1px solid ${sv.c}15` }}>
                    {/* Resolve checkbox (editor only) */}
                    {editing && isEditor && (
                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleResolved(issue.id)}
                        className="w-4 h-4 rounded flex items-center justify-center cursor-pointer flex-shrink-0"
                        style={{ border: '1.5px solid var(--border)', background: 'transparent' }}
                        title="Mark resolved">
                      </motion.button>
                    )}
                    <span className="text-xs font-black px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: sv.c, color: '#fff' }}>
                      {sv.l}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground leading-snug">{issue.text}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {issue.by} &middot; {issue.dt}
                        {issue.milestone && <> &middot; <span className="font-bold">{issue.milestone}</span></>}
                      </div>
                    </div>
                    {/* Remove button (editor only) */}
                    {editing && isEditor && (
                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => removeIssue(issue.id)}
                        className="p-0.5 rounded hover:bg-border cursor-pointer flex-shrink-0" title="Remove">
                        <I name="x" size={10} color="var(--muted-foreground)" />
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Resolved issues (collapsed, show count) */}
          {resolvedIssues.length > 0 && (
            <div className="mt-2 px-2 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
              {resolvedIssues.length} resolved issue{resolvedIssues.length > 1 ? 's' : ''}
              {editing && isEditor && (
                <span className="ml-2">
                  {resolvedIssues.map(ri => (
                    <span key={ri.id} className="inline-flex items-center gap-1 mx-1 line-through opacity-60">
                      {ri.text}
                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleResolved(ri.id)}
                        className="text-xs underline cursor-pointer" style={{ color: u.inf }}>reopen</motion.button>
                    </span>
                  ))}
                </span>
              )}
            </div>
          )}

          {/* Add new issue form (editor + editing mode) */}
          {editing && isEditor && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              <select value={newIssue.sev}
                onChange={e => setNewIssue({ ...newIssue, sev: e.target.value as KeyIssue['sev'] })}
                className="px-2 py-1.5 rounded-lg text-xs outline-none bg-card border border-border text-foreground w-20">
                <option value="C">Critical</option>
                <option value="H">High</option>
                <option value="M">Medium</option>
              </select>
              {milestones.length > 0 && (
                <select value={newIssue.milestone}
                  onChange={e => setNewIssue({ ...newIssue, milestone: e.target.value })}
                  className="px-2 py-1.5 rounded-lg text-xs outline-none bg-card border border-border text-foreground max-w-[140px]">
                  <option value="">No milestone</option>
                  {milestones.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
              )}
              <input value={newIssue.text}
                onChange={e => setNewIssue({ ...newIssue, text: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addIssue()}
                placeholder="Describe key issue…"
                className={`${inp} flex-1`} />
              <motion.button whileTap={{ scale: 0.9 }} onClick={addIssue}
                disabled={!newIssue.text.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                style={{
                  background: newIssue.text.trim() ? u.infD : 'var(--border)',
                  color: newIssue.text.trim() ? u.inf : 'var(--muted-foreground)',
                  opacity: newIssue.text.trim() ? 1 : 0.5,
                }}>
                <I name="plus" size={10} color={newIssue.text.trim() ? u.inf : 'var(--muted-foreground)'} />Add
              </motion.button>
            </div>
          )}

          {/* Hint for non-editing editors */}
          {!editing && isEditor && unresolvedIssues.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-2">
              No open issues — click Edit to add one
            </div>
          )}
        </div>
      )}
    </Cd>
  );
}


/* ─── Helper: create default empty health object ─── */
export function emptyHealth(): ProgramHealth {
  return {
    t: 'G', e: 'G', m: 'G',
    ts: DEFAULT_SUBS.ts.map(l => ({ l, s: 'G' as Sig })),
    es: DEFAULT_SUBS.es.map(l => ({ l, s: 'G' as Sig })),
    ms: DEFAULT_SUBS.ms.map(l => ({ l, s: 'G' as Sig })),
  };
}
