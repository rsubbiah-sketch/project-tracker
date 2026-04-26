import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as I } from '../components/Icons';
import { u, accent, accentText } from '../tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import { Av, Cd, Counter } from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { ActionItem, User, Team, Comment, Reply } from '../types';
import { createActionItem as apiCreate, updateActionItem as apiUpdate } from '../services/api';
import Comments from './Comments';
import { TEAMS } from '../data';
import { useRBAC } from '../hooks/useRBAC';
import DescriptionInput from '../components/DescriptionModal';

const STATUSES = ['Open', 'In Progress', 'In Review', 'Done', 'Closed'] as const;
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const;
const PRI_C: Record<string, { c: string; bg: string }> = { P0: { c: u.err, bg: u.errD }, P1: { c: u.w, bg: u.wD }, P2: { c: u.inf, bg: u.infD }, P3: { c: '#2563EB', bg: 'rgba(147,197,253,.1)' } };
const ST_C: Record<string, { c: string; bg: string }> = { Open: { c: 'var(--muted-foreground)', bg: 'var(--muted)' }, 'In Progress': { c: u.inf, bg: u.infD }, 'In Review': { c: u.pur, bg: u.purD }, Done: { c: u.ok, bg: u.okD }, Closed: { c: '#64748B', bg: 'rgba(100,116,139,.12)' } };

interface Props {
  items: ActionItem[];
  setItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
  users: User[];
  com: Comment[];
  setCom: React.Dispatch<React.SetStateAction<Comment[]>>;
  rep: Reply[];
  setRep: React.Dispatch<React.SetStateAction<Reply[]>>;
}

/** Check if current user can see this item (reporter, assignee, or team member) */
function canSee(item: ActionItem, meId: string, meName: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (item.reporter.id === meId || item.reporter.name === meName) return true;
  if (item.assignee?.id === meId || item.assignee?.name === meName) return true;
  if (item.team.some(u => u.id === meId || u.name === meName)) return true;
  return false;
}

