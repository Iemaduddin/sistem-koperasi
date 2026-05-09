'use client';

import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type ReactNode,
    type SelectHTMLAttributes,
} from 'react';

export type FloatingSelectOption = {
    label: string;
    richLabel?: ReactNode;
    value: string;
    disabled?: boolean;
};

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type FloatingSelectProps = Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'children' | 'value' | 'defaultValue' | 'size'
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
    size?: Size;
    onValueChange?: (value: string, option?: FloatingSelectOption) => void;
    onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}
const sizeClasses: Record<Size, string> = {
    xs: 'h-8',
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-14',
    xl: 'h-16',
    full: 'w-full',
};

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
    size = 'md',
    ...props
}: FloatingSelectProps) {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeValue, setActiveValue] = useState<string | null>(null);
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

    const enabledFilteredOptions = useMemo(
        () => filteredOptions.filter((option) => !option.disabled),
        [filteredOptions],
    );

    useEffect(() => {
        if (!isOpen) {
            setSearch('');
            setActiveValue(null);
            return;
        }

        const nextActive = enabledFilteredOptions.find(
            (option) => option.value === selectedValue,
        );
        setActiveValue(
            nextActive?.value ?? enabledFilteredOptions[0]?.value ?? null,
        );
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

    const moveActiveOption = (direction: 1 | -1) => {
        if (enabledFilteredOptions.length === 0) return;

        const currentIndex = enabledFilteredOptions.findIndex(
            (option) => option.value === activeValue,
        );

        if (currentIndex === -1) {
            const fallbackIndex =
                direction === 1 ? 0 : enabledFilteredOptions.length - 1;
            setActiveValue(enabledFilteredOptions[fallbackIndex].value);
            return;
        }

        const nextIndex =
            (currentIndex + direction + enabledFilteredOptions.length) %
            enabledFilteredOptions.length;
        setActiveValue(enabledFilteredOptions[nextIndex].value);
    };

    const handleTriggerKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
    ) => {
        if (disabled) return;

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                return;
            }
            moveActiveOption(event.key === 'ArrowDown' ? 1 : -1);
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                return;
            }
            if (activeValue) {
                updateValue(activeValue);
            }
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    const handleSearchKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            moveActiveOption(event.key === 'ArrowDown' ? 1 : -1);
        }

        if (event.key === 'Enter' && activeValue) {
            event.preventDefault();
            updateValue(activeValue);
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    const shouldFloat = isOpen || Boolean(selectedValue);
    const triggerId = `${resolvedId}-trigger`;
    const listboxId = `${resolvedId}-listbox`;

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
                    onKeyDown={handleTriggerKeyDown}
                    disabled={disabled}
                    className={cn(
                        'group ' +
                            sizeClasses[size] +
                            ' w-full rounded-xl border bg-linear-to-b from-white to-slate-50 px-3 text-left text-sm transition-all outline-none',
                        'border-blue-200/90 text-slate-800 shadow-[0_1px_0_rgba(15,23,42,0.03)] focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70',
                        isOpen && 'border-blue-500 ring-2 ring-blue-200/70',

                        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none',

                        errorText &&
                            'border-red-400 focus:border-red-500 focus:ring-red-200/70',

                        className,
                    )}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-controls={listboxId}
                >
                    <span className="flex items-center justify-between gap-3">
                        <span
                            className={cn(
                                'truncate transition-colors',
                                !selectedOption && 'text-slate-400',
                            )}
                        >
                            {selectedOption?.richLabel ??
                                selectedOption?.label ??
                                placeholder}
                        </span>
                        <svg
                            className={cn(
                                'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
                                isOpen && 'rotate-180 text-blue-500',
                            )}
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <path
                                d="M5 7.5L10 12.5L15 7.5"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                </button>
                <label
                    htmlFor={resolvedId}
                    className={cn(
                        'pointer-events-none absolute left-3 bg-white/95 px-1 text-sm text-slate-500 transition-all',

                        shouldFloat
                            ? 'top-0 -translate-y-1/2 text-xs font-medium'
                            : 'top-1/2 -translate-y-1/2 text-sm',
                        isOpen && 'text-blue-600',
                        errorText && isOpen && 'text-red-500',
                    )}
                >
                    {label}{' '}
                    {required && <span className="text-red-500">*</span>}
                </label>

                {isOpen && (
                    <div className="animate-in fade-in-0 zoom-in-95 absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-blue-200/90 bg-white p-2 shadow-[0_16px_40px_-18px_rgba(30,64,175,0.45)] ring-1 ring-blue-100/60 duration-150">
                        {searchable && (
                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.currentTarget.value)
                                }
                                placeholder="Cari opsi..."
                                onKeyDown={handleSearchKeyDown}
                                className="mb-2 h-9 w-full rounded-lg border border-blue-200 bg-blue-50/40 px-2.5 text-sm text-slate-700 transition outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200/70"
                                autoFocus
                            />
                        )}
                        <div
                            id={listboxId}
                            role="listbox"
                            aria-labelledby={triggerId}
                            className="max-h-56 space-y-1 overflow-auto pr-1"
                        >
                            {filteredOptions.length === 0 ? (
                                <p className="rounded-lg bg-slate-50 px-2 py-2 text-sm text-slate-500">
                                    {emptySearchText}
                                </p>
                            ) : (
                                filteredOptions.map((option) => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        role="option"
                                        aria-selected={
                                            selectedValue === option.value
                                        }
                                        onClick={() =>
                                            !option.disabled &&
                                            updateValue(option.value)
                                        }
                                        onMouseEnter={() =>
                                            !option.disabled &&
                                            setActiveValue(option.value)
                                        }
                                        disabled={option.disabled}
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                                            'hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50',
                                            activeValue === option.value &&
                                                'bg-blue-50 ring-1 ring-blue-100',
                                            selectedValue === option.value &&
                                                'bg-blue-100/80 font-medium text-blue-700',
                                        )}
                                    >
                                        <span className="truncate">
                                            {option.richLabel ?? option.label}
                                        </span>
                                        {selectedValue === option.value && (
                                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                                        )}
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
