import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icons';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel',
  variant = 'danger', onConfirm, onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: isDanger ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)' }}>
                  <Icon name={isDanger ? 'trash' : 'alert'} size={20} color={isDanger ? '#F87171' : '#FBBF24'} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground mt-2">{message}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={onCancel}
                className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer text-white"
                style={{ background: isDanger ? '#dc2626' : '#d97706' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Icon name={isDanger ? 'trash' : 'alert'} size={14} color="white" />
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
