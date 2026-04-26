import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as I } from './Icons';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}

/**
 * Renders a compact text preview that opens a full modal for editing large text.
 * Replaces inline <textarea> for description fields.
 */
export default function DescriptionInput({ value, onChange, placeholder = 'Add description…', label = 'Description' }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const save = () => { onChange(draft); setOpen(false); };
  const cancel = () => { setDraft(value); setOpen(false); };

  return (
    <>
      {/* Compact trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground outline-none cursor-pointer hover:border-ring transition-colors min-h-[36px]"
      >
        {value ? (
          <span className="line-clamp-2">{value}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
            onClick={cancel}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <span className="text-sm font-bold text-foreground">{label}</span>
                <button onClick={cancel} className="p-1 rounded-md hover:bg-muted cursor-pointer bg-transparent border-none">
                  <I name="x" size={16} color="var(--muted-foreground)" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder={placeholder}
                  rows={10}
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg text-sm bg-background border border-border text-foreground outline-none resize-y focus:border-ring leading-relaxed"
                  style={{ minHeight: 200 }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
                <button onClick={cancel}
                  className="px-4 py-2 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-foreground bg-transparent cursor-pointer">
                  Cancel
                </button>
                <motion.button whileTap={{ scale: .95 }} onClick={save}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground cursor-pointer border-none">
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
