'use client';

import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type SelectHTMLAttributes,
} from 'react';

export type FloatingSelectOption = {
    label: string;
    value: string;
    disabled?: boolean;
};

export type FloatingSelectProps = Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'children' | 'value' | 'defaultValue'
> & {
    label: string;
    options: FloatingSelectOption[];
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    helperText?: string;
    errorText?: string;
    containerClassName?: string;
    searchable?: boolean;
    emptySearchText?: string;
    onValueChange?: (value: string, option?: FloatingSelectOption) => void;
    onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export default function FloatingSelect({
    id,
    name,
    label,
    options,
    value,
    defaultValue = '',
    placeholder = 'Pilih opsi',
    helperText,
    errorText,
    containerClassName,
    searchable = true,
    emptySearchText = 'Data tidak ditemukan',
    disabled,
    required,
    onValueChange,
    onChange,
    className,
    ...props
}: FloatingSelectProps) {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement>(null);

    const selectedValue = isControlled ? (value ?? '') : internalValue;
    const selectedOption = options.find(
        (option) => option.value === selectedValue,
    );

    const filteredOptions = useMemo(() => {
        if (!searchable || !search.trim()) return options;
        const keyword = search.trim().toLowerCase();
        return options.filter((option) =>
            option.label.toLowerCase().includes(keyword),
        );
    }, [options, search, searchable]);

    useEffect(() => {
        if (!isOpen) {
            setSearch('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const updateValue = (nextValue: string) => {
        if (!isControlled) {
            setInternalValue(nextValue);
        }

        const option = options.find((item) => item.value === nextValue);
        onValueChange?.(nextValue, option);

        if (onChange && hiddenSelectRef.current) {
            hiddenSelectRef.current.value = nextValue;
            onChange({
                target: hiddenSelectRef.current,
                currentTarget: hiddenSelectRef.current,
            } as ChangeEvent<HTMLSelectElement>);
        }

        setIsOpen(false);
    };

    const shouldFloat = isOpen || Boolean(selectedValue);
    const triggerId = `${resolvedId}-trigger`;

    return (
        <div className={cn('w-full', containerClassName)} ref={containerRef}>
            <select
                ref={hiddenSelectRef}
                id={resolvedId}
                name={name}
                value={selectedValue}
                onChange={() => undefined}
                disabled={disabled}
                required={required}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                    >
                        {option.label}
                    </option>
                ))}
            </select>

            <div className="relative">
                <button
                    id={triggerId}
                    data-select-trigger-for={name}
                    type="button"
                    onClick={() => !disabled && setIsOpen((prev) => !prev)}
                    disabled={disabled}
                    className={cn(
                        'h-11 w-full rounded-lg border bg-white px-3 text-left text-sm transition outline-none',
                        'border-blue-200 text-slate-800 focus:border-blue-500',

                        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',

                        errorText && 'border-red-400 focus:border-red-500',

                        className,
                    )}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                >
                    <span className={cn(!selectedOption && 'text-slate-400')}>
                        {selectedOption?.label ?? placeholder}
                    </span>
                </button>
                <label
                    htmlFor={resolvedId}
                    className={cn(
                        'pointer-events-none absolute left-3 bg-white px-1 text-sm text-slate-500 transition-all',

                        shouldFloat
                            ? 'top-0 -translate-y-1/2 text-xs'
                            : 'top-1/2 -translate-y-1/2 text-sm',
                        isOpen && 'text-blue-600',
                        errorText && isOpen && 'text-red-500',
                    )}
                >
                    {label}{' '}
                    {required && <span className="text-red-500">*</span>}
                </label>

                {isOpen && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-blue-200 bg-white p-2 shadow-sm">
                        {searchable && (
                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.currentTarget.value)
                                }
                                placeholder="Cari opsi..."
                                className="mb-2 h-9 w-full rounded-md border border-blue-200 px-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                                autoFocus
                            />
                        )}
                        <div className="max-h-48 overflow-auto">
                            {filteredOptions.length === 0 ? (
                                <p className="px-2 py-1 text-sm text-slate-500">
                                    {emptySearchText}
                                </p>
                            ) : (
                                filteredOptions.map((option) => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        onClick={() =>
                                            !option.disabled &&
                                            updateValue(option.value)
                                        }
                                        disabled={option.disabled}
                                        className={cn(
                                            'w-full rounded-md px-2 py-1.5 text-left text-sm transition',
                                            'hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50',
                                            selectedValue === option.value &&
                                                'bg-blue-100 text-blue-700',
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {errorText ? (
                <p className="mt-1 text-xs text-red-500">{errorText}</p>
            ) : helperText ? (
                <p className="mt-1 text-xs text-slate-500">{helperText}</p>
            ) : null}
        </div>
    );
}
