import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, Plus, Loader2, CalendarRange, Search, FileStack, Calculator } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/common/Pagination';
import usePagination from '../hooks/usePagination';
import { useToast } from '../context/ToastContext';
import { LecturasAPI } from '../api/lecturas';
import { FacturasAPI } from '../api/facturas';
import { formatCOP } from '../utils/formatCOP';
import { PeriodosAPI, NOMBRES_MESES } from '../api/periodos';
import LecturaCard from '../components/lecturas/LecturaCard';
import LecturaFormModal from '../components/lecturas/LecturaFormModal';
import LecturaHistorialModal from '../components/lecturas/LecturaHistorialModal';
import CalculadoraConsumoModal from '../components/lecturas/CalculadoraConsumoModal';

export default function Lecturas() {
  const { rol, usuario } = useAuth();
  const nombreUsuario = usuario?.username || 'Usuario';
  const { error, success, warning } = useToast();
  const navigate = useNavigate();
  const esAdmin = rol === 'ADMINISTRADOR';

  // --- Años y meses (para elegir el período contable de las lecturas) ---
  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [months, setMonths] = useState([]);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [selectedMonthId, setSelectedMonthId] = useState(null);

  // --- Lecturas del mes seleccionado ---
  const [lecturas, setLecturas] = useState([]);
  const [loadingLecturas, setLoadingLecturas] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // --- Modales ---
  const [formOpen, setFormOpen] = useState(false);
  const [calculadoraOpen, setCalculadoraOpen] = useState(false);
  const [lecturaEditando, setLecturaEditando] = useState(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [lecturaHistorial, setLecturaHistorial] = useState(null);
  const [facturandoId, setFacturandoId] = useState(null);

  const handleGenerarFactura = async (lec) => {
    setFacturandoId(lec.id);
    try {
      const fac = await FacturasAPI.generarDeLectura(lec.id);
      if (fac.creada) {
        success('Factura generada', `Factura ${fac.numero} por ${formatCOP(fac.total)}.`);
      } else {
        warning('Factura no generada', fac.motivo || 'Motivo desconocido.');
      }
      cargarLecturas();
    } catch (err) {
      error('Error al generar factura', err.message || 'No se pudo generar la factura.');
    } finally {
      setFacturandoId(null);
    }
  };

  useEffect(() => {
    if (!esAdmin) return;
    setLoadingYears(true);
    PeriodosAPI.listarAnios()
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setYears(lista);
        setSelectedYearId((prev) => (prev && lista.some((y) => y.id === prev) ? prev : lista[0]?.id ?? null));
      })
      .catch((err) => error("Error al cargar años.", err.message || "Asegúrate de tener permisos y verifica tu conexión."))
      .finally(() => setLoadingYears(false));
  }, [esAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedYearId) {
      setMonths([]);
      setSelectedMonthId(null);
      return;
    }
    setLoadingMonths(true);
    PeriodosAPI.listarMeses(selectedYearId)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setMonths(lista);
        setSelectedMonthId((prev) => (prev && lista.some((m) => m.id === prev) ? prev : lista[0]?.id ?? null));
      })
      .catch((err) => error("Error al cargar meses.", err.message || "Selecciona otro año o contacta al administrador."))
      .finally(() => setLoadingMonths(false));
  }, [selectedYearId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarLecturas = () => {
    if (!selectedMonthId) return;
    setLoadingLecturas(true);
    LecturasAPI.porMes(selectedMonthId)
      .then((data) => setLecturas(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error("Error al cargar lecturas.", err.message || "Verifica que el mes esté abierto e inténtalo de nuevo."))
      .finally(() => setLoadingLecturas(false));
  };

  useEffect(() => {
    if (!selectedMonthId) {
      setLecturas([]);
      return;
    }
    setBusqueda('');
    cargarLecturas();
  }, [selectedMonthId]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeMes = months.find((m) => m.id === selectedMonthId) || null;
  const mesLabel = activeMes ? `${NOMBRES_MESES[activeMes.numeroMes - 1]} ${activeMes.anio}` : null;
  const mesCerrado = activeMes?.estado === 'CERRADO';

  const totalConsumo = useMemo(() => lecturas.reduce((acc, l) => acc + (l.consumoM3 || 0), 0), [lecturas]);
  const facturasPendientes = useMemo(() => lecturas.filter((l) => !l.facturaGenerada).length, [lecturas]);

  const lecturasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return lecturas;
    return lecturas.filter((l) => {
      const asociado = String(l.asociadoNombre || '').toLowerCase();
      const numeroMedidor = String(l.numeroMedidor ?? l.medidorId ?? '').toLowerCase();
      return asociado.includes(texto) || numeroMedidor.includes(texto);
    });
  }, [lecturas, busqueda]);

  const lectPag = usePagination(lecturasFiltradas, 12);

  if (!esAdmin) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Droplet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores pueden registrar y gestionar lecturas de consumo. Inicia sesión con una cuenta
            autorizada.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg shadow-brand/20">
              <Droplet className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-black text-gray-800 dark:text-white tracking-tight">
                {mesLabel ? `LECTURAS DE ${mesLabel.toUpperCase()}` : 'LECTURAS Y CONSUMO'}
              </h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                Te damos la bienvenida, <span className="font-semibold text-brand dark:text-brand">{nombreUsuario}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCalculadoraOpen(true)}
              title="Calculadora de consumo"
              className="p-2.5 rounded-lg border border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:text-brand hover:border-brand transition-colors"
            >
              <Calculator className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setLecturaEditando(null);
                setFormOpen(true);
              }}
              disabled={!selectedMonthId || mesCerrado}
              title={mesCerrado ? 'El período está cerrado' : undefined}
              className="bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-sm font-semibold"
            >
              <Plus className="w-5 h-5" />
              Registrar lectura
            </button>
          </div>
        </section>

        {loadingYears && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando años contables…</span>
          </div>
        )}

        {!loadingYears && years.length === 0 && (
          <div className="text-center py-16">
            <CalendarRange className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Aún no hay ejercicios contables. Crea uno en el módulo de Períodos contables antes de registrar
              lecturas.
            </p>
          </div>
        )}

        {!loadingYears && years.length > 0 && (
          <>
            {/* Selector de año */}
            <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide">
              Año contable
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Elige el año contable.</p>
            <div className="flex items-center gap-2 flex-wrap mb-5">
              {years.map((y) => (
                <button
                  key={y.id}
                  onClick={() => setSelectedYearId(y.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                    selectedYearId === y.id
                      ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20'
                      : 'border-gray-200 dark:border-dark-muted text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-brand hover:shadow-md'
                  }`}
                >
                  {y.anio}
                </button>
              ))}
            </div>

            {/* Selector de mes */}
            {loadingMonths ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando meses…
              </div>
            ) : months.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                Este ejercicio aún no tiene meses aperturados.
              </p>
            ) : (
              <>
                <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide">
                  Mes contable
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                  Ahora elige el mes en que se tomó la lectura. 🔒 significa que ese mes ya está cerrado.
                </p>
                <div className="flex items-center gap-2 flex-wrap mb-6">
                  {months
                    .slice()
                    .sort((a, b) => a.numeroMes - b.numeroMes)
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMonthId(m.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                          selectedMonthId === m.id
                            ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900 shadow-lg'
                            : 'border-gray-200 dark:border-dark-muted text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400 hover:shadow-md'
                        }`}
                      >
                        {NOMBRES_MESES[m.numeroMes - 1]}
                        {m.estado === 'CERRADO' && ' 🔒'}
                      </button>
                    ))}
                </div>
              </>
            )}

            {selectedMonthId && (
              <>
                {/* Mini dashboard del período */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Período activo
                    </p>
                    <p className="text-lg font-black text-gray-800 dark:text-white">{mesLabel}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Lecturas registradas
                    </p>
                    <p className="text-lg font-black text-gray-800 dark:text-white">{lecturas.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Consumo total
                    </p>
                    <p className="text-lg font-black text-sky-600 dark:text-sky-400">
                      {totalConsumo.toLocaleString()} m³
                    </p>
                  </div>
                </div>

                {esAdmin && (
                  <button
                    onClick={() =>
                      navigate(`/facturacion?generarMes=${selectedMonthId}&generarAnio=${selectedYearId}`)
                    }
                    className="w-full sm:w-auto flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-lg border border-brand/30 bg-brand/10 hover:bg-brand/15 text-brand dark:text-brand-light text-sm font-semibold transition-colors"
                  >
                    <FileStack className="w-4 h-4" /> Ir a facturar {mesLabel}
                  </button>
                )}

                {mesCerrado && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-lg p-3 mb-4 text-sm text-amber-700 dark:text-amber-400">
                    Este período está cerrado: las lecturas ya no se pueden crear ni editar desde aquí.
                  </div>
                )}
                {!mesCerrado && facturasPendientes > 0 && lecturas.length > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    {facturasPendientes} lectura(s) aún no han generado factura.
                  </p>
                )}

                {loadingLecturas && (
                  <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Cargando lecturas…</span>
                  </div>
                )}

                {!loadingLecturas && lecturas.length > 0 && (
                  <>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 text-center">
                      Lista de las lecturas de {activeMes ? NOMBRES_MESES[activeMes.numeroMes - 1] : ''} del {activeMes?.anio || ''}
                    </h2>
                    <div className="relative mb-4">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre de asociado o número de medidor…"
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {!loadingLecturas && lecturas.length === 0 && (
                  <div className="text-center py-16">
                    <Droplet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Aún no hay lecturas registradas para {mesLabel}.
                    </p>
                  </div>
                )}

                {!loadingLecturas && lecturas.length > 0 && lecturasFiltradas.length === 0 && (
                  <div className="text-center py-16">
                    <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Ningún registro coincide con la búsqueda.
                    </p>
                  </div>
                )}

                {!loadingLecturas && lecturasFiltradas.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {lectPag.paginatedItems.map((l) => (
                        <LecturaCard
                          key={l.id}
                          lectura={l}
                          onEditar={(lec) => {
                            setLecturaEditando(lec);
                            setFormOpen(true);
                          }}
                          onVerHistorial={(lec) => {
                            setLecturaHistorial(lec);
                            setHistorialOpen(true);
                          }}
                          onEliminar={(lec) => {
                            if (!window.confirm(`¿Eliminar la lectura de ${lec.asociadoNombre || 'este asociado'} (${lec.lecturaActual} m³)? No se puede deshacer.`)) return;
                            LecturasAPI.eliminar(lec.id)
                              .then(() => {
                                success('Lectura eliminada.');
                                cargarLecturas();
                              })
                              .catch((err) => error('No se pudo eliminar.', err.message || ''));
                          }}
                          onGenerarFactura={handleGenerarFactura}
                          facturando={facturandoId === l.id}
                        />
                      ))}
                    </div>
                    <Pagination currentPage={lectPag.page} totalPages={lectPag.totalPages} onPageChange={lectPag.goToPage} />
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      <LecturaFormModal
        open={formOpen}
        lectura={lecturaEditando}
        mesContableId={selectedMonthId}
        mesLabel={mesLabel}
        lecturasDelMes={lecturas}
        onClose={() => setFormOpen(false)}
        onSaved={cargarLecturas}
        onEditarExistente={(lec) => setLecturaEditando(lec)}
      />
      <LecturaHistorialModal
        open={historialOpen}
        lectura={lecturaHistorial}
        onClose={() => setHistorialOpen(false)}
      />
      <CalculadoraConsumoModal open={calculadoraOpen} onClose={() => setCalculadoraOpen(false)} />
    </div>
  );
}
