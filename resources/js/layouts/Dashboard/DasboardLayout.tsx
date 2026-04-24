import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ToastContainer, toast } from 'react-toastify';

import Footbar from './components/Footbar';
import Navbar from './components/Navbar';
import Sidebar, { type SidebarSection } from './components/Sidebar';

type DashboardLayoutProps = PropsWithChildren<{
    title?: string;
}>;

type SharedPageProps = {
    url: string;
    auth?: {
        user?: {
            id?: string;
            name?: string;
            email?: string;
            roles?: string[];
        };
    };
    flash?: {
        success?: string;
        error?: string;
    };
    notifications: {
        count: number;
        list: Array<{
            id: string;
            anggota_nama: string;
            tanggal_jatuh_tempo: string;
            total_tagihan: number;
            label: string;
        }>;
    };
};

export default function DashboardLayout({
    children,
    title = 'Dashboard',
}: DashboardLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        const savedCollapsed = window.localStorage.getItem(
            'dashboard.sidebar.collapsed',
        );

        return savedCollapsed === '1';
    });
    const page = usePage<SharedPageProps>();
    const { props, url } = page;

    useEffect(() => {
        window.localStorage.setItem(
            'dashboard.sidebar.collapsed',
            collapsed ? '1' : '0',
        );
    }, [collapsed]);

    useEffect(() => {
        const unsubscribe = router.on('success', (event) => {
            const nextProps = event.detail.page.props as unknown as Pick<
                SharedPageProps,
                'flash'
            >;

            if (nextProps.flash?.success) {
                toast.success(nextProps.flash.success);
            }

            if (nextProps.flash?.error) {
                toast.error(nextProps.flash.error);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const userName = props.auth?.user?.name ?? 'Administrator';
    const userEmail = props.auth?.user?.email ?? 'admin@koperasi.local';
    const userRoles = props.auth?.user?.roles ?? [];

    const currentPath = url || '/dashboard';

    return (
        <div className="h-dvh overflow-hidden bg-slate-100 text-slate-900">
            <ToastContainer position="top-right" autoClose={3000} />
            <Sidebar
                currentPath={currentPath}
                mobileOpen={mobileOpen}
                collapsed={collapsed}
                userRoles={userRoles}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div
                className={
                    collapsed
                        ? 'relative flex h-dvh flex-col lg:ml-20'
                        : 'relative flex h-dvh flex-col lg:ml-72'
                }
            >
                <Navbar
                    title={title}
                    userName={userName}
                    userEmail={userEmail}
                    mobileOpen={mobileOpen}
                    collapsed={collapsed}
                    onToggleMobile={() => setMobileOpen((value) => !value)}
                    onToggleCollapsed={() => setCollapsed((value) => !value)}
                />

                <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
                    {children}
                </main>

                <Footbar />
            </div>
        </div>
    );
}
