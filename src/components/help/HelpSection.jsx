import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function HelpSection({ icon: Icon, title, roleBadge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  const badgeColors = {
    Todos: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Público: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    Asociado: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Tesorero: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Administrador: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-dark-bg/40 transition-colors"
      >
        <span className="shrink-0 w-10 h-10 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-gray-800 dark:text-white">{title}</span>
          {roleBadge && (
            <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColors[roleBadge] || badgeColors.Todos}`}>
              {roleBadge}
            </span>
          )}
        </span>
        <span className="shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-dark-muted animate-[slideDown_0.2s_ease]">
          <div className="pt-4 space-y-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
