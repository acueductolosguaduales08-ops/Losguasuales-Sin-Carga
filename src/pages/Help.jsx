import { useState, useMemo } from 'react';
import { BookOpen, Search, Home, FileText, Receipt, QrCode, MessageSquareWarning, ClipboardList, UserCircle2, MessageCircle, Users, Gauge, Droplet, Wallet, CalendarRange, Settings, History, BellPlus, Trash2, Share2, ShieldAlert, Eye, Download, Edit3, Filter, ArrowDown, ChevronDown, ChevronRight, LayoutDashboard, FileBarChart, AlertTriangle, Send, Check, X, Info } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import HelpSection from '../components/help/HelpSection';
import HelpItem from '../components/help/HelpItem';
import { FakeButton, FakeInput, FakeSelect, FakeCard, FakeBadge, FakeModal, FakeAction, FakeTabs, FakeFilters, FakeListItem, FakeToggle, FakeProgress, FakeKPI, FakeTextarea, FakeRadio, FakeProfile, FakeInvoice, FakeReceipt, FakeMeter, FakeMovement, FakeSurvey, FakeHero, Arrow, RealButton, RealInput, RealCardPreview } from '../components/help/HelpVisual';

const ROLE_TABS = [
  { key: 'PUBLICO', label: 'Público' },
  { key: 'ASOCIADO', label: 'Asociado' },
  { key: 'TESORERO', label: 'Tesorero' },
  { key: 'ADMINISTRADOR', label: 'Administrador' },
];

