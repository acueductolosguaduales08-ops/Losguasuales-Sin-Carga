import { X } from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

export default function SimpleModal({ open, onClose, title, maxWidth = 'max-w-md', children, footer }) {
  useLockBodyScroll(Boolean(open), onClose);

  if (!open) return null;

  return (
    <div className="modal-shell fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain" onClick={onClose}>
      <div
        className={`modal-shell__card bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90dvh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="modal-shell__body p-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="modal-shell__footer p-5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
