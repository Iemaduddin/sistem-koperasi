import { type ReactNode, useEffect } from 'react';
import { cn } from '@/utils/general';

type ModalProps = {
    open: boolean;
    title?: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    onClose: () => void;
    closeOnBackdrop?: boolean;
    maxWidthClassName?: string;
};

export default function Modal({
    open,
    title,
    description,
    children,
    footer,
    onClose,
    closeOnBackdrop = true,
    maxWidthClassName = 'max-w-lg',
}: ModalProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div
                className="absolute inset-0"
                onClick={closeOnBackdrop ? onClose : undefined}
                aria-hidden="true"
            />

            <section
                role="dialog"
                aria-modal="true"
                className={cn(
                    'relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-xl',
                    maxWidthClassName,
                )}
            >
                {title ? (
                    <h3 className="text-lg font-semibold text-slate-900">
                        {title}
                    </h3>
                ) : null}

                {description ? (
                    <p className="mt-1 text-sm text-slate-600">{description}</p>
                ) : null}

                <div className="mt-4 overflow-y-auto">{children}</div>

                {footer ? (
                    <div className="mt-5 flex justify-end gap-2">{footer}</div>
                ) : null}
            </section>
        </div>
    );
}

export type { ModalProps };
