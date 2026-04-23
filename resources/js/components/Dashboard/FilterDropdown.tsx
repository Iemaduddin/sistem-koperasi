import { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface Option {
    value: string;
    label: string;
}

interface FilterDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    className?: string;
}

export default function FilterDropdown({ value, onChange, options, className = '' }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-blue-400 hover:bg-blue-50 active:scale-95 shadow-sm"
            >
                <span className="truncate">{selectedOption.label}</span>
                <FiChevronDown 
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-blue-500'}`} 
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-xl border border-slate-100 bg-white p-1 shadow-xl ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in duration-100">
                    <div className="py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center rounded-lg px-3 py-2 text-xs transition-colors ${
                                    value === option.value
                                        ? 'bg-blue-50 font-bold text-blue-600'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                            >
                                {option.label}
                                {value === option.value && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
