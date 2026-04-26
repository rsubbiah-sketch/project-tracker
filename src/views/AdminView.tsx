import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Icons';
import { Av, Cd, Counter } from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ROLE_HIERARCHY, PERMISSIONS, hasMinRole, type RBACRole } from '../hooks/useRBAC';
import type { User } from '../types';
import { TEAMS } from '../data';
import { updateUser as apiUpdateUser, createUser as apiCreateUser, deleteUser as apiDeleteUser, fetchAuditLog } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

/* ═══ ROLE DESCRIPTIONS ═══ */
const ROLE_INFO: Record<RBACRole, { label: string; desc: string }> = {
  admin:       { label: 'Admin',      desc: 'Full access — manage users, teams, audit log, delete programs' },
  editor:      { label: 'Editor',     desc: 'Create programs, manage milestones & tasks, link documents' },
  commenter:   { label: 'Commenter',  desc: 'Create tasks & comments, edit own milestones, link documents' },
  viewer:      { label: 'Viewer',     desc: 'Read-only access to all programs, tasks, and documents' },
};

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ts: string;
}

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
  { group: 'Programs',      perms: ['program.view', 'program.create', 'program.edit', 'program.delete'] },
  { group: 'Milestones',    perms: ['milestone.view', 'milestone.add', 'milestone.edit.own', 'milestone.edit.any', 'milestone.delete'] },
  { group: 'Tasks',         perms: ['task.view', 'task.create', 'task.edit.own', 'task.edit.any', 'task.delete', 'task.reassign'] },
  { group: 'Documents',     perms: ['doc.view', 'doc.link', 'doc.remove'] },
  { group: 'Comments',      perms: ['comment.view', 'comment.create', 'comment.delete.own', 'comment.delete.any'] },
  { group: 'Admin & Teams', perms: ['admin.view', 'admin.manage_users', 'admin.manage_teams', 'admin.view_audit'] },
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
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAuditLoading(true);
    fetchAuditLog()
      .then(data => {
        if (cancelled) return;
        setAuditEntries((data as AuditEntry[]) ?? []);
        setAuditError(null);
      })
      .catch(err => {
        if (cancelled) return;
        setAuditEntries([]);
        setAuditError(err?.message || 'Failed to load audit log');
      })
      .finally(() => { if (!cancelled) setAuditLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'commenter', team: '' });
  const [addingUser, setAddingUser] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const tabs = [
    { id: 'users' as const, label: 'User Management', icon: 'user' },
    { id: 'roles' as const, label: 'Roles & Permissions', icon: 'shield' },
    { id: 'audit' as const, label: 'Audit Log', icon: 'activity' },
  ];

