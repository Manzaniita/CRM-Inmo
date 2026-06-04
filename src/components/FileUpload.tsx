import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  preview?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  value?: File | null;
  uploading?: boolean;
  progress?: number;
}

export default function FileUpload({
  onFileSelect,
  accept,
  maxSizeMB = 10,
  preview = true,
  disabled = false,
  className,
  label = 'Archivo',
  helperText,
  value,
  uploading = false,
  progress = 0,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedFile = value ?? null;

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    if (preview && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile, preview]);

  const handleFile = useCallback((file: File | null) => {
    if (!file) {
      onFileSelect(null);
      setPreviewUrl(null);
      return;
    }
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      alert(`El archivo excede el tamaño máximo de ${maxSizeMB} MB`);
      return;
    }
    onFileSelect(file);
  }, [onFileSelect, maxSizeMB]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0] || null;
    handleFile(file);
  }, [disabled, uploading, handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) setIsDragOver(true);
  }, [disabled, uploading]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const clearFile = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onFileSelect(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onFileSelect]);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 text-center transition-all',
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-800/50',
          (disabled || uploading) && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Subiendo archivo...</p>
            <div className="w-full max-w-[200px] h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{progress}%</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            {previewUrl ? (
              <div className="relative w-full max-w-[220px] aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <File size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={16} className="text-slate-400 dark:text-slate-500" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                isDragOver
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              )}
            >
              <Upload size={20} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="text-blue-600 font-semibold">Seleccionar archivo</span> o arrastrar aquí
            </p>
            {helperText && (
              <p className="text-xs text-slate-400 dark:text-slate-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
