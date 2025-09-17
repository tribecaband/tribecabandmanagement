import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface KeySignatureSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

// Tonalidades musicales en notación inglesa
const KEY_SIGNATURES = [
  { value: '', label: 'Sin especificar' },
  { value: 'C', label: 'C (Do)' },
  { value: 'C#', label: 'C# (Do#)' },
  { value: 'Db', label: 'Db (Reb)' },
  { value: 'D', label: 'D (Re)' },
  { value: 'D#', label: 'D# (Re#)' },
  { value: 'Eb', label: 'Eb (Mib)' },
  { value: 'E', label: 'E (Mi)' },
  { value: 'F', label: 'F (Fa)' },
  { value: 'F#', label: 'F# (Fa#)' },
  { value: 'Gb', label: 'Gb (Solb)' },
  { value: 'G', label: 'G (Sol)' },
  { value: 'G#', label: 'G# (Sol#)' },
  { value: 'Ab', label: 'Ab (Lab)' },
  { value: 'A', label: 'A (La)' },
  { value: 'A#', label: 'A# (La#)' },
  { value: 'Bb', label: 'Bb (Sib)' },
  { value: 'B', label: 'B (Si)' },
];

export default function KeySignatureSelector({ value, onChange, disabled = false, size = 'md' }: KeySignatureSelectorProps) {

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Función para actualizar la posición del dropdown
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  // Cerrar dropdown al hacer clic fuera y manejar scroll/resize
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleScroll(event: Event) {
      // Solo cerrar si el scroll no ocurre dentro del dropdown
      if (dropdownRef.current && event.target && 
          !dropdownRef.current.contains(event.target as Node)) {
        // En lugar de cerrar, actualizar la posición
        updateDropdownPosition();
      }
    }

    function handleResize() {
      if (isOpen) {
        updateDropdownPosition();
      } else {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Actualizar posición inicial
      updateDropdownPosition();
      
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
   }, [isOpen]);

   const selectedKey = KEY_SIGNATURES.find(key => key.value === (value || ''));
  const displayValue = selectedKey ? selectedKey.label : 'Seleccionar tono';

  const handleSelect = (keyValue: string) => {
    onChange(keyValue);
    setIsOpen(false);
  };



  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`
          relative w-full bg-white border border-gray-300 rounded-md text-left cursor-default focus:outline-none focus:ring-1 focus:ring-[#2DB2CA] focus:border-[#2DB2CA]
          ${size === 'sm' ? 'pl-2 pr-8 py-1 text-xs' : 'pl-3 pr-10 py-2 text-sm'}
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
      >
        <span className={`block truncate ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {displayValue}
        </span>
        <span className={`absolute inset-y-0 right-0 flex items-center pointer-events-none ${size === 'sm' ? 'pr-1' : 'pr-2'}`}>
          <ChevronDown className={`text-gray-400 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        </span>
      </button>

      {isOpen && (
        <div 
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-[200px]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width
          }}
        >
          {KEY_SIGNATURES.map((key) => (
            <button
              key={key.value}
              onClick={() => handleSelect(key.value)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors block ${
                value === key.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              {key.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}