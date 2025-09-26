
import React from 'react';

interface ResultsDisplayProps {
  domicilioCSV: string;
  sucursalCSV: string;
  onDownload: (content: string, fileName: string) => void;
  onDownloadCombined?: (domicilioCSV: string, sucursalCSV: string, fileName: string) => void;
  onDownloadExcel?: (domicilioCSV: string, sucursalCSV: string) => void;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ domicilioCSV, sucursalCSV, onDownload, onDownloadCombined, onDownloadExcel }) => {
  return (
    <div className="bg-gray-900/50 p-6 rounded-lg animate-fade-in">
        <h3 className="text-lg font-semibold text-center text-white mb-4">Descargar Archivos Procesados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
                onClick={() => onDownload(domicilioCSV, 'Domicilios.csv')}
                disabled={!domicilioCSV}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
            >
               <DownloadIcon />
               Descargar Domicilios.csv
            </button>
            <button
                onClick={() => onDownload(sucursalCSV, 'Sucursales.csv')}
                disabled={!sucursalCSV}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
            >
                <DownloadIcon />
                Descargar Sucursales.csv
            </button>
            {onDownloadCombined && (
                <button
                    onClick={() => onDownloadCombined(domicilioCSV, sucursalCSV, 'Domicilios_y_Sucursales_Combinado.csv')}
                    disabled={!domicilioCSV && !sucursalCSV}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                >
                    <DownloadIcon />
                    Descargar Combinado.csv
                </button>
            )}
            {onDownloadExcel && (
                <button
                    onClick={() => onDownloadExcel(domicilioCSV, sucursalCSV)}
                    disabled={!domicilioCSV && !sucursalCSV}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                >
                    <DownloadIcon />
                    Descargar Excel.xlsx
                </button>
            )}
        </div>
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
            }
        `}</style>
    </div>
  );
};
