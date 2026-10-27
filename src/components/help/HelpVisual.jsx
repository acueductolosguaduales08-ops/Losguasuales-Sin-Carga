import { ChevronRight, X, Search } from 'lucide-react';

export function FakeButton({ children, variant = 'primary', small = false }) {
  const v = {
    primary: 'bg-brand text-white shadow-lg shadow-brand/20',
    secondary: 'bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-muted',
    success: 'bg-emerald-500 text-white',
    danger: 'bg-red-500 text-white',
    warning: 'bg-amber-500 text-white',
    outline: 'border border-brand text-brand bg-transparent',
    ghost: 'text-brand bg-brand/5',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl font-semibold pointer-events-none select-none ${v[variant]} ${small ? 'px-2.5 py-1 text-[10px]' : 'px-4 py-2 text-xs'}`}>
      {children}
    </span>
  );
}

// Botón real deshabilitado con el mismo markup/clases que usa la app (QueryCards, Recibos, etc.)
export function RealButton({ children, variant = 'brand', small = false, icon: Icon }) {
  const variants = {
    brand: 'bg-brand text-white shadow-lg shadow-brand/20',
    emerald: 'bg-emerald-600 text-white',
    ghost: 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-white border border-gray-200 dark:border-dark-muted',
    outline: 'border border-brand text-brand bg-transparent',
  };
  return (
    <button disabled className={`inline-flex items-center gap-1.5 rounded-xl font-semibold opacity-80 cursor-not-allowed pointer-events-none select-none ${variants[variant]} ${small ? 'px-2.5 py-1.5 text-[11px]' : 'px-4 py-2.5 text-xs'}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

export function RealInput({ placeholder, value, icon: Icon = Search }) {
  return (
    <div className="relative pointer-events-none select-none">
      {Icon && <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
      <div className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-white`}>
        <span className={value ? 'text-gray-800 dark:text-white' : 'text-gray-400'}>{value || placeholder}</span>
      </div>
    </div>
  );
}

export function RealCardPreview({ title, subtitle, badge, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-dark-muted p-4 shadow-sm pointer-events-none select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-800 dark:text-white">{title}</span>
        {badge}
      </div>
      {subtitle && <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">{subtitle}</div>}
      {children}
    </div>
  );
}

export function FakeInput({ placeholder, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted text-xs text-gray-400 pointer-events-none select-none">
      <span className="truncate">{value || placeholder}</span>
    </div>
  );
}

export function FakeSelect({ value }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted text-xs text-gray-700 dark:text-gray-300 pointer-events-none select-none">
      <span>{value}</span>
      <ChevronRight className="w-3.5 h-3.5 rotate-90 text-gray-400" />
    </div>
  );
}

export function FakeCard({ children, className = '' }) {
  return (
    <div className={`bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl p-3 space-y-2 pointer-events-none select-none ${className}`}>
      {children}
    </div>
  );
}

export function FakeBadge({ children, color = 'gray' }) {
  const c = {
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-dark-muted dark:text-gray-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${c[color]}`}>{children}</span>
  );
}

export function FakeModal({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-xl overflow-hidden pointer-events-none select-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-muted">
        <span className="text-xs font-bold text-gray-800 dark:text-white">{title}</span>
        <X className="w-4 h-4 text-gray-400" />
      </div>
      <div className="p-4 space-y-2.5">{children}</div>
    </div>
  );
}

export function FakeAction({ icon: Icon, label, description, color = 'bg-brand/10 text-brand' }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-dark-muted pointer-events-none select-none">
      <span className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-gray-800 dark:text-white">{label}</span>
        {description && <span className="block text-[10px] text-gray-500 dark:text-gray-400 truncate">{description}</span>}
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
    </div>
  );
}

export function FakeTabs({ tabs, active = 0 }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1 pointer-events-none select-none">
      {tabs.map((tab, i) => (
        <span key={i} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${i === active ? 'bg-brand border-brand text-white' : 'border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'}`}>{tab}</span>
      ))}
    </div>
  );
}

export function FakeFilters({ items, active = 0 }) {
  return (
    <div className="flex gap-1.5 flex-wrap pointer-events-none select-none">
      {items.map((item, i) => (
        <span key={i} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${i === active ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-dark-muted text-gray-600 dark:text-gray-400'}`}>{item}</span>
      ))}
    </div>
  );
}

export function FakeListItem({ title, subtitle, badge }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-dark-muted pointer-events-none select-none">
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-gray-800 dark:text-white">{title}</span>
        {subtitle && <span className="block text-[10px] text-gray-500 dark:text-gray-400 truncate">{subtitle}</span>}
      </span>
      {badge && <FakeBadge color={badge.color}>{badge.label}</FakeBadge>}
    </div>
  );
}

