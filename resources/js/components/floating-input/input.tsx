'use client';

import {
    forwardRef,
    useId,
    useState,
    type ChangeEvent,
    type InputHTMLAttributes,
} from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';

type FloatingInputType =
    | InputHTMLAttributes<HTMLInputElement>['type']
    | 'currency'
    | 'rupiah';

export type CurrencyValue = {
    raw: string;
    numeric: number | null;
    formatted: string;
};

export type FloatingInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type'
> & {
    label: string;
    type?: FloatingInputType;
    helperText?: string;
    errorText?: string;
    containerClassName?: string;
    onCurrencyValueChange?: (value: CurrencyValue) => void;
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function extractDigits(value: string) {
    return value.replace(/\D/g, '');
}

function formatRupiah(value: string) {
    const digits = extractDigits(value);
    if (!digits) return '';

    const numberValue = Number(digits);
    if (Number.isNaN(numberValue)) return '';

    return `Rp ${new Intl.NumberFormat('id-ID').format(numberValue)}`;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    function FloatingInput(
        {
            id,
            label,
            type = 'text',
            className,
            containerClassName,
            helperText,
            errorText,
            onChange,
            onCurrencyValueChange,
            value,
            defaultValue,
            placeholder,
            disabled,
            ...props
        },
        ref,
    ) {
        const generatedId = useId();
        const resolvedId = id ?? generatedId;
        const isCurrency = type === 'currency' || type === 'rupiah';
        const isPasswordType = type === 'password';
        const isControlled = value !== undefined;
        const [showPassword, setShowPassword] = useState(false);

        const [internalValue, setInternalValue] = useState(() => {
            if (defaultValue === undefined || defaultValue === null) return '';
            return String(defaultValue);
        });

        const sourceValue = isControlled ? String(value ?? '') : internalValue;
        const displayValue = isCurrency
            ? formatRupiah(sourceValue)
            : sourceValue;

        const inputType: InputHTMLAttributes<HTMLInputElement>['type'] =
            isCurrency
                ? 'text'
                : isPasswordType && showPassword
                  ? 'text'
                  : type;

        const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            if (!isCurrency) {
                if (!isControlled) {
                    setInternalValue(event.currentTarget.value);
                }
                onChange?.(event);
                return;
            }

            const raw = extractDigits(event.currentTarget.value);
            const formatted = formatRupiah(raw);

            if (!isControlled) {
                setInternalValue(raw);
            }

            event.currentTarget.value = formatted;
            onChange?.(event);

            onCurrencyValueChange?.({
                raw,
                numeric: raw ? Number(raw) : null,
                formatted,
            });
        };

        return (
            <div className={cn('w-full', containerClassName)}>
                <div className="relative">
                    <input
                        ref={ref}
                        id={resolvedId}
                        type={inputType}
                        value={displayValue}
                        onChange={handleChange}
                        placeholder={placeholder ?? ' '}
                        disabled={disabled}
                        className={cn(
                            'peer h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 transition outline-none',
                            'border-blue-200 focus:border-blue-500',
                            'placeholder:text-transparent focus:placeholder:text-slate-400',
                            'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
                            isPasswordType && 'pr-10',
                            errorText && 'border-red-400 focus:border-red-500',
                            className,
                        )}
                        {...props}
                    />
                    {isPasswordType && (
                        <button
                            type="button"
                            tabIndex={-1}
                            disabled={disabled}
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                            aria-label={
                                showPassword
                                    ? 'Sembunyikan password'
                                    : 'Tampilkan password'
                            }
                        >
                            {showPassword ? (
                                <LuEyeOff className="h-4 w-4" />
                            ) : (
                                <LuEye className="h-4 w-4" />
                            )}
                        </button>
                    )}
                    <label
                        htmlFor={resolvedId}
                        className={cn(
                            'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 bg-white px-1 text-sm text-slate-500 transition-all',
                            'peer-focus:top-0 peer-focus:translate-y-[-50%] peer-focus:text-xs peer-focus:text-blue-600',
                            'peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:translate-y-[-50%] peer-not-placeholder-shown:text-xs',
                            errorText && 'peer-focus:text-red-500',
                        )}
                    >
                        {label}{' '}
                        {props.required && (
                            <span className="text-red-500">*</span>
                        )}
                    </label>
                </div>
                {errorText ? (
                    <p className="mt-1 text-xs text-red-500">{errorText}</p>
                ) : helperText ? (
                    <p className="mt-1 text-xs text-slate-500">{helperText}</p>
                ) : null}
            </div>
        );
    },
);

export default FloatingInput;
