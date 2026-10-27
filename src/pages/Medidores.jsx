import { useEffect, useMemo, useState } from 'react';
import { Gauge, Plus, Search, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MedidoresAPI } from '../api/medidores';
import MedidorCard from '../components/medidores/MedidorCard';
import MedidorFormModal from '../components/medidores/MedidorFormModal';
import MedidorEstadoModal from '../components/medidores/MedidorEstadoModal';
import MedidorDetalleModal from '../components/medidores/MedidorDetalleModal';
import Pagination from '../components/common/Pagination';
import usePagination from '../hooks/usePagination';

export default function Medidores() {
  const { rol } = useAuth();
  const { error } = useToast();
  const esAdmin = rol === 'ADMINISTRADOR';
  const puedeGestionar = esAdmin || rol === 'TESORERO';

  const [medidores, setMedidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [medidorEditando, setMedidorEditando] = useState(null);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [medidorEstado, setMedidorEstado] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [medidorDetalle, setMedidorDetalle] = useState(null);

  const cargar = () => {
    setLoading(true);
    MedidoresAPI.listar()
      .then((data) => setMedidores(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error("Error al cargar medidores.", err.message || "Verifica tu conexión o contacta al administrador."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (puedeGestionar) cargar();
  }, [puedeGestionar]); // eslint-disable-line react-hooks/exhaustive-deps

  const medidoresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return medidores;
    const q = busqueda.trim().toLowerCase();
    return medidores.filter(
      (m) =>
        (m.numero || '').toLowerCase().includes(q) ||
        (m.codigoInterno || '').toLowerCase().includes(q) ||
        (m.ubicacion || '').toLowerCase().includes(q) ||
        (m.asociadoNombre || '').toLowerCase().includes(q)
    );
  }, [medidores, busqueda]);

  const medPag = usePagination(medidoresFiltrados, 12);

  if (!puedeGestionar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Gauge className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden gestionar el inventario de medidores.
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
          <div className="flex items-center gap-2">
            <Gauge className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Listado de medidores</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Módulo 3 · Administra el inventario y estado de los medidores de agua
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setMedidorEditando(null);
              setFormOpen(true);
            }}
            className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-sm font-semibold shrink-0"
          >
            <Plus className="w-5 h-5" />
            Registrar medidor
          </button>
        </section>

        <div className="relative mb-6 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por número, código, ubicación o asociado…"
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando medidores…</span>
          </div>
        )}

        {!loading && medidoresFiltrados.length === 0 && (
          <div className="text-center py-16">
            <Gauge className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {busqueda ? 'Ningún medidor coincide con la búsqueda.' : 'Aún no hay medidores registrados.'}
            </p>
          </div>
        )}

        {!loading && medidoresFiltrados.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medPag.paginatedItems.map((m) => (
                <MedidorCard
                  key={m.id}
                  medidor={m}
                  onVerDetalle={(med) => {
                    setMedidorDetalle(med);
                    setDetalleOpen(true);
                  }}
                  onCambiarEstado={(med) => {
                    setMedidorEstado(med);
                    setEstadoOpen(true);
                  }}
                  onEditar={(med) => {
                    setMedidorEditando(med);
                    setFormOpen(true);
                  }}
                />
              ))}
            </div>
            <Pagination currentPage={medPag.page} totalPages={medPag.totalPages} onPageChange={medPag.goToPage} />
          </>
        )}
      </main>

      <MedidorFormModal
        open={formOpen}
        medidor={medidorEditando}
        onClose={() => setFormOpen(false)}
        onSaved={cargar}
      />
      <MedidorEstadoModal
        open={estadoOpen}
        medidor={medidorEstado}
        onClose={() => setEstadoOpen(false)}
        onSaved={cargar}
      />
      <MedidorDetalleModal open={detalleOpen} medidor={medidorDetalle} onClose={() => setDetalleOpen(false)} />
    </div>
  );
}