const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAudit = auditFilter === 'all'
    ? auditEntries
    : auditEntries.filter(a => a.action === auditFilter);

  const changeRole = (userId: string, newRole: string) => {
    if (userId === ME.id) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    apiUpdateUser(userId, { role: newRole }).catch(() => {});
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const deleteUserHandler = async (userId: string) => {
    try {
      await apiDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
    setDeleteTarget(null);
    setEditingUser(null);
    setMenuOpen(null);
  };

  const addUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || addingUser) return;
    setAddingUser(true);
    try {
      const created = await apiCreateUser({
        name: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
        team: newUser.team,
      });
      const av = newUser.name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
      setUsers(prev => [...prev, { id: created.id, name: created.name, role: created.role, av, team: created.team || '' }]);
      setNewUser({ name: '', email: '', role: 'commenter', team: '' });
      setShowAddUser(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const changeTeam = (userId: string, teamId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, team: teamId } : u));
    apiUpdateUser(userId, { team: teamId }).catch(() => {});
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">User management, roles, and audit log</p>
      </div>

{/* Tabs — shadcn style */}
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center justify-center gap-1.5 h-[calc(100%-1px)] px-3 rounded-md border border-transparent text-sm font-medium cursor-pointer whitespace-nowrap transition-[color,background-color,box-shadow] ${tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
            <Icon name={t.icon} size={13} color="currentColor" />
            {t.label}
          </button>
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
              <button onClick={() => setShowAddUser(!showAddUser)}
                className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer ${showAddUser ? 'border border-border bg-background hover:bg-muted text-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                <Icon name={showAddUser ? 'x' : 'plus'} size={14} color="currentColor" />
                {showAddUser ? 'Cancel' : 'Add User'}
              </button>
            </div>

            {/* Add User Form */}
            <AnimatePresence>
              {showAddUser && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <Cd delay={0} hover={false} className="p-4 md:p-5 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon name="user" size={16} color="var(--foreground)" />
                      <span className="text-sm font-semibold text-foreground">Pre-populate New User</span>
                      <span className="text-xs text-muted-foreground">— user will be linked to Google on first login</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block font-medium text-muted-foreground">Name <span className="text-red-400">*</span></label>
                        <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                          placeholder="Full name…"
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block font-medium text-muted-foreground">Email <span className="text-red-400">*</span></label>
                        <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                          placeholder="user@upscaleai.com"
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block font-medium text-muted-foreground">Role</label>
                        <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary cursor-pointer">
                          {ROLE_HIERARCHY.map(r => <option key={r} value={r}>{ROLE_INFO[r].label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block font-medium text-muted-foreground">Team</label>
                        <select value={newUser.team} onChange={e => setNewUser(p => ({ ...p, team: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary cursor-pointer">
                          <option value="">— No team —</option>
                          {TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => { setShowAddUser(false); setNewUser({ name: '', email: '', role: 'commenter', team: '' }); }}
                        className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer">
                        Cancel
                      </button>
                      <button disabled={!newUser.name.trim() || !newUser.email.trim() || addingUser} onClick={addUser}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
                        <Icon name="plus" size={12} color="currentColor" />
                        {addingUser ? 'Adding…' : 'Add User'}
                      </button>
                    </div>
                  </Cd>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-md border border-border overflow-visible">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-28">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-36 hidden lg:table-cell">Team</th>
                    <th className="w-14 px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">No users found</td></tr>
                  ) : filteredUsers.map(user => {
                    const roleInfo = ROLE_INFO[(user.role || 'viewer').toLowerCase() as RBACRole] || ROLE_INFO.viewer;
                    const isMe = user.id === ME.id;
                    const isEditing = editingUser === user.id;
                    const isMenuOpen = menuOpen === user.id;

                    return (
                      <React.Fragment key={user.id}>
                        <tr className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Av user={user} size={32} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{user.name}</span>
                                  {isMe && <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-accent text-accent-foreground">YOU</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px] inline-block">{user.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                              {roleInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {user.team ? (TEAMS.find(t => t.id === user.team)?.name || user.team) : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right relative">
                            {!isMe && (
                              <>
                                <button
                                  onClick={() => setMenuOpen(isMenuOpen ? null : user.id)}
                                  className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors cursor-pointer bg-transparent border-none"
                                  aria-label="Open actions menu"
                                >
                                  <Icon name="more" size={16} color="var(--muted-foreground)" />
                                </button>
                                {isMenuOpen && (
                                  <div
                                    ref={menuRef}
                                    className="absolute right-2 top-full mt-1 w-44 bg-popover border border-border rounded-md shadow-md z-50 py-1"
                                    style={{ background: 'var(--popover, var(--card))' }}
                                  >
                                    <button onClick={() => { setEditingUser(isEditing ? null : user.id); setMenuOpen(null); }}
                                      className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2">
                                      <Icon name="edit" size={14} color="var(--muted-foreground)" />
                                      Edit
                                    </button>
                                    <div className="h-px bg-border my-1" />
                                    <button onClick={() => { setDeleteTarget({ id: user.id, name: user.name }); setMenuOpen(null); }}
                                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2"
                                      style={{ color: '#dc2626' }}>
                                      <Icon name="trash" size={14} color="#dc2626" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                        {/* Inline edit form */}
                        {isEditing && !isMe && (
                          <tr>
                            <td colSpan={5} className="bg-muted/20 border-b border-border p-0">
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="p-4 md:p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <Icon name="edit" size={14} color="var(--foreground)" />
                                  <span className="text-sm font-semibold text-foreground">Edit User</span>
                                  <span className="text-xs text-muted-foreground">— {user.name}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs mb-1 block font-medium text-muted-foreground">Role</label>
                                    <select
                                      value={(user.role || 'viewer').toLowerCase()}
                                      onChange={e => changeRole(user.id, e.target.value)}
                                      className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary cursor-pointer"
                                    >
                                      {ROLE_HIERARCHY.map(r => (
                                        <option key={r} value={r}>{ROLE_INFO[r].label} — {ROLE_INFO[r].desc}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs mb-1 block font-medium text-muted-foreground">Team</label>
                                    <select
                                      value={user.team || ''}
                                      onChange={e => changeTeam(user.id, e.target.value)}
                                      className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-card border border-border text-foreground focus:border-primary cursor-pointer"
                                    >
                                      <option value="">— No team —</option>
                                      {TEAMS.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-3">
                                  <button onClick={() => setEditingUser(null)}
                                    className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
                                    Done
                                  </button>
                                  <button onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium border border-border bg-background hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                    style={{ color: '#dc2626' }}>
                                    <Icon name="trash" size={12} color="#dc2626" />
                                    Delete User
                                  </button>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ═══ ROLES & PERMISSIONS TAB ═══ */}
        {tab === 'roles' && (
          <motion.div key="roles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Role summary table */}
            <div className="rounded-md border border-border overflow-hidden mb-5">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-20">Users</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLE_HIERARCHY.slice().reverse().map(r => {
                    const ri = ROLE_INFO[r];
                    const count = users.filter(u => (u.role || 'viewer').toLowerCase() === r).length;
                    return (
                      <tr key={r} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-foreground">{ri.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">{ri.desc}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-foreground tabular-nums">{count}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Permission matrix */}
            <div className="rounded-md border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Permission matrix</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Permission</th>
                      {ROLE_HIERARCHY.slice().reverse().map(r => (
                        <th key={r} className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">{ROLE_INFO[r].label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERM_GROUPS.map(grp => (
                      <>
                        <tr key={grp.group} className="bg-muted/10">
                          <td colSpan={5} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{grp.group}</td>
                        </tr>
                        {grp.perms.map(perm => {
                          const minRole = PERMISSIONS[perm as keyof typeof PERMISSIONS];
                          return (
                            <tr key={perm} className="border-b border-border/50">
                              <td className="px-4 py-2 text-sm text-foreground font-mono">{perm}</td>
                              {ROLE_HIERARCHY.slice().reverse().map(r => {
                                const allowed = hasMinRole(r, minRole);
                                return (
                                  <td key={r} className="text-center px-4 py-2">
                                    {allowed
                                      ? <Icon name="check" size={14} color="var(--foreground)" />
                                      : <span className="inline-block w-3.5 h-px bg-border" />
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
            </div>
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

            {auditLoading && (
              <div className="text-sm text-muted-foreground py-8 text-center">Loading audit log…</div>
            )}
            {!auditLoading && auditError && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Failed to load audit log: {auditError}
              </div>
            )}
            {!auditLoading && !auditError && filteredAudit.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">No audit events.</div>
            )}
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
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ color: ac.color, background: ac.bg }}>
                            {entry.action.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{entry.details}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
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
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will remove their account and cannot be undone.`}
        confirmLabel="Delete User"
        onConfirm={() => deleteTarget && deleteUserHandler(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  );
}
