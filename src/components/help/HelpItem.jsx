import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function HelpItem({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-100 dark:border-dark-muted rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-dark-bg/30 transition-colors"
      >
        {icon && <span className="text-base">{icon}</span>}
        <span className="min-w-0 flex-1 text-xs font-semibold text-gray-700 dark:text-gray-200">{title}</span>
        <span className="shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-50 dark:border-dark-muted/50 animate-[slideDown_0.2s_ease]">
          <div className="pt-3 space-y-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