export default function Help() {
  const { rol, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const getInitialRole = () => {
    if (!isAuthenticated) return 'PUBLICO';
    if (rol && ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'].includes(rol)) return rol;
    return 'PUBLICO';
  };
  const [roleTab, setRoleTab] = useState(getInitialRole);

  const matchesRole = (roles) => {
    if (roles.includes('PUBLICO') && roleTab === 'PUBLICO') return true;
    if (roles.includes(roleTab)) return true;
    return false;
  };

  const matchesSearch = (text) => {
    if (!search) return true;
    return text.toLowerCase().includes(search.toLowerCase());
  };

  const sectionVisible = (roles, ...texts) => {
    if (!matchesRole(roles)) return false;
    if (search && !texts.some(t => matchesSearch(t))) return false;
    return true;
  };

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />
      <main className="w-full max-w-4xl mx-auto pt-20 md:pt-24 pb-10 px-4 md:px-6">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">Centro de Ayuda</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">Aprende a usar la plataforma paso a paso. Selecciona tu rol y explora las secciones.</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar instrucciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 transition-shadow"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Tabs */}
        <div className="flex gap-1.5 mb-8 overflow-x-auto hide-scrollbar pb-1">
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRoleTab(t.key)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                roleTab === t.key
                  ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20'
                  : 'border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* SECCIONES DE AYUDA                          */}
        {/* ═══════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* ── 0. PÚBLICO - BIENVENIDA E INICIO SIN CUENTA ── */}
          {sectionVisible(['PUBLICO'], 'publico', 'bienvenido', 'inicio publico', 'hero', 'galeria', 'fotos', 'videos', 'publicaciones', 'consulta', 'estado servicio', 'sin cuenta') && (
            <HelpSection icon={Home} title="Bienvenido — Acceso sin cuenta" roleBadge="Público">
              <HelpItem title="Qué puedes hacer sin iniciar sesión" defaultOpen={search.length > 0}>
                <p>Como visitante <strong>público</strong> puedes usar la app sin cuenta. Solo algunos módulos requieren login.</p>
                <div className="grid grid-cols-2 gap-2">
                  <RealCardPreview title="✅ Sin login" subtitle="Inicio, Encuestas, Reportes, Compartir, Ayuda" badge={<FakeBadge color="green">Público</FakeBadge>} />
                  <RealCardPreview title="🔒 Con login" subtitle="Facturas, Recibos, Multas, Chat, Tesorería" badge={<FakeBadge color="amber">Login</FakeBadge>} />
                </div>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Explora el Inicio con banner, galería y noticias</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Consulta el estado del servicio con tu documento</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Consulta una factura o recibo por número</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Pantalla de inicio (público)">
                <p>Es la misma que ven los asociados. No necesitas iniciar sesión para verla.</p>
                <FakeHero />
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <RealCardPreview title="Consultar estado del servicio" subtitle="Ingresa tu número de documento">
                    <RealInput placeholder="Número de documento" value="" />
                    <div className="flex justify-end mt-2"><RealButton icon={Search}>Consultar</RealButton></div>
                  </RealCardPreview>
                  <RealCardPreview title="Consultar factura o recibo" subtitle="Escribe el número del QR impreso">
                    <div className="flex gap-1.5 mb-2">
                      <RealButton small variant="brand">Factura</RealButton>
                      <RealButton small variant="ghost">Recibo</RealButton>
                    </div>
                    <RealInput placeholder="FAC-000001" value="FAC-000123" />
                    <div className="flex gap-2 mt-2">
                      <RealButton icon={Search} small>Buscar</RealButton>
                      <RealButton icon={QrCode} small variant="brand">Escanear</RealButton>
                    </div>
                  </RealCardPreview>
                </div>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Los dos buscadores usan el <strong>mismo diseño real</strong>: fondo gris, borde, botón <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand text-white text-[10px]">Buscar</span></span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca <strong>Factura / Recibo</strong> para cambiar el tipo de consulta</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>El botón QR abre la cámara para escanear</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Iniciar sesión">
                <p>Para ver tus facturas y datos personales necesitas entrar con tu usuario.</p>
                <FakeModal title="Iniciar sesión">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Usuario</div><RealInput placeholder="Tu usuario" value="juan.perez" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Contraseña</div><RealInput placeholder="••••••••" value="••••••••" /></div>
                    <RealButton>Ingresar</RealButton>
                  </div>
                </FakeModal>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Botón <strong>Ingresar</strong> es <span className="px-2 py-0.5 rounded bg-brand text-white text-[10px]">bg-brand</span> — idéntico al real</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Si olvidaste la clave, contacta al administrador</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 0b. PÚBLICO - ENCUESTAS, REPORTES Y COMPARTIR ── */}
          {sectionVisible(['PUBLICO'], 'encuestas publicas', 'reportes publicos', 'compartir publico', 'encuesta', 'reporte', 'comunidad', 'compartir', 'qr') && (
            <HelpSection icon={ClipboardList} title="Encuestas, Reportes y Compartir (público)" roleBadge="Público">
              <HelpItem title="Ver y responder encuestas" defaultOpen={search.length > 0}>
                <p>Cualquier visitante puede ver las encuestas activas y participar.</p>
                <FakeSurvey />
                <div className="flex gap-2 mt-2">
                  <RealButton small>Responder</RealButton>
                  <RealButton small variant="ghost">Ver QR</RealButton>
                </div>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca <strong>Responder</strong> para abrir el formulario</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>El botón es <span className="px-2 py-0.5 rounded bg-brand/10 text-brand text-[10px]">Responder</span> — mismo estilo que en la app real</span></li>
                </ul>
              </HelpItem>
              <HelpItem title="Enviar reporte comunitario">
                <p>Reporta fugas o quejas sin necesidad de cuenta. Solo nombre y detalle.</p>
                <FakeModal title="Reporte comunitario">
                  <div className="space-y-2">
                    <RealInput placeholder="Tu nombre completo" value="Ana García" />
                    <FakeTextarea placeholder="Describe el problema..." />
                    <RealButton>📤 Enviar reporte</RealButton>
                  </div>
                </FakeModal>
              </HelpItem>
              <HelpItem title="Compartir la app">
                <p>Comparte el enlace o el QR con vecinos, sin login.</p>
                <div className="text-center space-y-2">
                  <div className="w-28 h-28 mx-auto rounded-xl bg-gray-100 dark:bg-dark-muted flex items-center justify-center text-4xl border-2 border-dashed border-gray-300 dark:border-dark-muted">▣</div>
                  <RealButton small variant="ghost">📥 Descargar QR</RealButton>
                </div>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 1. MI INICIO ── */}
          {sectionVisible(['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'], 'inicio', 'pantalla', 'hero', 'galeria', 'fotos', 'videos', 'publicaciones', 'noticias', 'consulta', 'facturas rapidas') && (
            <HelpSection icon={Home} title="Mi Inicio" roleBadge="Todos">
              <HelpItem title="Pantalla de inicio" defaultOpen={search.length > 0}>
                <p>La pantalla de inicio es lo primero que ves al abrir la aplicacion. Aqui encuentras las novedades del acueducto.</p>
                <FakeHero />
                <p className="font-semibold text-gray-700 dark:text-gray-300">El banner principal muestra:</p>
                <ul className="list-none space-y-1.5">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Bienvenida con imagen del acueducto</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Galeria de fotos de la comunidad</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Videos relacionados</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Publicaciones y noticias</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Botones de consulta rapida de facturas</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Galeria de fotos">
                <p>Explora las fotos del acueducto y la comunidad con scroll horizontal.</p>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
                  {[1,2,3].map(i => <div key={i} className="shrink-0 w-20 h-14 rounded-lg bg-gradient-to-br from-brand/20 to-sky-200 dark:from-brand/30 dark:to-sky-800 flex items-center justify-center text-lg">📷</div>)}
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Desliza hacia la izquierda para ver mas fotos</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca una foto para verla en pantalla completa</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Usa las flechas para navegar entre fotos</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Ver publicaciones">
                <p>Lee las noticias y avisos del acueducto.</p>
                <FakeCard>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📰</span>
                    <div>
                      <div className="text-xs font-bold text-gray-800 dark:text-white">Aviso importante</div>
                      <div className="text-[10px] text-gray-500">15/02/2026</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Se informa que el proximo lunes habra mantenimiento...</div>
                  <FakeButton small variant="ghost">Leer mas →</FakeButton>
                </FakeCard>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Leer mas" para ver el contenido completo</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Desliza para ver mas publicaciones</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Ver videos">
                <p>Mira videos relacionados con el acueducto.</p>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
                  {[1,2].map(i => (
                    <div key={i} className="shrink-0 w-28 rounded-xl bg-gray-100 dark:bg-dark-muted overflow-hidden pointer-events-none select-none">
                      <div className="h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-muted dark:to-dark-card flex items-center justify-center text-xl">▶️</div>
                      <div className="p-2 text-[10px] font-semibold text-gray-700 dark:text-gray-300">Video {i}</div>
                    </div>
                  ))}
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca el boton ▶️ para reproducir el video</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>El video se abre en una ventana emergente</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Consultar facturas rapidas">
                <p>Consulta tus facturas o recibos escribiendo el numero directamente desde la pantalla de inicio.</p>
                <div className="space-y-2">
                  <FakeInput placeholder="Escribe numero de factura..." value="FAC-000123" />
                  <Arrow direction="down" label="Se muestra automaticamente" />
                  <FakeInvoice />
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Escribe el numero de factura o recibo en el buscador</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Se muestra el resultado automaticamente</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Ver detalle" para mas informacion</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 2. MIS FACTURAS ── */}
          {sectionVisible(['ASOCIADO'], 'facturas', 'mis facturas', 'descargar', 'pdf', 'detalle', 'saldo') && (
            <HelpSection icon={FileText} title="Mis Facturas" roleBadge="Asociado">
              <HelpItem title="Ver mis facturas" defaultOpen={search.length > 0}>
                <p>Consulta todas tus facturas de servicio de agua.</p>
                <div className="space-y-2">
                  <FakeKPI label="Saldo total pendiente" value="$125.000" />
                  <Arrow direction="down" label="Lista de facturas" />
                  <FakeInvoice />
                  <FakeInvoice />
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>El saldo total pendiente aparece arriba</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Las facturas se ordenan de mas reciente a mas antigua</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Ver detalle" para ver toda la informacion</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Descargar factura en PDF">
                <p>Descarga la factura como archivo PDF para imprimir o guardar.</p>
                <FakeInvoice />
                <div className="flex items-center gap-2 mt-2">
                  <Arrow direction="right" label="Toca PDF" />
                  <FakeButton small variant="ghost">📄 PDF</FakeButton>
                  <Arrow direction="right" label="Se descarga" />
                  <FakeButton small variant="secondary">📥 Descargar</FakeButton>
                </div>
              </HelpItem>

              <HelpItem title="Ver detalle de una factura">
                <p>Al tocar "Ver detalle" se abre una ventana con toda la informacion.</p>
                <FakeModal title="FAC-000123">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]"><span className="text-gray-500">Fecha:</span><span className="font-semibold text-gray-800 dark:text-white">15/01/2026</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-500">Vence:</span><span className="font-semibold text-gray-800 dark:text-white">15/02/2026</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-500">Estado:</span><FakeBadge color="amber">Pendiente</FakeBadge></div>
                    <div className="border-t border-gray-100 dark:border-dark-muted pt-1.5">
                      <div className="flex justify-between text-[10px]"><span className="text-gray-500">Consumo:</span><span className="text-gray-800 dark:text-white">12 m³</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-gray-500">Tarifa/m³:</span><span className="text-gray-800 dark:text-white">$3.500</span></div>
                      <div className="flex justify-between text-xs font-bold pt-1"><span className="text-gray-800 dark:text-white">Total:</span><span className="text-brand">$45.000</span></div>
                    </div>
                  </div>
                  <FakeButton small>📄 Descargar PDF</FakeButton>
                </FakeModal>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 3. MIS MULTAS ── */}
          {sectionVisible(['ASOCIADO'], 'multas', 'mis multas', 'penalizacion', 'recibo multa') && (
            <HelpSection icon={ShieldAlert} title="Mis Multas" roleBadge="Asociado">
              <HelpItem title="Ver mis multas" defaultOpen={search.length > 0}>
                <p>Consulta las multas o penalizaciones que se te han aplicado.</p>
                <FakeFilters items={['Todos', 'Pendientes', 'Pagadas', 'Anuladas']} active={0} />
                <div className="space-y-2 mt-2">
                  <FakeListItem title="Multa por retraso" subtitle="20/01/2026" badge={{ label: 'Pendiente', color: 'amber' }} />
                  <FakeListItem title="Multa por dano" subtitle="05/02/2026" badge={{ label: 'Pagada', color: 'green' }} />
                </div>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Usa los filtros para ver todas, pendientes o pagadas</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Si una multa esta pagada, toca "Ver recibo" para ver el comprobante</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Ver recibo de una multa">
                <p>Al tocar "Ver recibo" en una multa pagada se abre el comprobante.</p>
                <FakeModal title="Recibo RCB-000045">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]"><span className="text-gray-500">Fecha:</span><span className="text-gray-800 dark:text-white">05/02/2026</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-500">Valor:</span><span className="text-gray-800 dark:text-white">$25.000</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-500">Metodo:</span><span className="text-gray-800 dark:text-white">Efectivo</span></div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <FakeButton small variant="ghost">Ver en linea</FakeButton>
                    <FakeButton small variant="ghost">📄 PDF</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 4. RECIBOS ── */}
          {sectionVisible(['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'], 'recibos', 'comprobante', 'pago') && (
            <HelpSection icon={Receipt} title="Recibos" roleBadge="Todos">
              <HelpItem title="Ver recibos" defaultOpen={search.length > 0}>
                <p>Los recibos son los comprobantes de pago. Aqui puedes ver todos los recibos generados.</p>
                <FakeTabs tabs={['Todos', 'Por asociado', 'Busqueda directa']} active={0} />
                <div className="space-y-2 mt-2">
                  <FakeReceipt />
                  <FakeReceipt />
                </div>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Los asociados ven solo sus propios recibos</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Admin y tesorero pueden buscar por asociado o numero</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Buscar recibo por numero">
                <p>Busca un recibo especifico escribiendo su numero.</p>
                <FakeTabs tabs={['Todos', 'Por asociado', 'Busqueda directa']} active={2} />
                <div className="space-y-2 mt-2">
                  <FakeInput placeholder="Buscar por numero..." value="RCB-000045" />
                  <FakeButton small>Buscar</FakeButton>
                  <Arrow direction="down" label="Resultado" />
                  <FakeReceipt />
                </div>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 5. ESCANEAR QR ── */}
          {sectionVisible(['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'], 'qr', 'escanear', 'codigo', 'camara') && (
            <HelpSection icon={QrCode} title="Escanear Codigo QR" roleBadge="Todos">
              <HelpItem title="Como escanear un codigo QR" defaultOpen={search.length > 0}>
                <p>Usa la camara de tu celular para escanear codigos QR de facturas, recibos o formularios.</p>
                <FakeCard className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-xl bg-gray-100 dark:bg-dark-muted flex items-center justify-center text-3xl border-2 border-dashed border-gray-300 dark:border-dark-muted">📷</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Apunta la camara al codigo QR</div>
                  <div className="flex justify-center gap-2 pt-1">
                    <FakeButton small variant="secondary">🔄 Cambiar camara</FakeButton>
                    <FakeButton small variant="ghost">← Volver</FakeButton>
                  </div>
                </FakeCard>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Escanear QR" en el menu</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Apunta la camara al codigo QR</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>La app detecta automaticamente el codigo</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Despues de escanear">
                <p>Segun el tipo de documento escaneado, veras diferentes opciones.</p>
                <div className="space-y-2">
                  <FakeCard>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✅ Factura detectada</div>
                    <div className="text-[10px] text-gray-500">FAC-000123 - Juan Perez</div>
                    <div className="flex gap-1 flex-wrap">
                      <FakeButton small variant="ghost">📄 PDF</FakeButton>
                      <FakeButton small variant="ghost">📋 Ver factura</FakeButton>
                      <FakeButton small variant="ghost">💰 Registrar pago</FakeButton>
                    </div>
                  </FakeCard>
                  <FakeCard>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✅ Formulario detectado</div>
                    <div className="text-[10px] text-gray-500">Encuesta de satisfaccion</div>
                    <FakeButton small variant="ghost">📝 Responder encuesta</FakeButton>
                  </FakeCard>
                </div>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 6. REPORTE COMUNITARIO ── */}
          {sectionVisible(['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'], 'reporte', 'comunidad', 'fuga', 'queja', 'reclamo') && (
            <HelpSection icon={MessageSquareWarning} title="Reporte Comunitario" roleBadge="Todos">
              <HelpItem title="Como enviar un reporte" defaultOpen={search.length > 0}>
                <p>¿Viste una fuga, un problema o tienes una queja? Envia un reporte directamente al acueducto.</p>
                <FakeModal title="Reporte comunitario">
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Nombre completo*</div>
                      <FakeInput placeholder="Tu nombre" value="Juan Perez" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Medio de contacto</div>
                      <FakeInput placeholder="Telefono o email" value="310 123 4567" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Detalle del reporte*</div>
                      <FakeTextarea placeholder="Describe el problema que viste..." />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Foto (opcional)</div>
                      <FakeInput placeholder="URL de la imagen" />
                    </div>
                    <FakeButton>📤 Enviar reporte</FakeButton>
                  </div>
                </FakeModal>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Escribe tu nombre completo</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Describe el problema con detalle</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Opcionalmente agrega una foto</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Enviar reporte" y recibe confirmacion</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 7. ENCUESTAS ── */}
          {sectionVisible(['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'], 'encuestas', 'formularios', 'responder', 'encuesta') && (
            <HelpSection icon={ClipboardList} title="Encuestas y Formularios" roleBadge="Todos">
              <HelpItem title="Ver encuestas disponibles" defaultOpen={search.length > 0}>
                <p>Responde encuestas creadas por el acueducto para participar en decisiones de la comunidad.</p>
                <FakeSurvey />
                <FakeSurvey />
              </HelpItem>

              <HelpItem title="Responder una encuesta">
                <p>Al tocar "Responder" se abre el formulario con las preguntas.</p>
                <FakeModal title="Encuesta de satisfaccion">
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">1. ¿Como calificarias el servicio?</div>
                      <div className="space-y-1">
                        <FakeRadio label="Excelente" />
                        <FakeRadio label="Bueno" checked />
                        <FakeRadio label="Regular" />
                        <FakeRadio label="Malo" />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">2. ¿Ha tenido fallas?</div>
                      <div className="space-y-1">
                        <FakeRadio label="Si" />
                        <FakeRadio label="No" checked />
                      </div>
                    </div>
                    <FakeButton>📤 Enviar respuesta</FakeButton>
                  </div>
                </FakeModal>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Lee cada pregunta cuidadosamente</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Selecciona la respuesta que mejor se adapte</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Enviar respuesta" y veras un agradecimiento</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 8. MI CUENTA ── */}
          {sectionVisible(['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'], 'cuenta', 'perfil', 'contraseña', 'password', 'datos') && (
            <HelpSection icon={UserCircle2} title="Mi Cuenta" roleBadge="Todos">
              <HelpItem title="Ver mi perfil" defaultOpen={search.length > 0}>
                <p>Consulta y administra tu informacion personal.</p>
                <FakeProfile />
                <div className="space-y-2 mt-2">
                  <FakeAction icon={Settings} label="Cambiar contrasena" description="Actualiza tu clave de acceso" />
                  <FakeAction icon={Edit3} label="Editar mis datos" description="Nombre, telefono, direccion" />
                </div>
              </HelpItem>

              <HelpItem title="Cambiar contrasena">
                <p>Actualiza tu contrasena de acceso a la plataforma.</p>
                <FakeModal title="Cambiar contrasena">
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Contrasena actual</div>
                      <FakeInput placeholder="••••••••" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Nueva contrasena</div>
                      <FakeInput placeholder="••••••••" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Confirmar contrasena</div>
                      <FakeInput placeholder="••••••••" />
                    </div>
                    <FakeButton>💾 Guardar contrasena</FakeButton>
                  </div>
                </FakeModal>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Escribe tu contrasena actual</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Escribe la nueva contrasena (minimo 8 caracteres)</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Confirma la nueva contrasena</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Guardar contrasena"</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 9. CHAT ── */}
          {sectionVisible(['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'], 'chat', 'mensajes', 'conversacion') && (
            <HelpSection icon={MessageCircle} title="Chat" roleBadge="Todos">
              <HelpItem title="Usar el chat" defaultOpen={search.length > 0}>
                <p>El chat te permite comunicarte con los administradores del acueducto.</p>
                <FakeCard>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-gray-800 dark:text-white">Conversacion con Admin</div>
                      <div className="text-[10px] text-gray-500">Ultimo mensaje: "Gracias por su..."</div>
                    </div>
                    <FakeBadge color="blue">2</FakeBadge>
                  </div>
                </FakeCard>
                <FakeButton small variant="ghost">➕ Nueva conversacion</FakeButton>
              </HelpItem>

              <HelpItem title="Enviar un mensaje">
                <p>Escribe y envia mensajes dentro de una conversacion.</p>
                <FakeCard>
                  <div className="space-y-2">
                    <div className="flex justify-end"><div className="bg-brand text-white text-[10px] px-3 py-1.5 rounded-xl rounded-br-sm max-w-[70%]">Hola, tengo una consulta</div></div>
                    <div className="flex justify-start"><div className="bg-gray-100 dark:bg-dark-muted text-gray-800 dark:text-gray-200 text-[10px] px-3 py-1.5 rounded-xl rounded-bl-sm max-w-[70%]">Buenos dias, en que puedo ayudarle?</div></div>
                  </div>
                </FakeCard>
                <div className="flex gap-2 mt-2">
                  <FakeInput placeholder="Escribe un mensaje..." />
                  <FakeButton small>📤</FakeButton>
                </div>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Escribe tu mensaje y toca el boton 📤 o presiona Enter</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Puedes editar un mensaje tocandolo</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 10. GESTION DE ASOCIADOS ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'asociados', 'crear asociado', 'editar asociado', 'archivar', 'estado', 'finanzas') && (
            <HelpSection icon={Users} title="Gestion de Asociados" roleBadge="Tesorero / Administrador">
              <HelpItem title="Ver lista de asociados" defaultOpen={search.length > 0}>
                <p>Administra todos los asociados del acueducto.</p>
                <FakeInput placeholder="Buscar por nombre, cedula o telefono..." />
                <FakeFilters items={['Todos', 'Activos', 'Suspendidos', 'Inactivos']} active={0} />
                <div className="space-y-2 mt-2">
                  <FakeListItem title="Juan Perez" subtitle="Ced: 1.234.567 - 310 123 4567" badge={{ label: 'Activo', color: 'green' }} />
                  <FakeListItem title="Maria Lopez" subtitle="Ced: 2.345.678 - 311 234 5678" badge={{ label: 'Suspendido', color: 'amber' }} />
                </div>
                <FakeButton>➕ Nuevo asociado</FakeButton>
              </HelpItem>

              <HelpItem title="Crear un nuevo asociado">
                <p>Registra un nuevo asociado en el sistema.</p>
                <FakeModal title="Nuevo asociado">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Numero de documento*</div><FakeInput value="1.234.567" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Tipo de documento*</div><FakeSelect value="Cedula de Ciudadania" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Nombres*</div><FakeInput value="Juan" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Apellidos*</div><FakeInput value="Perez" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Telefono</div><FakeInput value="310 123 4567" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Numero de medidor*</div><FakeSelect value="Seleccionar medidor" /></div>
                    <FakeButton>💾 Crear asociado</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>

              <HelpItem title="Cambiar estado de un asociado">
                <p>Activa, suspende o desactiva el servicio de un asociado.</p>
                <FakeModal title="Cambiar estado">
                  <div className="space-y-2">
                    <div className="text-[10px] text-gray-500">Asociado: Juan Perez</div>
                    <div className="text-[10px] text-gray-500">Estado actual: <FakeBadge color="green">Activo</FakeBadge></div>
                    <div className="space-y-1.5">
                      <FakeRadio label="🟢 Activo" checked />
                      <FakeRadio label="🟡 Suspendido" />
                      <FakeRadio label="🔴 Inactivo" />
                    </div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Motivo del cambio</div><FakeInput placeholder="Escribe el motivo..." /></div>
                    <FakeButton>💾 Guardar</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>

              <HelpItem title="Ver finanzas de un asociado">
                <p>Consulta el resumen economico de cualquier asociado.</p>
                <FakeModal title="Resumen financiero - Juan Perez">
                  <div className="grid grid-cols-2 gap-2">
                    <FakeKPI label="Total facturado" value="$250.000" />
                    <FakeKPI label="Total pagado" value="$125.000" />
                    <FakeKPI label="Pendiente" value="$125.000" />
                    <FakeKPI label="Multas" value="$15.000" />
                  </div>
                  <div className="flex gap-2">
                    <FakeButton small variant="ghost">📄 Ver facturas</FakeButton>
                    <FakeButton small variant="ghost">📄 Ver recibos</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 11. GESTION DE MEDIDORES ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'medidores', 'medidor', 'registrar medidor', 'estado medidor') && (
            <HelpSection icon={Gauge} title="Gestion de Medidores" roleBadge="Tesorero / Administrador">
              <HelpItem title="Ver lista de medidores" defaultOpen={search.length > 0}>
                <p>Administra el inventario de medidores de agua.</p>
                <FakeInput placeholder="Buscar por numero, ubicacion o asociado..." />
                <div className="space-y-2 mt-2">
                  <FakeMeter />
                  <FakeMeter />
                </div>
                <FakeButton>➕ Registrar medidor</FakeButton>
              </HelpItem>

              <HelpItem title="Registrar un nuevo medidor">
                <p>Agrega un nuevo medidor al inventario.</p>
                <FakeModal title="Registrar medidor">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Numero del medidor*</div><FakeInput value="M-002" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Ubicacion</div><FakeInput placeholder="Direccion del medidor" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Observaciones</div><FakeInput placeholder="Notas adicionales" /></div>
                    <FakeButton>💾 Registrar</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 12. LECTURAS ── */}
          {sectionVisible(['ADMINISTRADOR'], 'lecturas', 'lectura', 'consumo', 'medidor', 'calcular') && (
            <HelpSection icon={Droplet} title="Lecturas de Medidores" roleBadge="Administrador">
              <HelpItem title="Ver y registrar lecturas" defaultOpen={search.length > 0}>
                <p>Registra las lecturas mensuales de consumo de agua de cada medidor.</p>
                <FakeTabs tabs={['2026', '2025']} active={0} />
                <div className="flex gap-1 mt-2 flex-wrap">
                  {['Ene','Feb','Mar','Abr','May','Jun'].map((m,i) => (
                    <span key={i} className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${i===0 ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-dark-muted text-gray-600 dark:text-gray-400'}`}>{m}</span>
                  ))}
                </div>
                <div className="space-y-1.5 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                  <div>Periodo: Enero 2026</div>
                  <div>45 lecturas registradas - Consumo total: 540 m³</div>
                </div>
                <div className="space-y-2 mt-2">
                  <FakeListItem title="Juan Perez - M-001" subtitle="Anterior: 100 → Actual: 112 | Consumo: 12 m³" />
                  <FakeListItem title="Maria Lopez - M-002" subtitle="Anterior: 200 → Actual: 215 | Consumo: 15 m³" />
                </div>
                <FakeButton>➕ Registrar lectura</FakeButton>
              </HelpItem>

              <HelpItem title="Registrar una nueva lectura">
                <p>Agrega la lectura mensual de un medidor.</p>
                <FakeModal title="Registrar lectura">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Buscar medidor*</div><FakeInput placeholder="Numero o nombre..." value="M-001 - Juan Perez" /></div>
                    <div className="text-[10px] text-gray-500">Lectura anterior: <span className="font-bold text-gray-800 dark:text-white">100 m³</span></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Lectura actual*</div><FakeInput value="112" /></div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">💧 Consumo calculado: 12 m³</div>
                    <FakeButton>💾 Registrar</FakeButton>
                  </div>
                </FakeModal>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Busca el medidor por numero o nombre</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>La lectura anterior se carga automaticamente</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Escribe la lectura actual y el consumo se calcula solo</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Calculadora de consumo">
                <p>Herramienta para calcular el consumo y valor a pagar.</p>
                <FakeModal title="Calculadora de consumo">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Lectura anterior</div><FakeInput value="100" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Lectura actual</div><FakeInput value="112" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <FakeKPI label="Consumo" value="12 m³" />
                      <FakeKPI label="Valor" value="$42.000" />
                    </div>
                  </div>
                </FakeModal>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 13. FACTURACION ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'facturacion', 'factura', 'generar factura', 'anular', 'concepto', 'notificar factura') && (
            <HelpSection icon={FileText} title="Facturacion" roleBadge="Tesorero / Administrador">
              <HelpItem title="Ver facturas" defaultOpen={search.length > 0}>
                <p>Consulta y gestiona todas las facturas del acueducto.</p>
                <FakeTabs tabs={['Por estado', 'Historial', 'Por asociado']} active={0} />
                <FakeFilters items={['Todas', 'Pendientes', 'Pagadas', 'Vencidas']} active={0} />
                <div className="space-y-2 mt-2">
                  <FakeInvoice />
                </div>
                <FakeButton>➕ Generar facturacion del mes</FakeButton>
              </HelpItem>

              <HelpItem title="Generar facturacion del mes">
                <p>Crea facturas masivas para todos los asociados con lectura registrada.</p>
                <FakeModal title="Generar facturacion">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Ano</div><FakeSelect value="2026" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Mes</div><FakeSelect value="Enero" /></div>
                    <FakeCard>
                      <div className="text-[10px] font-bold text-gray-800 dark:text-white mb-1">📊 Resumen</div>
                      <div className="space-y-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                        <div>• Asociados activos: 120</div>
                        <div>• Ya facturados: 0</div>
                        <div>• Por facturar: 120</div>
                      </div>
                    </FakeCard>
                    <div className="flex gap-2">
                      <FakeButton variant="secondary">Cancelar</FakeButton>
                      <FakeButton>📄 Generar</FakeButton>
                    </div>
                  </div>
                </FakeModal>
              </HelpItem>

              <HelpItem title="Notificar a un asociado">
                <p>Envia una notificacion por WhatsApp o correo sobre una factura.</p>
                <FakeModal title="Enviar notificacion">
                  <div className="space-y-2">
                    <div className="text-[10px] text-gray-500">Para: Juan Perez | Factura: FAC-000123</div>
                    <div className="space-y-1">
                      <FakeRadio label="WhatsApp" checked />
                      <FakeRadio label="Correo electronico" />
                    </div>
                    <FakeTextarea placeholder="Mensaje personalizado..." />
                    <FakeButton>📤 Enviar</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>

              <HelpItem title="Anular una factura">
                <p>Anula una factura que fue generada por error.</p>
                <FakeModal title="Anular factura">
                  <div className="space-y-2">
                    <div className="text-[10px] text-red-600 dark:text-red-400 font-bold">⚠️ Esta accion no se puede deshacer.</div>
                    <div className="text-[10px] text-gray-500">Factura: FAC-000123</div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Motivo de anulacion*</div><FakeInput placeholder="Escribe el motivo..." /></div>
                    <div className="flex gap-2">
                      <FakeButton variant="secondary">Cancelar</FakeButton>
                      <FakeButton variant="danger">Anular</FakeButton>
                    </div>
                  </div>
                </FakeModal>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 14. TESORERIA ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'tesoreria', 'pagos', 'ingresos', 'gastos', 'multas', 'caja', 'movimientos') && (
            <HelpSection icon={Wallet} title="Tesoreria" roleBadge="Tesorero / Administrador">
              <HelpItem title="Panel de tesoreria" defaultOpen={search.length > 0}>
                <p>Panel principal con KPIs del dia y acciones rapidas.</p>
                <div className="grid grid-cols-2 gap-2">
                  <FakeKPI label="Ingresos" value="$350.000" />
                  <FakeKPI label="Gastos" value="$85.000" />
                  <FakeKPI label="Balance" value="$265.000" />
                  <FakeKPI label="Movimientos" value="12" />
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {['💰 Pago', '📥 Ingreso', '📤 Gasto', '⚠️ Multa'].map((a,i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-dark-muted rounded-xl p-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 pointer-events-none select-none">{a}</div>
                  ))}
                </div>
              </HelpItem>

              <HelpItem title="Registrar un pago">
                <p>Registra el pago de un asociado contra una factura.</p>
                <FakeModal title="Registrar pago">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Buscar factura*</div><FakeInput placeholder="Numero de factura..." value="FAC-000123" /></div>
                    <FakeCard>
                      <div className="text-[10px] text-gray-500">👤 Juan Perez | 💵 Total: $45.000 | ⏳ Pendiente: $45.000</div>
                    </FakeCard>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Valor a pagar*</div><FakeInput value="45000" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Metodo de pago*</div><FakeSelect value="Efectivo" /></div>
                    <FakeButton>💰 Registrar pago</FakeButton>
                  </div>
                </FakeModal>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Busca la factura por numero</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Escribe el valor a pagar (puede ser parcial)</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Se genera automaticamente un recibo</span></li>
                </ul>
              </HelpItem>

              <HelpItem title="Registrar ingreso o gasto">
                <p>Registra movimientos que no estan vinculados a facturas.</p>
                <div className="space-y-2">
                  <FakeModal title="Registrar ingreso">
                    <div className="space-y-2">
                      <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Descripcion*</div><FakeInput value="Donacion empresa XYZ" /></div>
                      <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Valor*</div><FakeInput value="500000" /></div>
                      <FakeButton>📥 Registrar</FakeButton>
                    </div>
                  </FakeModal>
                  <FakeModal title="Registrar gasto">
                    <div className="space-y-2">
                      <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Descripcion*</div><FakeInput value="Reparo de tuberia" /></div>
                      <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Valor*</div><FakeInput value="150000" /></div>
                      <FakeButton>📤 Registrar</FakeButton>
                    </div>
                  </FakeModal>
                </div>
              </HelpItem>

              <HelpItem title="Registrar una multa">
                <p>Aplica una multa o penalizacion a un asociado.</p>
                <FakeModal title="Registrar multa">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Buscar asociado*</div><FakeInput placeholder="Nombre o cedula..." value="Juan Perez" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Motivo*</div><FakeInput value="Dano a medidor comunitario" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Valor*</div><FakeInput value="25000" /></div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">¿Es independiente?</div>
                      <FakeRadio label="Si (se paga por separado)" checked />
                      <FakeRadio label="No (se incluye en factura)" />
                    </div>
                    <FakeButton>⚠️ Registrar</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>

              <HelpItem title="Ver caja del dia">
                <p>Consulta el resumen de ingresos y gastos del dia.</p>
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-gray-800 dark:text-white">📊 Caja del dia - 15/02/2026</div>
                  <div className="grid grid-cols-3 gap-2">
                    <FakeKPI label="Ingresos" value="$85.000" />
                    <FakeKPI label="Gastos" value="$25.000" />
                    <FakeKPI label="Balance" value="$60.000" />
                  </div>
                  <div className="space-y-1.5">
                    <FakeMovement type="income" desc="Pago FAC-000123" amount="$45.000" method="Efectivo" />
                    <FakeMovement type="income" desc="Pago FAC-000124" amount="$40.000" method="Transferencia" />
                    <FakeMovement type="expense" desc="Reparo tuberia" amount="$25.000" method="Efectivo" />
                  </div>
                </div>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 15. CONFIGURACION ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'configuracion', 'configurar', 'tarifas', 'metodos de pago', 'archivos', 'hero') && (
            <HelpSection icon={Settings} title="Configuracion" roleBadge="Tesorero / Administrador">
              <HelpItem title="Panel de configuracion" defaultOpen={search.length > 0}>
                <p>Administra la configuracion general del sistema.</p>
                <FakeTabs tabs={['General', 'Hero', 'Pagos', 'Archivos']} active={0} />
                <div className="space-y-2 mt-2">
                  <FakeAction icon={Settings} label="General y tarifas" description="Datos institucionales y tarifa por m³" />
                  <FakeAction icon={Home} label="Hero de inicio" description="Banner de la pantalla principal" />
                  <FakeAction icon={Wallet} label="Metodos de pago" description="Efectivo, transferencia, etc." />
                  <FakeAction icon={FileText} label="Archivos institucionales" description="Logo, firma, sello" />
                </div>
              </HelpItem>

              <HelpItem title="Configurar datos generales">
                <p>Edita los datos institucionales y la tarifa del servicio.</p>
                <FakeModal title="Configuracion general">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Nombre del acueducto</div><FakeInput value="Acueducto Los Guaduales" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">NIT</div><FakeInput value="900.123.456-7" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Tarifa por m³</div><FakeInput value="3500" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Dias de plazo de pago</div><FakeInput value="30" /></div>
                    <FakeButton>💾 Guardar configuracion</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>

              <HelpItem title="Gestionar metodos de pago">
                <p>Activa o desactiva los metodos de pago aceptados.</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-dark-muted pointer-events-none select-none">
                    <span className="text-[10px] font-semibold text-gray-800 dark:text-white">💵 Efectivo</span>
                    <FakeToggle checked />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-dark-muted pointer-events-none select-none">
                    <span className="text-[10px] font-semibold text-gray-800 dark:text-white">🏦 Transferencia</span>
                    <FakeToggle checked />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-dark-muted pointer-events-none select-none">
                    <span className="text-[10px] font-semibold text-gray-800 dark:text-white">📱 Datafono</span>
                    <FakeToggle checked={false} />
                  </div>
                </div>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 16. PERIODOS CONTABLES ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'periodos', 'contable', 'mes', 'ano', 'cerrar', 'reabrir') && (
            <HelpSection icon={CalendarRange} title="Periodos Contables" roleBadge="Tesorero / Administrador">
              <HelpItem title="Gestion de periodos" defaultOpen={search.length > 0}>
                <p>Administra los anos y meses contables del acueducto.</p>
                <div className="flex gap-2 mb-2">
                  <FakeButton small>📅 2026</FakeButton>
                  <FakeButton small variant="secondary">📅 2025</FakeButton>
                </div>
                <FakeButton small>➕ Nuevo ano contable</FakeButton>
                <div className="space-y-2 mt-2">
                  <FakeListItem title="Enero 2026" subtitle="120 facturas generadas" badge={{ label: 'ABIERTO', color: 'green' }} />
                  <FakeListItem title="Diciembre 2025" subtitle="118 facturas generadas" badge={{ label: 'CERRADO', color: 'gray' }} />
                </div>
                <FakeButton>➕ Aperturar mes</FakeButton>
              </HelpItem>

              <HelpItem title="Cerrar un mes">
                <p>Cierra el periodo para que no se admitan mas operaciones.</p>
                <FakeModal title="Enero 2026">
                  <div className="space-y-2">
                    <FakeProgress value={71} label="Eficiencia de recaudo" />
                    <div className="grid grid-cols-2 gap-2">
                      <FakeKPI label="Facturado" value="$4.200.000" />
                      <FakeKPI label="Recaudado" value="$3.000.000" />
                    </div>
                    <div className="flex gap-2">
                      <FakeButton small variant="danger">🔒 Cerrar mes</FakeButton>
                      <FakeButton small variant="secondary">Reabrir mes</FakeButton>
                    </div>
                  </div>
                </FakeModal>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Verifica que toda la facturacion este generada</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Verifica que todos los pagos esten registrados</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Cerrar mes" y confirma</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 17. ESTADISTICAS ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'estadisticas', 'panel', 'control', 'kpi', 'metricas') && (
            <HelpSection icon={LayoutDashboard} title="Panel de Estadisticas" roleBadge="Tesorero / Administrador">
              <HelpItem title="Ver estadisticas" defaultOpen={search.length > 0}>
                <p>Consulta las metricas clave del acueducto en tiempo real.</p>
                <div className="grid grid-cols-2 gap-2">
                  <FakeKPI label="Asociados" value="125" />
                  <FakeKPI label="Balance" value="$265.000" />
                  <FakeKPI label="Cartera" value="$1.250.000" />
                  <FakeKPI label="Recaudo" value="71%" />
                </div>
                <div className="mt-2 space-y-2">
                  <FakeProgress value={71} label="Pagadas: 85 (71%)" color="bg-emerald-500" />
                  <FakeProgress value={25} label="Pendientes: 30 (25%)" color="bg-amber-500" />
                  <FakeProgress value={4} label="Vencidas: 5 (4%)" color="bg-red-500" />
                </div>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Actualizar" para refrescar los datos</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Las barras de progreso indican el porcentaje</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 18. AUDITORIA ── */}
          {sectionVisible(['ADMINISTRADOR'], 'auditoria', 'registro', 'historial', 'actividades') && (
            <HelpSection icon={History} title="Auditoria del Sistema" roleBadge="Administrador">
              <HelpItem title="Ver registro de auditoria" defaultOpen={search.length > 0}>
                <p>Consulta el historial de todas las acciones realizadas en el sistema.</p>
                <div className="flex items-center gap-2 mb-2">
                  <FakeBadge color="green">Activa</FakeBadge>
                  <FakeButton small variant="secondary">Desactivar</FakeButton>
                </div>
                <FakeInput placeholder="Filtrar por modulo..." />
                <div className="space-y-2 mt-2">
                  <FakeListItem title="admin - CREAR" subtitle="ASOCIADOS - Registro de Juan Perez" badge={{ label: 'CREAR', color: 'green' }} />
                  <FakeListItem title="tesorero1 - EDITAR" subtitle="FACTURACION - Edicion FAC-000123" badge={{ label: 'EDITAR', color: 'amber' }} />
                  <FakeListItem title="admin - ANULAR" subtitle="TESORERIA - Anulacion ENT-000015" badge={{ label: 'ANULAR', color: 'red' }} />
                </div>
              </HelpItem>

              <HelpItem title="Activar o desactivar auditoria">
                <p>Controla si el sistema registra las acciones de los usuarios.</p>
                <FakeModal title="Desactivar auditoria">
                  <div className="space-y-2">
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">Si desactivas la auditoria, no se registraran mas cambios.</div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Confirma con tu contrasena:</div><FakeInput placeholder="••••••••" /></div>
                    <FakeButton variant="danger">Desactivar</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 19. CREAR NOTIFICACIONES ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'notificacion', 'crear notificacion', 'enviar notificacion', 'aviso') && (
            <HelpSection icon={BellPlus} title="Crear Notificaciones" roleBadge="Tesorero / Administrador">
              <HelpItem title="Crear una notificacion" defaultOpen={search.length > 0}>
                <p>Envia avisos y notificaciones a los asociados o a todo el acueducto.</p>
                <FakeModal title="Crear notificacion">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Titulo*</div><FakeInput value="Aviso importante" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Descripcion corta*</div><FakeInput value="Corte del servicio el lunes" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Tipo</div><FakeSelect value="Publica" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Prioridad</div><FakeSelect value="Normal" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Contenido completo*</div><FakeTextarea placeholder="Escribe el contenido detallado..." /></div>
                    <FakeButton>📤 Crear y publicar</FakeButton>
                  </div>
                </FakeModal>
                <ul className="space-y-1.5 mt-2">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Publica: todos la ven | Asociado: solo un usuario | Administrativa: solo admin</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Activa "Enviar notificacion push" para notificar por sistema</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 20. INFORMES ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'informes', 'reporte', 'informe mensual', 'informe anual', 'informe asociado', 'listado') && (
            <HelpSection icon={FileBarChart} title="Informes y Reportes" roleBadge="Tesorero / Administrador">
              <HelpItem title="Generar un informe" defaultOpen={search.length > 0}>
                <p>Crea reportes detallados del acueducto para diferentes periodos.</p>
                <FakeTabs tabs={['Mensual', 'Anual', 'Asociado', 'Listado']} active={0} />
                <div className="space-y-2 mt-2">
                  <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Ano</div><FakeSelect value="2026" /></div>
                  <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Mes</div><FakeSelect value="Enero" /></div>
                  <FakeButton>📄 Generar informe</FakeButton>
                </div>
              </HelpItem>

              <HelpItem title="Informe por asociado">
                <p>Genera un reporte detallado de un asociado especifico.</p>
                <FakeTabs tabs={['Mensual', 'Anual', 'Asociado', 'Listado']} active={2} />
                <FakeInput placeholder="Buscar asociado..." value="Juan Perez" />
                <FakeButton>📄 Generar informe</FakeButton>
                <Arrow direction="down" label="Resultado" />
                <FakeCard>
                  <div className="text-[10px] font-bold text-gray-800 dark:text-white">📊 Informe de Juan Perez</div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <FakeKPI label="Facturado" value="$250.000" />
                    <FakeKPI label="Pagado" value="$125.000" />
                  </div>
                  <FakeButton small>📄 Descargar PDF</FakeButton>
                </FakeCard>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 21. ENCUESTAS (ADMIN) ── */}
          {sectionVisible(['TESORERO', 'ADMINISTRADOR'], 'encuestas admin', 'crear encuesta', 'estadisticas encuesta', 'preguntas') && (
            <HelpSection icon={ClipboardList} title="Gestion de Encuestas" roleBadge="Tesorero / Administrador">
              <HelpItem title="Crear una encuesta" defaultOpen={search.length > 0}>
                <p>Crea formularios y encuestas para recopilar opiniones de los asociados.</p>
                <FakeModal title="Crear encuesta">
                  <div className="space-y-2">
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Titulo*</div><FakeInput value="Encuesta de satisfaccion" /></div>
                    <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Descripcion</div><FakeTextarea placeholder="Cuentanos que opinas..." /></div>
                    <div>
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Pregunta 1*</div>
                      <FakeInput value="¿Como calificarias el servicio?" />
                      <FakeSelect value="Opcion multiple" />
                    </div>
                    <FakeButton small variant="ghost">➕ Agregar pregunta</FakeButton>
                    <FakeButton>📋 Crear</FakeButton>
                  </div>
                </FakeModal>
              </HelpItem>

              <HelpItem title="Ver estadisticas de una encuesta">
                <p>Consulta las respuestas y metricas de una encuesta.</p>
                <FakeCard>
                  <div className="text-[10px] font-bold text-gray-800 dark:text-white">📊 Estadisticas - Encuesta de satisfaccion</div>
                  <div className="text-[10px] text-gray-500">Total de respuestas: 15</div>
                  <div className="space-y-1.5 mt-1">
                    <FakeProgress value={53} label="Excelente: 8 (53%)" color="bg-emerald-500" />
                    <FakeProgress value={27} label="Bueno: 4 (27%)" color="bg-brand" />
                    <FakeProgress value={13} label="Regular: 2 (13%)" color="bg-amber-500" />
                    <FakeProgress value={7} label="Malo: 1 (7%)" color="bg-red-500" />
                  </div>
                </FakeCard>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 22. DATOS IMPORTANTES ── */}
          {sectionVisible(['ADMINISTRADOR'], 'datos importantes', 'eliminar', 'borrar', 'peligro') && (
            <HelpSection icon={Trash2} title="Datos Importantes" roleBadge="Administrador">
              <HelpItem title="Eliminar datos del sistema" defaultOpen={search.length > 0}>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-2">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-[10px] font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>ZONA DE PELIGRO - Las acciones aqui son IRREVERSIBLES</span>
                  </div>
                </div>
                <p>Esta funcion permite eliminar registros permanentemente del sistema. Solo para administradores expertos.</p>
                <div className="space-y-2 mt-2">
                  <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Tipo de dato a eliminar</div><FakeSelect value="Facturas" /></div>
                  <FakeInput placeholder="Buscar registro..." />
                  <FakeListItem title="FAC-000123" subtitle="Juan Perez - $45.000" badge={{ label: 'Seleccionar', color: 'red' }} />
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2 text-[10px] text-amber-700 dark:text-amber-400">
                    ⚠️ Registros afectados: Factura (1), Pagos (2), Recibos (2)
                  </div>
                  <div><div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Contrasena para confirmar</div><FakeInput placeholder="••••••••" /></div>
                  <FakeButton variant="danger">🗑️ Eliminar permanentemente</FakeButton>
                </div>
              </HelpItem>
            </HelpSection>
          )}

          {/* ── 23. COMPARTIR APP ── */}
          {sectionVisible(['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'], 'compartir', 'qr', 'whatsapp', 'enlace', 'link') && (
            <HelpSection icon={Share2} title="Compartir la App" roleBadge="Todos">
              <HelpItem title="Compartir con otros" defaultOpen={search.length > 0}>
                <p>Comparte la aplicacion con otros asociados o personas de la comunidad.</p>
                <div className="text-center space-y-3">
                  <div className="w-28 h-28 mx-auto rounded-xl bg-gray-100 dark:bg-dark-muted flex items-center justify-center text-4xl border-2 border-dashed border-gray-300 dark:border-dark-muted pointer-events-none select-none">
                    ▣
                  </div>
                  <FakeButton small variant="secondary">📥 Descargar codigo QR</FakeButton>
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">Enlace directo:</div>
                    <FakeInput value="https://acueducto-los-guaduales.pages.dev" />
                  </div>
                  <FakeButton small>📱 Compartir por WhatsApp</FakeButton>
                </div>
                <ul className="space-y-1.5 mt-3">
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Descargar codigo QR" para guardar la imagen</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Copia el enlace para compartir por cualquier medio</span></li>
                  <li className="flex items-start gap-2"><Arrow direction="right" /> <span>Toca "Compartir por WhatsApp" para enviar por mensaje</span></li>
                </ul>
              </HelpItem>
            </HelpSection>
          )}

          {search && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No se encontraron resultados para "{search}"</p>
              <button onClick={() => setSearch('')} className="text-xs text-brand mt-2">Limpiar busqueda</button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
