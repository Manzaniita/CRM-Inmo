import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { normalizeSearchText } from '../lib/utils';

interface SearchableOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  emptyValue?: string;
}

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Buscar...',
  emptyLabel = 'Ninguno',
  allowEmpty = true,
  emptyValue = ''
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = options.filter(opt => {
    if (!search) return true;
    const searchNormalized = normalizeSearchText(search);
    const labelNormalized = normalizeSearchText(opt.label);
    const subtitleNormalized = opt.subtitle ? normalizeSearchText(opt.subtitle) : '';
    return labelNormalized.includes(searchNormalized) || subtitleNormalized.includes(searchNormalized);
  });

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resetear búsqueda al cerrar
  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(emptyValue);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
          {label}
        </label>
      )}
      <div
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus-within:ring-2 focus-within:ring-blue-500/20"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <div className="flex-1 min-w-0">
          {selectedOption ? (
            <span className="font-medium text-gray-900 truncate block">{selectedOption.label}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {allowEmpty && value && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 rounded-full text-gray-400"
              tabIndex={-1}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {allowEmpty && (
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                onClick={() => handleSelect(emptyValue)}
              >
                {emptyLabel}
              </button>
            )}
            {filteredOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                  opt.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="text-sm font-medium block truncate">{opt.label}</span>
                {opt.subtitle && (
                  <span className="text-xs text-gray-400 block truncate">{opt.subtitle}</span>
                )}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Sin resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}