export default function ActionItemsView({ items, setItems, users, com, setCom, rep, setRep }: Props) {
  const ME = useCurrentUser();
  const rbac = useRBAC();
  const mob = useIsMobile();
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [searchQ, setSearchQ] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'due' | 'status'>('priority');

  // Form state
  const [nf, setNf] = useState({ title: '', desc: '', assigneeId: '', teamId: '', priority: 'P1' as string, due: '', tags: '', assignMode: 'individual' as 'individual' | 'team' });

  const now = new Date();

  // Visibility: only show items where user is reporter, assignee, or team member
  const visible = items.filter(i => canSee(i, ME.id, ME.name, rbac.isAdmin));

  const openItems = visible.filter(i => i.status !== 'Done' && i.status !== 'Closed');
  const p0Items = visible.filter(i => i.priority === 'P0' && i.status !== 'Done' && i.status !== 'Closed');
  const overdueItems = visible.filter(i => i.dueDate && new Date(i.dueDate) < now && i.status !== 'Done' && i.status !== 'Closed');

  // Filter + sort
  const filtered = visible.filter(i => {
    if (filter !== 'All' && i.status !== filter) return false;
    if (searchQ && !i.title.toLowerCase().includes(searchQ.toLowerCase()) && !i.tags.some(t => t.toLowerCase().includes(searchQ.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'priority') { const p: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }; return (p[a.priority] ?? 9) - (p[b.priority] ?? 9); }
    if (sortBy === 'due') return (a.dueDate || 'z').localeCompare(b.dueDate || 'z');
    const s: Record<string, number> = { Open: 0, 'In Progress': 1, 'In Review': 2, Done: 3, Closed: 4 };
    return (s[a.status] ?? 9) - (s[b.status] ?? 9);
  });

  const createItem = () => {
    if (!nf.title.trim()) return;
    const id = `AI-${String(items.length + 1).padStart(3, '0')}`;
    const assignee = nf.assignMode === 'individual' && nf.assigneeId ? users.find(u2 => u2.id === nf.assigneeId) : undefined;
    const selectedTeam = nf.assignMode === 'team' && nf.teamId ? TEAMS.find(t => t.id === nf.teamId) : null;
    const team = selectedTeam ? selectedTeam.memberIds.map(mid => users.find(u2 => u2.id === mid)).filter(Boolean) as User[] : [];
    const newItem: ActionItem = {
      id, title: nf.title.trim(), description: nf.desc, status: 'Open', priority: nf.priority as any,
      assignee, team, reporter: ME, dueDate: nf.due, tags: nf.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setItems(prev => [...prev, newItem]);
    apiCreate({ title: nf.title.trim(), description: nf.desc, assigneeId: nf.assignMode === 'individual' ? nf.assigneeId : undefined, teamIds: team.map(u2 => u2.id), priority: nf.priority, dueDate: nf.due, tags: nf.tags.split(',').map(t => t.trim()).filter(Boolean) }).catch(() => {});
    setNf({ title: '', desc: '', assigneeId: '', teamId: '', priority: 'P1', due: '', tags: '', assignMode: 'individual' });
    setShowNew(false);
  };

  const updateItem = (id: string, patch: Partial<ActionItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i));
    apiUpdate(id, patch).catch(() => {});
  };

  const inp = 'w-full px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground outline-none focus:border-primary';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-base md:text-lg font-bold text-foreground">Action Items</h2>
        <motion.button whileTap={{ scale: .95 }} onClick={() => setShowNew(!showNew)}
          className="px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
          style={{ background: showNew ? 'var(--border)' : accent, color: showNew ? 'var(--foreground)' : accentText }}>
          <I name={showNew ? 'x' : 'plus'} size={12} color={showNew ? 'var(--foreground)' : accentText} />
          {showNew ? 'Cancel' : 'New Action Item'}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Open', v: openItems.length, c: u.inf, ic: 'list' },
          { l: 'My Items', v: visible.filter(i => i.status !== 'Done' && i.status !== 'Closed').length, c: 'var(--foreground)', ic: 'user' },
          { l: 'P0 Critical', v: p0Items.length, c: u.err, ic: 'alert' },
          { l: 'Overdue', v: overdueItems.length, c: u.err, ic: 'calendar' },
        ].map((s, i) => (
          <Cd key={i} delay={i * .06} className="p-3 md:p-4 flex flex-col items-center justify-center text-center">
            <div className="text-xl md:text-2xl font-black mb-1" style={{ color: s.c }}><Counter value={s.v} /></div>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{s.l}</span>
          </Cd>
        ))}
      </div>

      {/* New Action Item Form */}
      <AnimatePresence>{showNew && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <Cd delay={0} hover={false} className="p-4 md:p-5 mb-5">
            <div className="space-y-3">
              <input value={nf.title} onChange={e => setNf({ ...nf, title: e.target.value })} placeholder="Action item title…" className={inp} autoFocus />
              <DescriptionInput value={nf.desc} onChange={v => setNf({ ...nf, desc: v })} placeholder="Add description…" label="Action Item Description" />

              {/* Assignment mode toggle */}
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Assign to</label>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mb-2 w-fit">
                  {(['individual', 'team'] as const).map(m => (
                    <button key={m} onClick={() => setNf({ ...nf, assignMode: m, assigneeId: '', teamId: '' })}
                      className="px-3 py-1 rounded-md text-xs font-bold border-none cursor-pointer transition-all"
                      style={{ background: nf.assignMode === m ? 'var(--card)' : 'transparent', color: nf.assignMode === m ? accentText : 'var(--muted-foreground)', boxShadow: nf.assignMode === m ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
                      {m === 'individual' ? 'Individual' : 'Team'}
                    </button>
                  ))}
                </div>

                {nf.assignMode === 'individual' ? (
                  <select value={nf.assigneeId} onChange={e => setNf({ ...nf, assigneeId: e.target.value })} className={inp}>
                    <option value="">Select person…</option>
                    {users.map(u2 => <option key={u2.id} value={u2.id}>{u2.name}</option>)}
                  </select>
                ) : (
                  <div>
                    <select value={nf.teamId} onChange={e => setNf({ ...nf, teamId: e.target.value })} className={inp}>
                      <option value="">Select team…</option>
                      {TEAMS.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.memberIds.length} members)</option>
                      ))}
                    </select>
                    {nf.teamId && (() => {
                      const team = TEAMS.find(t => t.id === nf.teamId);
                      if (!team) return null;
                      const members = team.memberIds.map(mid => users.find(u2 => u2.id === mid)).filter(Boolean) as User[];
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {members.map(m => (
                            <span key={m.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-border text-foreground">
                              <Av user={m} size={14} />{m.name}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex-1" style={{ minWidth: 100 }}>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Priority</label>
                  <select value={nf.priority} onChange={e => setNf({ ...nf, priority: e.target.value })} className={inp}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex-1" style={{ minWidth: 140 }}>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Due Date</label>
                  <input type="date" value={nf.due} onChange={e => setNf({ ...nf, due: e.target.value })} className={inp} />
                </div>
                <div className="flex-1" style={{ minWidth: 140 }}>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Tags (comma-separated)</label>
                  <input value={nf.tags} onChange={e => setNf({ ...nf, tags: e.target.value })} placeholder="meeting, follow-up…" className={inp} />
                </div>
              </div>

              <motion.button whileTap={{ scale: .95 }} disabled={!nf.title.trim()} onClick={createItem}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
                style={{ background: nf.title.trim() ? accent : 'var(--border)', color: nf.title.trim() ? accentText : 'var(--muted-foreground)', opacity: nf.title.trim() ? 1 : .5 }}>
                <I name="plus" size={12} color={nf.title.trim() ? accentText : 'var(--muted-foreground)'} />Create Action Item
              </motion.button>
            </div>
          </Cd>
        </motion.div>
      )}</AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="flex gap-1 flex-wrap">
          {['All', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-2 py-1 rounded-md text-xs font-bold border-none cursor-pointer"
              style={{ background: filter === s ? (ST_C[s]?.bg || 'var(--card)') : 'transparent', color: filter === s ? (ST_C[s]?.c || accentText) : 'var(--muted-foreground)', border: `1px solid ${filter === s ? (ST_C[s]?.c || accent) + '33' : 'var(--border)'}` }}>
              {s}
            </button>
          ))}
        </div>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search…" className="px-2.5 py-1 rounded-lg text-xs bg-background border border-border text-foreground outline-none" style={{ width: 120 }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-2 py-1 rounded-lg text-xs bg-background border border-border text-foreground outline-none">
          <option value="priority">Sort: Priority</option>
          <option value="due">Sort: Due Date</option>
          <option value="status">Sort: Status</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{rbac.isAdmin ? 'Showing all items (admin)' : 'Showing items you created or are assigned to'}</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Cd delay={0} hover={false} className="p-8 text-center">
          <I name="list" size={32} color="var(--muted-foreground)" />
          <div className="text-sm text-muted-foreground mt-3">No action items{filter !== 'All' ? ` with status "${filter}"` : ''}</div>
          <div className="text-xs text-muted-foreground mt-1">Click "New Action Item" to create one</div>
        </Cd>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => {
            const isExpanded = expanded === item.id;
            const pri = PRI_C[item.priority] || PRI_C.P1;
            const st = ST_C[item.status] || ST_C.Open;
            const overdue = item.dueDate && new Date(item.dueDate) < now && item.status !== 'Done' && item.status !== 'Closed';
            const isDone = item.status === 'Done' || item.status === 'Closed';
            const itemComments = com.filter(c => c.eId === item.id);

            return (
              <Cd key={item.id} delay={idx * .03} hover={false} className="p-0 overflow-hidden">
                <div className={`p-3 md:p-4 cursor-pointer hover:bg-muted/30 transition-colors ${isDone ? 'opacity-50' : ''}`}
                  onClick={() => setExpanded(isExpanded ? null : item.id)}>
                  <div className="flex items-start gap-3">
                    <motion.button whileTap={{ scale: .8 }}
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, { status: isDone ? 'Open' : 'Done' }); }}
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer mt-0.5"
                      style={{ border: `1.5px solid ${isDone ? u.ok : 'var(--muted-foreground)'}`, background: isDone ? u.okD : 'transparent' }}>
                      {isDone && <I name="check" size={12} color={u.ok} />}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ color: pri.c, background: pri.bg }}>{item.priority}</span>
                        {overdue && <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ color: u.err, background: u.errD }}>OVERDUE</span>}
                      </div>
                      <div className="text-xs font-medium text-foreground" style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{item.title}</div>
                      {item.description && <div className="text-xs text-muted-foreground mt-0.5 truncate">{mob ? item.description.slice(0, 50) : item.description.slice(0, 100)}{item.description.length > (mob ? 50 : 100) ? '…' : ''}</div>}

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {item.assignee ? (
                          <div className="flex items-center gap-1.5"><Av user={item.assignee} size={18} /><span className="text-xs text-secondary-foreground">{item.assignee.name}</span></div>
                        ) : item.team.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-1.5">{item.team.slice(0, 4).map(u2 => <Av key={u2.id} user={u2} size={18} />)}</div>
                            {item.team.length > 4 && <span className="text-xs text-muted-foreground ml-1">+{item.team.length - 4}</span>}
                            <span className="text-xs text-muted-foreground ml-1">team</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                        {item.dueDate && (
                          <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                            <I name="calendar" size={9} color={overdue ? u.err : 'var(--muted-foreground)'} />
                            {new Date(item.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {itemComments.length > 0 && (
                          <span className="text-xs flex items-center gap-1 text-muted-foreground"><I name="chat" size={9} color="var(--muted-foreground)" />{itemComments.length}</span>
                        )}
                        <span className="text-xs text-muted-foreground">by {item.reporter.name}</span>
                        {item.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-xs font-bold bg-border text-muted-foreground">#{t}</span>
                        ))}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0" style={{ color: st.c, background: st.bg }}>{item.status}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border">
                      <div className="p-3 md:p-4 space-y-4">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Status</div>
                          <div className="flex gap-1 flex-wrap">
                            {STATUSES.map(s => (
                              <motion.button key={s} whileTap={{ scale: .88 }}
                                onClick={() => updateItem(item.id, { status: s })}
                                className="px-2.5 py-1 rounded-md cursor-pointer text-xs font-bold"
                                style={{ border: `1px solid ${item.status === s ? (ST_C[s]?.c || 'var(--border)') : 'var(--border)'}`, background: item.status === s ? (ST_C[s]?.bg || 'var(--muted)') : 'transparent', color: item.status === s ? (ST_C[s]?.c || 'var(--foreground)') : 'var(--muted-foreground)' }}>
                                {s}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Assignee</div>
                            <select value={item.assignee?.id || ''} onChange={e => { const usr = users.find(u2 => u2.id === e.target.value); updateItem(item.id, { assignee: usr || undefined, team: usr ? [] : item.team }); }}
                              className="w-full px-2 py-1.5 rounded-lg text-xs bg-background border border-border text-foreground outline-none">
                              <option value="">Unassigned</option>
                              {users.map(u2 => <option key={u2.id} value={u2.id}>{u2.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Priority</div>
                            <select value={item.priority} onChange={e => updateItem(item.id, { priority: e.target.value as any })}
                              className="w-full px-2 py-1.5 rounded-lg text-xs bg-background border border-border text-foreground outline-none">
                              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Due Date</div>
                            <input type="date" value={item.dueDate} onChange={e => updateItem(item.id, { dueDate: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg text-xs bg-background border border-border text-foreground outline-none" />
                          </div>
                        </div>

                        <Comments eId={item.id} com={com} setCom={setCom} rep={rep} setRep={setRep} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Cd>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
