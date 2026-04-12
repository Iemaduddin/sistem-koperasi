'use client';

import type { ReactNode } from 'react';
import { LuTrash } from 'react-icons/lu';

type ConfirmDialogTone = 'danger' | 'warning' | 'info' | 'success';

const toneClasses: Record<
    ConfirmDialogTone,
    {
        iconWrapper: string;
        iconText: string;
        cancelButton: string;
        confirmButton: string;
    }
> = {
    danger: {
        iconWrapper: 'bg-red-100',
        iconText: 'text-red-600',
        cancelButton: 'border-red-200 hover:bg-red-50',
        confirmButton: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
        iconWrapper: 'bg-amber-100',
        iconText: 'text-amber-700',
        cancelButton: 'border-amber-200 hover:bg-amber-50',
        confirmButton: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
        iconWrapper: 'bg-blue-100',
        iconText: 'text-blue-700',
        cancelButton: 'border-blue-200 hover:bg-blue-50',
        confirmButton: 'bg-blue-600 hover:bg-blue-700',
    },
    success: {
        iconWrapper: 'bg-emerald-100',
        iconText: 'text-emerald-700',
        cancelButton: 'border-emerald-200 hover:bg-emerald-50',
        confirmButton: 'bg-emerald-600 hover:bg-emerald-700',
    },
};

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: string;
    tone?: ConfirmDialogTone;
    icon?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmDialog({
    open,
    title,
    description,
    tone = 'danger',
    icon = <LuTrash className="h-7 w-7" />,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) {
        return null;
    }

    const toneStyle = toneClasses[tone];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl md:p-7">
                <div
                    className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full p-6 ${toneStyle.iconWrapper}`}
                >
                    <span className={toneStyle.iconText}>{icon}</span>
                </div>
                <h3 className="text-center text-xl font-semibold text-slate-900">
                    {title}
                </h3>
                <p className="mt-2 text-center text-sm text-slate-500">
                    {description}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className={`inline-flex h-11 w-full items-center justify-center rounded-lg border px-3 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-70 ${toneStyle.cancelButton}`}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${toneStyle.confirmButton}`}
                    >
                        {isLoading ? 'Memproses...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
