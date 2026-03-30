import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Icons';
import { Av, Cd, Counter } from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ROLE_HIERARCHY, PERMISSIONS, hasMinRole, type RBACRole } from '../hooks/useRBAC';
import type { User } from '../types';

/* ═══ ROLE DESCRIPTIONS ═══ */
const ROLE_INFO: Record<RBACRole, { label: string; desc: string; color: string; bg: string }> = {
  admin:       { label: 'Admin',       desc: 'Full access — manage users, roles, audit log, all CRUD',       color: '#F87171', bg: 'rgba(248,113,113,.12)' },
  editor:      { label: 'Editor',      desc: 'Create programs, approve gates, manage tasks, full documents',  color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
  commenter:   { label: 'Commenter',  desc: 'Create tasks/comments, update assigned tasks, link documents', color: '#60A5FA', bg: 'rgba(96,165,250,.12)' },
  viewer:      { label: 'Viewer',      desc: 'Read-only access to all programs, tasks, and documents',       color: '#64748B', bg: 'rgba(100,116,139,.12)' },
};

/* ═══ MOCK AUDIT LOG ═══ */
const MOCK_AUDIT = [
  { id: 'a1', userId: 'u4', userName: 'Priya Sharma', action: 'approve_gate', entity: 'program', entityId: 'PRG-001', details: 'Verification → Tapeout', ts: '2026-03-18T09:30:00' },
  { id: 'a2', userId: 'u1', userName: 'Vikram Patel', action: 'update', entity: 'task', entityId: 'TK-001', details: 'Status: Todo → In Progress', ts: '2026-03-18T08:15:00' },
  { id: 'a3', userId: 'u4', userName: 'Priya Sharma', action: 'create', entity: 'program', entityId: 'PRG-007', details: 'Created: UALink PHY v2', ts: '2026-03-17T14:00:00' },
  { id: 'a4', userId: 'u2', userName: 'Sarah Chen', action: 'create', entity: 'task', entityId: 'TK-013', details: 'Review thermal sim results', ts: '2026-03-17T11:30:00' },
  { id: 'a5', userId: 'u3', userName: 'James Rodriguez', action: 'update', entity: 'program', entityId: 'PRG-003', details: 'Phase: Development → Integration', ts: '2026-03-16T16:00:00' },
  { id: 'a6', userId: 'u5', userName: 'David Kim', action: 'create', entity: 'comment', entityId: 'c8', details: 'Commented on 400G Optics Qual', ts: '2026-03-16T10:00:00' },
  { id: 'a7', userId: 'u6', userName: 'Lisa Wang', action: 'reassign', entity: 'task', entityId: 'TK-005', details: 'Reassigned to David Kim', ts: '2026-03-15T09:00:00' },
  { id: 'a8', userId: 'u4', userName: 'Priya Sharma', action: 'activate_plan', entity: 'program', entityId: 'PRG-004', details: 'UALink Scale-Up activated', ts: '2026-03-14T15:30:00' },
];

const ACTION_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  create:        { color: '#34D399', bg: 'rgba(52,211,153,.12)',  icon: 'plus' },
  update:        { color: '#60A5FA', bg: 'rgba(96,165,250,.12)',  icon: 'settings' },
  delete:        { color: '#F87171', bg: 'rgba(248,113,113,.12)', icon: 'trash' },
  approve_gate:  { color: '#A78BFA', bg: 'rgba(167,139,250,.12)', icon: 'shield' },
  activate_plan: { color: '#FBBF24', bg: 'rgba(251,191,36,.12)',  icon: 'zap' },
  reassign:      { color: '#60A5FA', bg: 'rgba(96,165,250,.12)',  icon: 'user' },
};

