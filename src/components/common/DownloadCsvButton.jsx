import { Download } from 'lucide-react';
import { exportarAExcel } from '../../utils/exportarExcel';

export default function DownloadCsvButton({ data, preparar, filename, label = 'Descargar CSV', className = '' }) {
  const handleDownload = () => {
    if (!data || data.length === 0) return;
    const datos = preparar ? preparar(data) : data;
    exportarAExcel(datos, filename, 'Datos', 'csv');
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!data || data.length === 0}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${className}`}
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
