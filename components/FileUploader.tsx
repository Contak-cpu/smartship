
import React, { useCallback, useState } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  disabled: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFileName(file?.name || null);
    onFileSelect(file);
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] || null;
    if (file && file.type === 'text/csv') {
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <label 
      className={`flex justify-center w-full h-28 sm:h-32 px-4 transition bg-gray-700 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500 focus:outline-none ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <span className="flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className="font-medium text-gray-400 text-sm sm:text-base">
          {fileName ? (
            <span className="text-green-400 text-xs sm:text-sm break-all">{fileName}</span>
          ) : (
            <>
              <span className="hidden sm:inline">Arrastra y suelta tu archivo </span>
              <span className="sm:hidden">Subir archivo </span>
              <span className="text-indigo-400">.CSV</span>
              <span className="hidden sm:inline"> o haz clic para buscar</span>
            </>
          )}
        </span>
      </span>
      <input type="file" name="file_upload" className="hidden" accept=".csv" onChange={handleFileChange} disabled={disabled} />
    </label>
  );
};