/* ═══ PERMISSIONS MATRIX ═══ */
const PERM_GROUPS = [
  { group: 'Programs',      perms: ['program.view', 'program.create', 'program.edit', 'program.delete', 'program.activate'] },
  { group: 'Tasks',         perms: ['task.view', 'task.create', 'task.edit.own', 'task.edit.any', 'task.delete', 'task.reassign'] },
  { group: 'Gate Reviews',  perms: ['gate.view', 'gate.update', 'gate.approve'] },
  { group: 'Documents',     perms: ['doc.view', 'doc.link', 'doc.remove'] },
  { group: 'Comments',      perms: ['comment.view', 'comment.create', 'comment.delete.own', 'comment.delete.any'] },
  { group: 'Admin',         perms: ['admin.view', 'admin.manage_users', 'admin.view_audit', 'admin.manage_roles'] },
];

/* ═══ COMPONENT ═══ */

interface AdminViewProps {
  users: User[];
  setUsers: (fn: (prev: User[]) => User[]) => void;
}

export default function AdminView({ users, setUsers }: AdminViewProps) {
  const ME = useCurrentUser();
  const [tab, setTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState('all');

  const tabs = [
    { id: 'users' as const, label: 'User Management', icon: 'user' },
    { id: 'roles' as const, label: 'Roles & Permissions', icon: 'shield' },
    { id: 'audit' as const, label: 'Audit Log', icon: 'activity' },
  ];

  const stats = [
    { label: 'Total Users', value: users.length, color: '#60A5FA', icon: 'user' },
    { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#F87171', icon: 'shield' },
    { label: 'Editors', value: users.filter(u => u.role === 'editor').length, color: '#A78BFA', icon: 'plan' },
    { label: 'Audit Events', value: MOCK_AUDIT.length, color: '#34D399', icon: 'activity' },
  ];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAudit = auditFilter === 'all'
    ? MOCK_AUDIT
    : MOCK_AUDIT.filter(a => a.action === auditFilter);

  const changeRole = (userId: string, newRole: string) => {
    if (userId === ME.id) return; // Can't change own role
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setEditingUser(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {stats.map((s, i) => (
          <Cd key={i} delay={i * 0.06} className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{s.label}</span>
              <Icon name={s.icon} size={14} color={s.color} />
            </div>
            <div className="text-3xl font-black" style={{ color: s.color }}><Counter value={s.value} /></div>
          </Cd>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {tabs.map(t => (
          <motion.button key={t.id} whileTap={{ scale: .95 }} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === t.id ? 'hsl(var(--accent))' : 'transparent',
              color: tab === t.id ? 'hsl(var(--accent-foreground))' : 'var(--muted-foreground)',
              border: `1px solid ${tab === t.id ? 'hsl(var(--accent))' : 'hsl(var(--border))'}`,
            }}>
            <Icon name={t.icon} size={14} color={tab === t.id ? 'hsl(var(--accent-foreground))' : 'var(--muted-foreground)'} />
            {t.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ═══ USER MANAGEMENT TAB ═══ */}
        {tab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                <Icon name="search" size={14} color="var(--muted-foreground)" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                  className="bg-transparent text-xs outline-none flex-1 text-foreground" style={{ fontFamily: 'inherit' }} />
              </div>
            </div>

            <div className="space-y-2">
              {filteredUsers.map((user, i) => {
                const roleInfo = ROLE_INFO[(user.role || 'viewer').toLowerCase() as RBACRole] || ROLE_INFO.viewer;
                const isMe = user.id === ME.id;
                const isEditing = editingUser === user.id;
                return (
                  <Cd key={user.id} delay={i * 0.03} hover={false} className="p-4">
                    <div className="flex items-center gap-4">
                      <Av user={user} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-foreground">{user.name}</span>
                          {isMe && <span className="text-[8px] px-1.5 py-0.5 rounded font-bold bg-accent text-accent-foreground">YOU</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: roleInfo.color, background: roleInfo.bg }}>
                          {roleInfo.label}
                        </span>
                        {!isMe && (
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditingUser(isEditing ? null : user.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-muted-foreground cursor-pointer">
                            <Icon name="settings" size={12} color="var(--muted-foreground)" />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Role change panel */}
                    <AnimatePresence>
                      {isEditing && !isMe && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-2">Change role for {user.name}:</div>
                          <div className="flex gap-2">
                            {ROLE_HIERARCHY.map(r => {
                              const ri = ROLE_INFO[r];
                              const active = user.role.toLowerCase() === r;
                              return (
                                <motion.button key={r} whileTap={{ scale: 0.95 }} onClick={() => changeRole(user.id, r)}
                                  className="flex-1 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
                                  style={{
                                    background: active ? ri.bg : 'transparent',
                                    color: active ? ri.color : 'var(--muted-foreground)',
                                    border: `1.5px solid ${active ? ri.color : 'hsl(var(--border))'}`,
                                  }}>
                                  {ri.label}
                                </motion.button>
                              );
                            })}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-2">
                            {ROLE_INFO[(user.role || 'viewer').toLowerCase() as RBACRole]?.desc}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Cd>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ ROLES & PERMISSIONS TAB ═══ */}
        {tab === 'roles' && (
          <motion.div key="roles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Role cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {ROLE_HIERARCHY.slice().reverse().map((r, i) => {
                const ri = ROLE_INFO[r];
                const count = users.filter(u => (u.role || 'viewer').toLowerCase() === r).length;
                return (
                  <Cd key={r} delay={i * 0.06} hover={false} className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ri.bg }}>
                        <Icon name="user" size={18} color={ri.color} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-foreground">{ri.label}</div>
                        <div className="text-xs text-muted-foreground">{ri.desc}</div>
                      </div>
                      <span className="text-xl font-black" style={{ color: ri.color }}>{count}</span>
                    </div>
                  </Cd>
                );
              })}
            </div>

            {/* Permission matrix */}
            <Cd delay={0.2} hover={false} className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="shield" size={16} color="var(--foreground)" />
                <span className="text-sm font-bold text-foreground">Permission matrix</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">Permission</th>
                      {ROLE_HIERARCHY.slice().reverse().map(r => (
                        <th key={r} className="text-center py-2 px-3 font-semibold" style={{ color: ROLE_INFO[r].color }}>{ROLE_INFO[r].label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERM_GROUPS.map(grp => (
                      <>
                        <tr key={grp.group}>
                          <td colSpan={5} className="pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{grp.group}</td>
                        </tr>
                        {grp.perms.map(perm => {
                          const minRole = PERMISSIONS[perm as keyof typeof PERMISSIONS];
                          return (
                            <tr key={perm} className="border-b border-border/50">
                              <td className="py-2 pr-4 text-foreground font-mono text-[10px]">{perm}</td>
                              {ROLE_HIERARCHY.slice().reverse().map(r => {
                                const allowed = hasMinRole(r, minRole);
                                return (
                                  <td key={r} className="text-center py-2 px-3">
                                    {allowed
                                      ? <span className="inline-block w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(52,211,153,.15)' }}><Icon name="check" size={12} color="#34D399" /></span>
                                      : <span className="inline-block w-5 h-5 rounded-md bg-border/30" />
                                    }
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </Cd>
          </motion.div>
        )}

        {/* ═══ AUDIT LOG TAB ═══ */}
        {tab === 'audit' && (
          <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {['all', 'create', 'update', 'delete', 'approve_gate', 'activate_plan', 'reassign'].map(f => (
                <motion.button key={f} whileTap={{ scale: .95 }} onClick={() => setAuditFilter(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium capitalize"
                  style={{
                    background: auditFilter === f ? 'hsl(var(--accent))' : 'transparent',
                    color: auditFilter === f ? 'hsl(var(--accent-foreground))' : 'var(--muted-foreground)',
                    border: `1px solid ${auditFilter === f ? 'hsl(var(--accent))' : 'hsl(var(--border))'}`,
                  }}>
                  {f === 'all' ? 'All' : f.replace('_', ' ')}
                </motion.button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredAudit.map((entry, i) => {
                const ac = ACTION_COLORS[entry.action] || ACTION_COLORS.update;
                return (
                  <Cd key={entry.id} delay={i * 0.03} hover={false} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ac.bg }}>
                        <Icon name={ac.icon} size={16} color={ac.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-foreground">{entry.userName}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: ac.color, background: ac.bg }}>
                            {entry.action.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{entry.details}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {entry.entity} · {entry.entityId} · {new Date(entry.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </Cd>
                );
              })}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
