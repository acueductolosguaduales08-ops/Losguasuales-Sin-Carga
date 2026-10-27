import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarRange, RefreshCw, Loader2, Droplet, FileText, Wallet, TrendingUp,
  TrendingDown, PlusCircle, AlertTriangle, CalendarDays, Users, Gauge,
  FileBarChart, BarChart3, Settings, BellPlus, History, Trash2, Scale,
  MessageCircle, Share2, ClipboardList, MessageSquareWarning, Receipt,
  CreditCard, GitCompareArrows, HandCoins, Newspaper, ShieldAlert, LayoutDashboard,
} from 'lucide-react';
import Header from '../components/layout/Header';
import PageHeader from '../components/ui/PageHeader';
import EstadoBadge from '../components/ui/EstadoBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PanelAPI } from '../api/panel';
import AnioFormModal from '../components/periodos/AnioFormModal';
import MesFormModal from '../components/periodos/MesFormModal';
import LecturaFormModal from '../components/lecturas/LecturaFormModal';
import GenerarFacturacionModal from '../components/facturas/GenerarFacturacionModal';
import RegistrarPagoModal from '../components/tesoreria/RegistrarPagoModal';
import RegistrarMovimientoModal from '../components/tesoreria/RegistrarMovimientoModal';
import RegistrarMultaModal from '../components/tesoreria/RegistrarMultaModal';
import InformeMesModal from '../components/informes/InformeMesModal';

// Centro de operaciones de ADMIN/TESORERO.
//
// No mezcla listas de facturas, multas, recibos ni movimientos: la
// pantalla muestra el estado compacto del período, las acciones
// rápidas del ciclo y los módulos agrupados por las 9 áreas del
// sistema. Al seleccionar un módulo se abre su pantalla, donde toda
// la información de esa área está organizada.

