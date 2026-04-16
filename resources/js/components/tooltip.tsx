import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/utils/general';

type TooltipTrigger = 'hover' | 'click';
type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

type TooltipProps = {
    content: ReactNode;
    children: ReactNode;
    trigger?: TooltipTrigger;
    side?: TooltipSide;
    className?: string;
    contentClassName?: string;
    disabled?: boolean;
};

const sideClassMap: Record<TooltipSide, string> = {
    top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    right: 'left-full top-1/2 ml-2 -translate-y-1/2',
    bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
    left: 'right-full top-1/2 mr-2 -translate-y-1/2',
};

export default function Tooltip({
    content,
    children,
    trigger = 'hover',
    side = 'top',
    className,
    contentClassName,
    disabled = false,
}: TooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement | null>(null);
    const tooltipId = useId();

    useEffect(() => {
        if (disabled || trigger !== 'click' || !isOpen) {
            return;
        }

        const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
            if (!wrapperRef.current) {
                return;
            }

            const target = event.target as Node | null;
            if (target && !wrapperRef.current.contains(target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [disabled, isOpen, trigger]);

    if (disabled) {
        return <>{children}</>;
    }

    const isHoverTrigger = trigger === 'hover';

    return (
        <span
            ref={wrapperRef}
            className={cn('relative inline-flex', className)}
            onMouseEnter={isHoverTrigger ? () => setIsOpen(true) : undefined}
            onMouseLeave={isHoverTrigger ? () => setIsOpen(false) : undefined}
            onFocus={isHoverTrigger ? () => setIsOpen(true) : undefined}
            onBlur={isHoverTrigger ? () => setIsOpen(false) : undefined}
            onClick={
                !isHoverTrigger ? () => setIsOpen((prev) => !prev) : undefined
            }
            aria-describedby={isOpen ? tooltipId : undefined}
        >
            {children}

            {isOpen ? (
                <span
                    id={tooltipId}
                    role="tooltip"
                    className={cn(
                        'pointer-events-none absolute z-50 max-w-xs rounded-md bg-slate-900 px-2.5 py-1.5 text-xs leading-relaxed text-white shadow-lg',
                        sideClassMap[side],
                        contentClassName,
                    )}
                >
                    {content}
                </span>
            ) : null}
        </span>
    );
}

export type { TooltipProps, TooltipTrigger, TooltipSide };
