import React, { useCallback, useState } from 'react';

interface DualFileUploaderProps {
  onCsvSelect: (file: File | null) => void;
  onXlsxSelect: (file: File | null) => void;
  disabled: boolean;
}

export const DualFileUploader: React.FC<DualFileUploaderProps> = ({ 
  onCsvSelect, 
  onXlsxSelect, 
  disabled 
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);

  const handleCsvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setCsvFile(file);
    onCsvSelect(file);
  };

  const handleXlsxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setXlsxFile(file);
    onXlsxSelect(file);
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    files.forEach(file => {
      if (file.type === 'text/csv') {
        setCsvFile(file);
        onCsvSelect(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setXlsxFile(file);
        onXlsxSelect(file);
      }
    });
  }, [onCsvSelect, onXlsxSelect]);

  return (
    <div className="space-y-4">
      {/* Uploader para CSV */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Archivo CSV de Pedidos
        </label>
        <label 
          className={`flex justify-center w-full h-24 px-4 transition bg-gray-700 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500 focus:outline-none ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium text-gray-400 text-sm">
              {csvFile ? (
                <span className="text-green-400 text-xs break-all">{csvFile.name}</span>
              ) : (
                <>
                  <span className="text-indigo-400">.CSV</span>
                  <span className="hidden sm:inline"> o arrastra aquí</span>
                </>
              )}
            </span>
          </span>
          <input 
            type="file" 
            className="hidden" 
            accept=".csv" 
            onChange={handleCsvChange} 
            disabled={disabled} 
          />
        </label>
      </div>

      {/* Uploader para XLSX */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Plantilla XLSX de Andreani (Opcional)
        </label>
        <label 
          className={`flex justify-center w-full h-24 px-4 transition bg-gray-700 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500 focus:outline-none ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium text-gray-400 text-sm">
              {xlsxFile ? (
                <span className="text-green-400 text-xs break-all">{xlsxFile.name}</span>
              ) : (
                <>
                  <span className="text-green-400">.XLSX</span>
                  <span className="hidden sm:inline"> o arrastra aquí</span>
                </>
              )}
            </span>
          </span>
          <input 
            type="file" 
            className="hidden" 
            accept=".xlsx" 
            onChange={handleXlsxChange} 
            disabled={disabled} 
          />
        </label>
      </div>

      {/* Información adicional */}
      <div className="text-xs text-gray-500 text-center">
        <p>Si no cargas una plantilla XLSX, se usará la plantilla interna de Andreani.</p>
      </div>
    </div>
  );
};