function grupoDeModulos(esAdmin, handlers) {
  const { navegar, abrir } = handlers;
  return [
    {
      key: 'asociados',
      titulo: 'Asociados',
      icon: Users,
      items: [
        { key: 'directorio', name: 'Directorio', sub: 'Perfiles y estados de cuenta', icon: Users, onClick: () => navegar('/asociados') },
        { key: 'medidores', name: 'Medidores', sub: 'Alta y consulta', icon: Gauge, onClick: () => navegar('/medidores') },
        ...(esAdmin
          ? [{ key: 'lecturas', name: 'Lecturas y consumo', sub: 'Registro mensual', icon: Droplet, onClick: () => navegar('/lecturas') }]
          : []),
      ],
    },
    {
      key: 'facturacion',
      titulo: 'Facturación',
      icon: FileText,
      items: [
        { key: 'facturas', name: 'Facturas', sub: 'Consultar y anular', icon: FileText, onClick: () => navegar('/facturacion') },
        ...(esAdmin
          ? [{ key: 'genfact', name: 'Generar facturas', sub: 'Del mes abierto', icon: FileText, onClick: () => abrir('genfact') }]
          : []),
        { key: 'cartera', name: 'Deudas y cartera', sub: 'Vencidas y aging', icon: AlertTriangle, onClick: () => navegar('/deudas-cartera') },
        { key: 'notas', name: 'Notas de crédito', sub: 'Descuentos y ajustes', icon: CreditCard, onClick: () => navegar('/notas-credito') },
      ],
    },
    {
      key: 'pagos',
      titulo: 'Pagos y recibos',
      icon: HandCoins,
      items: [
        { key: 'cobrar', name: 'Registrar pago', sub: 'Cobro de facturas y multas', icon: HandCoins, onClick: () => abrir('pago') },
        { key: 'recibos', name: 'Recibos', sub: 'Consulta e impresión', icon: Receipt, onClick: () => navegar('/recibos') },
      ],
    },
    {
      key: 'tesoreria',
      titulo: 'Tesorería',
      icon: Wallet,
      items: [
        { key: 'movimientos', name: 'Entradas y salidas', sub: 'Caja y movimientos', icon: Wallet, onClick: () => navegar('/tesoreria') },
        { key: 'ingreso', name: 'Registrar ingreso', sub: 'Entrada manual', icon: TrendingUp, onClick: () => abrir('ingreso') },
        { key: 'salida', name: 'Registrar salida', sub: 'Egreso manual', icon: TrendingDown, onClick: () => abrir('salida') },
        { key: 'conciliacion', name: 'Conciliación bancaria', sub: 'Extractos y bancos', icon: GitCompareArrows, onClick: () => navegar('/conciliacion') },
      ],
    },
    {
      key: 'multas',
      titulo: 'Multas',
      icon: Scale,
      items: [
        { key: 'multas-lista', name: 'Multas', sub: 'Pendientes y pagadas', icon: Scale, onClick: () => navegar('/multas') },
        { key: 'registrar-multa', name: 'Registrar multa', sub: 'Imponer nueva multa', icon: ShieldAlert, onClick: () => abrir('multa') },
      ],
    },
    {
      key: 'periodos',
      titulo: 'Períodos contables',
      icon: CalendarRange,
      items: [
        { key: 'periodos', name: 'Años y meses', sub: 'Apertura, cierre e informes', icon: CalendarRange, onClick: () => navegar('/periodos-contables') },
        { key: 'informe', name: 'Informe del mes', sub: 'Resumen publicable', icon: FileBarChart, onClick: () => abrir('informe') },
        {
          key: 'nuevo-periodo',
          name: 'Aperturar período',
          sub: 'Crear año o mes contable',
          icon: CalendarDays,
          onClick: () => abrir('periodo'),
        },
      ],
    },
    {
      key: 'informes',
      titulo: 'Informes',
      icon: BarChart3,
      items: [
        { key: 'informes', name: 'Informes', sub: 'Mensual, anual y por asociado', icon: FileBarChart, onClick: () => navegar('/informes') },
        { key: 'estadisticas', name: 'Panel de control', sub: 'Estadísticas del sistema', icon: BarChart3, onClick: () => navegar('/estadisticas') },
      ],
    },
    {
      key: 'comunidad',
      titulo: 'Comunidad',
      icon: Newspaper,
      items: [
        { key: 'comunidad', name: 'Comunidad', sub: 'Noticias y novedades', icon: Newspaper, onClick: () => navegar('/comunidad') },
        { key: 'encuestas', name: 'Encuestas', sub: 'Crear y consultar', icon: ClipboardList, onClick: () => navegar('/encuestas') },
        { key: 'reportes', name: 'Reportes comunitarios', sub: 'Fugas y reclamos', icon: MessageSquareWarning, onClick: () => navegar('/reportes-comunidad') },
        { key: 'chat', name: 'Chat', sub: 'Conversaciones', icon: MessageCircle, onClick: () => navegar('/chat') },
        { key: 'compartir', name: 'Compartir app', sub: 'QR y enlaces', icon: Share2, onClick: () => navegar('/compartir') },
      ],
    },
    {
      key: 'administracion',
      titulo: 'Administración',
      icon: Settings,
      items: [
        { key: 'notificar', name: 'Crear notificación', sub: 'Aviso a asociados', icon: BellPlus, onClick: () => navegar('/notificaciones/crear') },
        { key: 'config', name: 'Configuración', sub: 'Tarifas y datos institucionales', icon: Settings, onClick: () => navegar('/configuracion') },
        ...(esAdmin
          ? [
              { key: 'auditoria', name: 'Auditoría', sub: 'Historial de acciones', icon: History, onClick: () => navegar('/auditoria') },
              { key: 'datos', name: 'Datos importantes', sub: 'Mantenimiento', icon: Trash2, onClick: () => navegar('/datos-importantes') },
            ]
          : []),
      ],
    },
  ];
}

