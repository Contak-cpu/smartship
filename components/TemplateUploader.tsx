import React, { useState } from 'react';

interface TemplateUploaderProps {
  onTemplateLoad: (templateData: any) => void;
  disabled?: boolean;
}

const TemplateUploader: React.FC<TemplateUploaderProps> = ({ onTemplateLoad, disabled }) => {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Por favor, selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setTemplateFile(file);
    setError(null);
    setLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      onTemplateLoad(arrayBuffer);
    } catch (err) {
      setError('Error al cargar la plantilla');
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          📋 Cargar Plantilla de Excel
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={disabled || loading}
          className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 disabled:opacity-50"
        />
        <p className="text-xs text-gray-400 mt-1">
          Carga la plantilla exacta de Andreani para mantener el formato original
        </p>
      </div>

      {templateFile && (
        <div className="text-green-400 text-sm">
          ✓ {templateFile.name} cargado
        </div>
      )}

      {loading && (
        <div className="text-blue-400 text-sm">
          ⏳ Cargando plantilla...
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm">
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default TemplateUploader;
