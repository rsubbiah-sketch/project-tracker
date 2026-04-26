import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DescriptionInput from './DescriptionModal';
import { useUsers } from '../hooks/useUsers';
import type { Program, User, Task } from '../types';

interface CreateTaskData {
  title: string;
  desc: string;
  prgId: string;
  assignee: string;
  priority: string;
  status: string;
  due: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskData) => void;
  programs?: Program[];
  defaultProgramId?: string;
  hideProgramField?: boolean;
  currentUser: User;
  /** If provided, dialog switches to edit mode */
  initialTask?: Task | null;
}

export default function CreateTaskDialog({ open, onClose, onSubmit, programs = [], defaultProgramId, hideProgramField, currentUser, initialTask }: Props) {
  const USERS = useUsers();
  const isEdit = !!initialTask;
  const makeInitial = (): CreateTaskData => initialTask ? {
    title: initialTask.title,
    desc: initialTask.desc || '',
    prgId: initialTask.prgId || defaultProgramId || '',
    assignee: initialTask.assignee?.id || currentUser.id,
    priority: initialTask.priority || 'P1',
    status: initialTask.status || 'Todo',
    due: initialTask.due || '',
  } : {
    title: '', desc: '', prgId: defaultProgramId || '', assignee: currentUser.id, priority: 'P1', status: 'Todo', due: '',
  };

  const [data, setData] = useState<CreateTaskData>(makeInitial());

  useEffect(() => {
    if (open) setData(makeInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultProgramId, initialTask]);

  const canSubmit = data.title.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(data);
    setData({ title: '', desc: '', prgId: defaultProgramId || '', assignee: currentUser.id, priority: 'P1', status: 'Todo', due: '' });
    onClose();
  };

  const handleCancel = () => {
    setData({ title: '', desc: '', prgId: defaultProgramId || '', assignee: currentUser.id, priority: 'P1', status: 'Todo', due: '' });
    onClose();
  };

  const inp = "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] placeholder:text-muted-foreground";
  const lbl = "text-sm font-medium text-foreground";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
          onClick={handleCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-lg rounded-xl border border-border bg-card shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">{isEdit ? 'Edit task' : 'Create task'}</h2>
              <p className="text-sm text-muted-foreground mt-1.5">{isEdit ? 'Update the task details below.' : 'Add a new task. Fill in the details below.'}</p>
            </div>

            {/* Body */}
            <div className="px-6 pb-4 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className={lbl}>Title</label>
                <input
                  value={data.title}
                  onChange={e => setData({ ...data, title: e.target.value })}
                  placeholder="e.g. Review design spec"
                  autoFocus
                  className={inp}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className={lbl}>Description</label>
                <DescriptionInput value={data.desc} onChange={v => setData({ ...data, desc: v })} placeholder="Add a description…" label="Task Description" />
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={lbl}>Status</label>
                  <select value={data.status} onChange={e => setData({ ...data, status: e.target.value })} className={inp}>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Priority</label>
                  <select value={data.priority} onChange={e => setData({ ...data, priority: e.target.value })} className={inp}>
                    <option value="P0">P0 — Critical</option>
                    <option value="P1">P1 — High</option>
                    <option value="P2">P2 — Medium</option>
                    <option value="P3">P3 — Low</option>
                  </select>
                </div>
              </div>

              {/* Assignee + Due date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={lbl}>Assignee</label>
                  <select value={data.assignee} onChange={e => setData({ ...data, assignee: e.target.value })} className={inp}>
                    {!USERS.some(u => u.id === currentUser.id) && (
                      <option value={currentUser.id}>{currentUser.name} (me)</option>
                    )}
                    {USERS.map(u => <option key={u.id} value={u.id}>{u.name}{u.id === currentUser.id ? ' (me)' : ''}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Due date & time</label>
                  <input type="datetime-local" value={data.due && !data.due.includes('T') ? data.due + 'T00:00' : data.due} onChange={e => setData({ ...data, due: e.target.value })} className={inp} />
                </div>
              </div>

              {/* Program (optional) — only if programs provided and not hidden */}
              {!hideProgramField && programs.length > 0 && (
                <div className="space-y-2">
                  <label className={lbl}>Program <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <select value={data.prgId} onChange={e => setData({ ...data, prgId: e.target.value })} className={inp}>
                    <option value="">— Standalone —</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={handleCancel}
                className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-border bg-background hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isEdit ? 'Save changes' : 'Create task'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
