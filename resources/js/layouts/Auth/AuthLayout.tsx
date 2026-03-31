import type { PropsWithChildren, ReactNode } from 'react';

type AuthLayoutProps = PropsWithChildren<{
    title?: string;
    subtitle?: string;
    footer?: ReactNode;
}>;

export default function AuthLayout({
    children,
    title,
    subtitle,
    footer,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            {title || subtitle || footer ? (
                <div className="sr-only">
                    {title ? <h1>{title}</h1> : null}
                    {subtitle ? <p>{subtitle}</p> : null}
                    {footer ? <div>{footer}</div> : null}
                </div>
            ) : null}

            {children}
        </div>
    );
}
