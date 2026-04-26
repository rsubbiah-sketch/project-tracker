import { useState, useEffect, useRef, Fragment } from 'react';
import { Icon as I } from './Icons';
import { useUsers } from '../hooks/useUsers';
import type { Task, Program } from '../types';
import { updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  programs?: Program[];
  showProgramColumn?: boolean;
  onRowClick?: (taskId: string) => void;
  expandedId?: string | null;
  renderExpanded?: (task: Task) => React.ReactNode;
  onEdit?: (task: Task) => void;
}

/** Shadcn-style task table — matches ui.shadcn.com/examples/tasks */
export default function TaskTable({ tasks, setTasks, programs = [], showProgramColumn = false, onRowClick, expandedId, renderExpanded, onEdit }: Props) {
  const USERS = useUsers();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [sortBy, setSortBy] = useState<'title' | 'status' | 'priority'>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const toggleSort = (col: 'title' | 'status' | 'priority') => {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === tasks.length) setSelected(new Set());
    else setSelected(new Set(tasks.map(t => t.id)));
  };

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortBy === 'status') {
      const order: Record<string, number> = { Todo: 0, 'In Progress': 1, 'In Review': 2, Done: 3 };
      cmp = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    } else if (sortBy === 'priority') {
      const order: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
      cmp = (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Priority → arrow + color
  const priorityMeta: Record<string, { label: string; arrow: string; color: string }> = {
    P0: { label: 'Critical', arrow: '↑', color: '#ef4444' },
    P1: { label: 'High', arrow: '↑', color: '#f59e0b' },
    P2: { label: 'Medium', arrow: '→', color: '#3b82f6' },
    P3: { label: 'Low', arrow: '↓', color: '#64748b' },
  };

  const assignTask = async (taskId: string, userId: string) => {
    const u = USERS.find(x => x.id === userId);
    if (!u) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee: u } : t));
    try {
      const mod = await import('../services/api');
      await mod.reassignTask(taskId, userId);
    } catch (err) {
      console.error('Failed to reassign task:', err);
    }
  };

  const updateStatus = async (taskId: string, status: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    try {
      await apiUpdateTask(taskId, { status });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    let removed: Task | undefined;
    setTasks(prev => {
      removed = prev.find(t => t.id === taskId);
      return prev.filter(t => t.id !== taskId);
    });
    try {
      await apiDeleteTask(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
      if (removed) setTasks(prev => [...prev, removed!]);
    }
    setDeleteTarget(null);
    setMenuOpen(null);
  };

  const headerBtn = "inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0";
  const sortArrow = (col: string) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
  const menuItem = "w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-sm cursor-pointer bg-transparent border-none flex items-center gap-2";

  return (
    <div className="rounded-md border border-border overflow-visible">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 border-b border-border">
          <tr>
            <th className="w-10 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selected.size === tasks.length && tasks.length > 0}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
            </th>
            <th className="px-2 py-3 text-left">
              <button onClick={() => toggleSort('title')} className={headerBtn}>Title{sortArrow('title')}</button>
            </th>
            {showProgramColumn && (
              <th className="px-2 py-3 text-left w-32 hidden lg:table-cell">
                <span className="text-sm font-medium text-muted-foreground">Program</span>
              </th>
            )}
            <th className="px-2 py-3 text-left w-36">
              <button onClick={() => toggleSort('status')} className={headerBtn}>Status{sortArrow('status')}</button>
            </th>
            <th className="px-2 py-3 text-left w-28">
              <button onClick={() => toggleSort('priority')} className={headerBtn}>Priority{sortArrow('priority')}</button>
            </th>
            <th className="px-2 py-3 text-left w-36 hidden md:table-cell">
              <span className="text-sm font-medium text-muted-foreground">Assignee</span>
            </th>
            <th className="w-16 px-4 py-3 text-right">
              <span className="text-sm font-medium text-muted-foreground">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={showProgramColumn ? 7 : 6} className="text-center py-10 text-sm text-muted-foreground">No tasks</td></tr>
          ) : sorted.map(tk => {
            const pri = priorityMeta[tk.priority] || priorityMeta.P2;
            const isSelected = selected.has(tk.id);
            const isExpanded = expandedId === tk.id;
            const prgObj = programs.find(p => p.id === tk.prgId);
            const isMenuOpen = menuOpen === tk.id;
            return (
              <Fragment key={tk.id}>
                <tr className={`border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${isSelected ? 'bg-muted/20' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(tk.id)}>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(tk.id)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="text-sm font-medium text-foreground truncate max-w-md" style={{ textDecoration: tk.status === 'Done' ? 'line-through' : 'none', opacity: tk.status === 'Done' ? 0.6 : 1 }}>
                      {tk.title}
                    </div>
                  </td>
                  {showProgramColumn && (
                    <td className="px-2 py-3 hidden lg:table-cell">
                      {prgObj ? (
                        <span className="text-sm text-muted-foreground truncate max-w-[120px] inline-block">{prgObj.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                    <select value={tk.status} onChange={e => updateStatus(tk.id, e.target.value)}
                      className="inline-flex items-center gap-1.5 text-sm text-foreground bg-transparent border-none cursor-pointer outline-none">
                      {['Todo', 'In Progress', 'In Review', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-3">
                    <span className="inline-flex items-center gap-1 text-sm" style={{ color: pri.color }}>
                      <span className="font-bold">{pri.arrow}</span>
                      <span className="text-foreground">{pri.label}</span>
                    </span>
                  </td>
                  <td className="px-2 py-3 hidden md:table-cell" onClick={e => e.stopPropagation()}>
                    <select value={tk.assignee.id} onChange={e => assignTask(tk.id, e.target.value)}
                      className="text-sm text-foreground bg-transparent border-none cursor-pointer outline-none max-w-[120px]">
                      {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpen(isMenuOpen ? null : tk.id)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors cursor-pointer bg-transparent border-none"
                      aria-label="Open actions menu"
                    >
                      <I name="more" size={16} color="var(--muted-foreground)" />
                    </button>
                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-2 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-md z-50 py-1"
                        style={{ background: 'var(--popover, var(--card))' }}
                      >
                        <button onClick={() => {
                          if (onEdit) onEdit(tk);
                          else {
                            const newTitle = prompt('Edit task title:', tk.title);
                            if (newTitle && newTitle.trim()) {
                              setTasks(prev => prev.map(t => t.id === tk.id ? { ...t, title: newTitle.trim() } : t));
                              apiUpdateTask(tk.id, { title: newTitle.trim() }).catch(() => {});
                            }
                          }
                          setMenuOpen(null);
                        }} className={menuItem}>
                          <I name="edit" size={14} color="var(--muted-foreground)" />
                          Edit
                        </button>
                        <button onClick={() => { updateStatus(tk.id, tk.status === 'Done' ? 'Todo' : 'Done'); setMenuOpen(null); }} className={menuItem}>
                          <I name="check" size={14} color="var(--muted-foreground)" />
                          {tk.status === 'Done' ? 'Mark as Todo' : 'Mark as Done'}
                        </button>
                        <button onClick={() => { onRowClick?.(tk.id); setMenuOpen(null); }} className={menuItem}>
                          <I name="chat" size={14} color="var(--muted-foreground)" />
                          Comments
                        </button>
                        <div className="h-px bg-border my-1" />
                        <button
                          onClick={() => { setDeleteTarget({ id: tk.id, title: tk.title }); setMenuOpen(null); }}
                          className={`${menuItem} text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30`}
                          style={{ color: '#dc2626' }}
                        >
                          <I name="trash" size={14} color="#dc2626" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {isExpanded && renderExpanded && (
                  <tr>
                    <td colSpan={showProgramColumn ? 7 : 6} className="bg-muted/20 border-b border-border p-0">
                      {renderExpanded(tk)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        onConfirm={() => deleteTarget && deleteTask(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