export default function Panel() {
  const navigate = useNavigate();
  const { rol } = useAuth();
  const { error } = useToast();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [anioModal, setAnioModal] = useState(false);
  const [mesModal, setMesModal] = useState(false);
  const [lecturaModal, setLecturaModal] = useState(false);
  const [genFactModal, setGenFactModal] = useState(false);
  const [pagoModal, setPagoModal] = useState(false);
  const [movModal, setMovModal] = useState(null); // 'ingreso' | 'salida' | null
  const [multaModal, setMultaModal] = useState(false);
  const [informeModal, setInformeModal] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setDatos(await PanelAPI.cargar());
    } catch (err) {
      error('Error al cargar el panel.', err.message || 'Verifica tu conexión.');
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [error]);

  useEffect(() => { cargar(); }, [cargar]);

  const refrescar = () => { cargar(); };

  const resumen = datos?.resumen;
  const mes = datos?.mesAbierto;
  const esAdmin = rol === 'ADMINISTRADOR';

  const lecturasHechas = mes && datos?.medidoresActivos != null && datos?.lecturasPendientes != null
    ? Math.max(0, datos.medidoresActivos - datos.lecturasPendientes)
    : null;
  const cobroPct = resumen?.facturasGeneradas
    ? Math.round((resumen.facturasPagadas / resumen.facturasGeneradas) * 100)
    : 0;

  const abrir = (clave) => {
    if (clave === 'genfact') setGenFactModal(true);
    else if (clave === 'pago') setPagoModal(true);
    else if (clave === 'ingreso') setMovModal('ingreso');
    else if (clave === 'salida') setMovModal('salida');
    else if (clave === 'multa') setMultaModal(true);
    else if (clave === 'informe') setInformeModal(true);
    else if (clave === 'periodo') {
      if (datos?.anios?.length) setMesModal(true);
      else setAnioModal(true);
    }
  };

  const grupos = grupoDeModulos(esAdmin, { navegar: navigate, abrir });

  // Acciones rápidas del ciclo: botones contextuales, no listas de datos.
  const acciones = [];
  if (mes) {
    acciones.push({ key: 'lectura', label: 'Nueva lectura', icon: Droplet, onClick: () => setLecturaModal(true), primary: true });
    if (esAdmin) acciones.push({ key: 'genfact', label: 'Generar facturas', icon: FileText, onClick: () => setGenFactModal(true), primary: true });
  }
  acciones.push({ key: 'pago', label: 'Cobrar', icon: Wallet, onClick: () => setPagoModal(true), primary: true });
  acciones.push({ key: 'ingreso', label: 'Ingreso', icon: TrendingUp, onClick: () => setMovModal('ingreso') });
  acciones.push({ key: 'salida', label: 'Salida', icon: TrendingDown, onClick: () => setMovModal('salida') });
  acciones.push({ key: 'multa', label: 'Multa', icon: AlertTriangle, onClick: () => setMultaModal(true) });
  if (!mes) acciones.push({ key: 'mes', label: 'Crear mes', icon: CalendarDays, onClick: () => (datos?.anios?.length ? setMesModal(true) : setAnioModal(true)), primary: true });

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex items-center justify-center pt-40 text-gray-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
          <span className="text-sm">Cargando centro de operaciones…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <PageHeader
          icon={LayoutDashboard}
          title="Centro de operaciones"
          subtitle={mes ? `Período activo: ${mes.nombreMes} ${mes.anio}` : 'Sin mes contable abierto'}
          actions={
            <button
              onClick={refrescar}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-dark-muted rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Actualizar
            </button>
          }
        />

        {/* Estado del período + acciones rápidas (botones, no listas) */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-4 sm:p-5 mb-5">
          {mes ? (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarDays className="w-5 h-5 text-brand shrink-0" aria-hidden="true" />
                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                    {mes.nombreMes} {mes.anio}
                  </p>
                  <EstadoBadge estado={mes.estado} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {resumen ? `${resumen.facturasGeneradas} facturas · ${cobroPct}% cobrado` : 'Cargando resumen…'}
                  {lecturasHechas != null && ` · lecturas ${lecturasHechas}/${datos.medidoresActivos}`}
                  {resumen ? ` · ${resumen.asociadosActivos} asociados activos` : ''}
                </p>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar">
                {acciones.map((a) => (
                  <button
                    key={a.key}
                    onClick={a.onClick}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      a.primary
                        ? 'bg-brand hover:bg-brand-dark text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-dark-muted dark:hover:bg-dark-muted/80 dark:text-gray-200'
                    }`}
                  >
                    <a.icon className="w-4 h-4" aria-hidden="true" />
                    {a.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-6 px-4">
              <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" aria-hidden="true" />
              <h2 className="text-base font-bold text-gray-800 dark:text-white mb-1">No hay mes contable abierto</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                Para registrar lecturas, facturas y movimientos primero se crea un mes contable (por ejemplo Octubre 2026).
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => (datos?.anios?.length ? setMesModal(true) : setAnioModal(true))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" aria-hidden="true" />
                  Crear {datos?.anios?.length ? 'mes' : 'año y mes'}
                </button>
                {acciones
                  .filter((a) => a.key !== 'mes')
                  .map((a) => (
                    <button
                      key={a.key}
                      onClick={a.onClick}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-dark-muted dark:hover:bg-dark-muted/80 dark:text-gray-200 transition-colors cursor-pointer"
                    >
                      <a.icon className="w-4 h-4" aria-hidden="true" />
                      {a.label}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* Módulos agrupados por área */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {grupos.map((g) => (
            <section
              key={g.key}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-4"
            >
              <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <g.icon className="w-4 h-4 text-brand" aria-hidden="true" />
                {g.titulo}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {g.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    className="group flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50/60 dark:bg-gray-950/60 hover:border-brand hover:bg-brand/5 dark:hover:bg-brand/10 transition-colors text-left cursor-pointer min-h-[3.5rem]"
                  >
                    <span className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                      <item.icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-800 dark:text-white truncate">{item.name}</span>
                      {item.sub && (
                        <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">{item.sub}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* ---------- Modales ---------- */}
      <AnioFormModal
        open={anioModal}
        onClose={() => setAnioModal(false)}
        onCreated={() => { setAnioModal(false); setMesModal(true); refrescar(); }}
      />
      <MesFormModal
        open={mesModal}
        anio={datos?.anios?.[0] || null}
        mesesRegistrados={datos?.meses || []}
        onClose={() => setMesModal(false)}
        onCreated={() => { setMesModal(false); refrescar(); }}
      />
      <LecturaFormModal
        open={lecturaModal}
        mesContableId={mes?.id || null}
        mesLabel={mes ? `${mes.nombreMes} ${mes.anio}` : null}
        onClose={() => setLecturaModal(false)}
        onSaved={refrescar}
      />
      <GenerarFacturacionModal
        open={genFactModal}
        anioIdInicial={mes?.anioId || null}
        mesIdInicial={mes?.id || null}
        onClose={() => setGenFactModal(false)}
        onGenerado={refrescar}
      />
      <RegistrarPagoModal
        open={pagoModal}
        onClose={() => setPagoModal(false)}
        onSaved={refrescar}
      />
      <RegistrarMovimientoModal
        open={!!movModal}
        tipo={movModal || 'ingreso'}
        onClose={() => setMovModal(null)}
        onSaved={refrescar}
      />
      <RegistrarMultaModal
        open={multaModal}
        onClose={() => setMultaModal(false)}
        onSaved={refrescar}
      />
      <InformeMesModal
        open={informeModal}
        mes={mes}
        onClose={() => setInformeModal(false)}
      />
    </div>
  );
}
