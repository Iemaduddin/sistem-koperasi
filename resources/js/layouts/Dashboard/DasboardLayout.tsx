import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
    LuChartColumnIncreasing,
    LuCircleDollarSign,
    LuClipboardList,
    LuCreditCard,
    LuFileSpreadsheet,
    LuHandshake,
    LuHouse,
    LuPiggyBank,
    LuUserRound,
    LuUsers,
} from 'react-icons/lu';
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
            name?: string;
            email?: string;
        };
    };
};

export default function DashboardLayout({
    children,
    title = 'Dashboard',
}: DashboardLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<boolean | null>(null);
    const page = usePage<SharedPageProps>();
    const { props, url } = page;

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const savedCollapsed = window.localStorage.getItem(
            'dashboard.sidebar.collapsed',
        );
        const initialCollapsed =
            savedCollapsed === null ? false : savedCollapsed === '1';
        setCollapsed(initialCollapsed);
    }, []);

    useEffect(() => {
        if (collapsed === null) {
            return;
        }

        window.localStorage.setItem(
            'dashboard.sidebar.collapsed',
            collapsed ? '1' : '0',
        );
    }, [collapsed]);

    if (collapsed === null) {
        return null;
    }

    const userName = props.auth?.user?.name ?? 'Administrator';
    const userEmail = props.auth?.user?.email ?? 'admin@koperasi.local';

    const menuSections = useMemo<SidebarSection[]>(
        () => [
            {
                id: 'master-data',
                title: 'Master Data',
                items: [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        href: '/dashboard',
                        icon: LuHouse,
                    },
                    {
                        id: 'anggota',
                        label: 'Anggota',
                        icon: LuUsers,
                        children: [
                            {
                                id: 'anggota-daftar',
                                label: 'Daftar Anggota',
                                href: '/anggota',
                                icon: LuUserRound,
                            },
                            {
                                id: 'anggota-kelompok',
                                label: 'Kelompok Anggota',
                                href: '/anggota/kelompok',
                                icon: LuUsers,
                            },
                        ],
                    },
                ],
            },
            {
                id: 'transaksi',
                title: 'Transaksi',
                items: [
                    {
                        id: 'transaksi',
                        label: 'Transaksi',
                        icon: LuHandshake,
                        children: [
                            {
                                id: 'transaksi-simpanan',
                                label: 'Simpanan',
                                icon: LuPiggyBank,
                                children: [
                                    {
                                        id: 'simpanan-setoran',
                                        label: 'Setoran',
                                        href: '/simpanan/setoran',
                                        icon: LuCreditCard,
                                    },
                                    {
                                        id: 'simpanan-penarikan',
                                        label: 'Penarikan',
                                        href: '/simpanan/penarikan',
                                        icon: LuCircleDollarSign,
                                    },
                                ],
                            },
                            {
                                id: 'transaksi-pinjaman',
                                label: 'Pinjaman',
                                icon: LuClipboardList,
                                children: [
                                    {
                                        id: 'pinjaman-pengajuan',
                                        label: 'Pengajuan',
                                        href: '/pinjaman/pengajuan',
                                        icon: LuFileSpreadsheet,
                                    },
                                    {
                                        id: 'pinjaman-angsuran',
                                        label: 'Angsuran',
                                        href: '/pinjaman/angsuran',
                                        icon: LuChartColumnIncreasing,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                id: 'laporan',
                title: 'Analitik',
                items: [
                    {
                        id: 'laporan',
                        label: 'Laporan',
                        href: '/laporan',
                        icon: LuChartColumnIncreasing,
                    },
                ],
            },
        ],
        [],
    );

    const currentPath = url || '/dashboard';

    return (
        <div className="min-h-dvh overflow-x-hidden bg-slate-100 text-slate-900">
            <Sidebar
                sections={menuSections}
                currentPath={currentPath}
                mobileOpen={mobileOpen}
                collapsed={collapsed}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div
                className={
                    collapsed
                        ? 'relative flex min-h-dvh flex-col lg:ml-20'
                        : 'relative flex min-h-dvh flex-col lg:ml-72'
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

                <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6">
                    {children}
                </main>

                <Footbar />
            </div>
        </div>
    );
}