export function FakeToggle({ checked = true, label }) {
  return (
    <div className="flex items-center gap-2 pointer-events-none select-none">
      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-gray-300 dark:bg-dark-muted'}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
      </span>
      {label && <span className="text-[10px] text-gray-600 dark:text-gray-400">{label}</span>}
    </div>
  );
}

export function FakeProgress({ value = 70, label, color = 'bg-brand' }) {
  return (
    <div className="space-y-1 pointer-events-none select-none">
      {label && <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400"><span>{label}</span><span>{value}%</span></div>}
      <div className="h-2 rounded-full bg-gray-100 dark:bg-dark-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function FakeKPI({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-dark-muted rounded-xl p-3 text-center pointer-events-none select-none">
      <div className="text-lg font-bold text-gray-800 dark:text-white">{value}</div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

export function FakeTextarea({ placeholder }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted text-[10px] text-gray-400 pointer-events-none select-none h-16">{placeholder}</div>
  );
}

export function FakeRadio({ label, checked = false }) {
  return (
    <div className="flex items-center gap-2 pointer-events-none select-none">
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${checked ? 'border-brand' : 'border-gray-300 dark:border-dark-muted'}`}>
        {checked && <span className="w-2 h-2 rounded-full bg-brand" />}
      </span>
      <span className="text-[11px] text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  );
}

export function FakeProfile() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden pointer-events-none select-none">
      <div className="h-16 bg-gradient-to-r from-brand to-sky-400 relative">
        <div className="absolute -bottom-7 left-4 w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center text-lg font-bold border-2 border-white dark:border-dark-card">JP</div>
      </div>
      <div className="pt-9 pb-4 px-4">
        <div className="text-sm font-bold text-gray-800 dark:text-white">Juan Perez</div>
        <div className="text-[10px] text-gray-500 dark:text-gray-400">juan@email.com</div>
        <FakeBadge color="blue">Asociado</FakeBadge>
      </div>
    </div>
  );
}

export function FakeInvoice() {
  return (
    <FakeCard>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800 dark:text-white">FAC-000123</span>
        <FakeBadge color="amber">Pendiente</FakeBadge>
      </div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400">15/01/2026 - Juan Perez</div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand">$45.000</span>
        <span className="text-[10px] text-gray-400">Vence: 15/02/2026</span>
      </div>
      <div className="flex gap-1.5 pt-1">
        <FakeButton small variant="ghost">Ver detalle</FakeButton>
        <FakeButton small variant="ghost">PDF</FakeButton>
      </div>
    </FakeCard>
  );
}

export function FakeReceipt() {
  return (
    <FakeCard>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800 dark:text-white">RCB-000045</span>
        <FakeBadge color="green">Pagado</FakeBadge>
      </div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400">05/02/2026 - Efectivo</div>
      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">$25.000</div>
    </FakeCard>
  );
}

export function FakeMeter() {
  return (
    <FakeCard>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800 dark:text-white">M-001</span>
        <FakeBadge color="green">Activo</FakeBadge>
      </div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400">Calle 10 #5-20</div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400">Asignado: Juan Perez</div>
    </FakeCard>
  );
}

export function FakeMovement({ type = 'income', desc, amount, method }) {
  const isIncome = type === 'income';
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-dark-muted pointer-events-none select-none">
      <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isIncome ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
        {isIncome ? '📥' : '📤'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-gray-800 dark:text-white">{desc}</span>
        <span className="block text-[10px] text-gray-500 dark:text-gray-400">{method}</span>
      </span>
      <span className={`text-xs font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
        {isIncome ? '+' : '-'}{amount}
      </span>
    </div>
  );
}

export function FakeSurvey() {
  return (
    <FakeCard>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800 dark:text-white">Encuesta de satisfaccion</span>
        <FakeBadge color="green">Activa</FakeBadge>
      </div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400">15 respuestas</div>
      <FakeButton small variant="ghost">Responder</FakeButton>
    </FakeCard>
  );
}

export function FakeHero() {
  return (
    <div className="bg-gradient-to-r from-brand to-sky-400 rounded-2xl p-4 text-white pointer-events-none select-none">
      <div className="text-sm font-bold">Bienvenido al Acueducto</div>
      <div className="text-[10px] opacity-80">Los Guaduales - Servicio de agua potable</div>
    </div>
  );
}

export function Arrow({ direction = 'right', label }) {
  const rotation = { right: 0, down: 90, left: 180, up: -90 };
  return (
    <div className="flex items-center gap-1 text-brand pointer-events-none select-none">
      <ChevronRight className="w-4 h-4" style={{ transform: `rotate(${rotation[direction]}deg)` }} />
      {label && <span className="text-[10px] font-semibold">{label}</span>}
    </div>
  );
}
