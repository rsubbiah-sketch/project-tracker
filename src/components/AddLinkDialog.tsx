import { useState, useEffect } from 'react';
import type { Doc, User } from '../types';
import { createDocument as apiCreateDocument } from '../services/api';

export interface LinkResult {
  doc: Doc;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (result: LinkResult) => void;
  /** programId to associate the document with */
  programId: string;
  /** current user for addedBy */
  currentUser: User;
}

const DOC_TYPES: { value: Doc['type']; label: string }[] = [
  { value: 'sheet', label: 'Google Sheet' },
  { value: 'doc', label: 'Google Doc' },
  { value: 'slides', label: 'Slides' },
  { value: 'pdf', label: 'PDF' },
  { value: 'link', label: 'Other Link' },
];

/** Dialog to link a document — same fields as program document form, persists to documents collection */
export default function AddLinkDialog({ open, onClose, onSubmit, programId, currentUser }: Props) {
  const [form, setForm] = useState({ name: '', type: 'link' as Doc['type'], category: '', url: '' });

  useEffect(() => {
    if (open) setForm({ name: '', type: 'link', category: '', url: '' });
  }, [open]);

  if (!open) return null;

  const canSubmit = form.name.trim().length > 0 && form.url.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const newDoc: Doc = {
      id: `DOC-${Date.now()}`,
      prgId: programId,
      name: form.name.trim(),
      type: form.type,
      url: form.url.trim(),
      addedBy: currentUser,
      addedAt: new Date().toISOString(),
      category: form.category.trim(),
    };
    apiCreateDocument({ programId, name: form.name.trim(), type: form.type, url: form.url.trim(), category: form.category.trim() }).catch(() => {});
    onSubmit({ doc: newDoc });
    onClose();
  };

  const inp =
    'h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';
  const lbl = 'text-sm font-medium text-foreground';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Link Document</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Attach a document to this item
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <label className={lbl}>Name <span className="text-muted-foreground">*</span></label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Document name…"
              className={inp}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <label className={lbl}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Doc['type'] })}
                className={inp}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <label className={lbl}>Category <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Design, Spec…"
                className={inp}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={lbl}>URL <span className="text-muted-foreground">*</span></label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className={inp}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) handleSubmit();
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md text-sm font-medium bg-background text-foreground border border-border hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Link Document
          </button>
        </div>
      </div>
    </div>
  );
}
