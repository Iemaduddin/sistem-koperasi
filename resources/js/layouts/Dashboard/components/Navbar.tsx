'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    LuArrowLeft,
    LuArrowRight,
    LuBell,
    LuChevronDown,
    LuLogOut,
    LuPanelLeft,
    LuUser,
    LuX,
} from 'react-icons/lu';
import { toast } from 'react-toastify';

type OpenMenu = 'notification' | 'avatar' | null;

type NavbarProps = {
    title: string;
    userName: string;
    userEmail: string;
    mobileOpen: boolean;
    collapsed: boolean;
    onToggleMobile: () => void;
    onToggleCollapsed: () => void;
};

function getInitialsFromName(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function Navbar({
    title,
    userName,
    userEmail,
    mobileOpen,
    collapsed,
    onToggleMobile,
    onToggleCollapsed,
}: NavbarProps) {
    const { notifications } = usePage<any>().props;
    const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue'>(
        'upcoming',
    );
    const wrapperRef = useRef<HTMLDivElement>(null);
    const initials = useMemo(() => getInitialsFromName(userName), [userName]);
    const currentDate = useMemo(
        () =>
            new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).format(new Date()),
        [],
    );

    const curentTime = useMemo(() => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = (menu: Exclude<OpenMenu, null>) => {
        setOpenMenu((prev) => (prev === menu ? null : menu));
    };
    const iconTriggerClass =
        'h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition hover:bg-blue-100 sm:h-10 sm:w-10';

    const handleSignOut = async () => {
        try {
            router.post('/logout');
        } catch (error) {
            console.error('Error during sign out:', error);
            toast.error('Gagal melakukan logout. Silakan coba lagi.');
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-blue-100 bg-white/95 px-3 backdrop-blur sm:h-16 sm:px-4 lg:h-18 lg:px-6">
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                <div className="hidden items-center sm:flex">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:h-9 sm:w-9"
                        title="Kembali"
                    >
                        <LuArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => window.history.forward()}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:h-9 sm:w-9"
                        title="Maju"
                    >
                        <LuArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                <button
                    type="button"
                    className={`${iconTriggerClass} inline-flex lg:hidden`}
                    onClick={onToggleMobile}
                    aria-label={mobileOpen ? 'Tutup sidebar' : 'Buka sidebar'}
                    title={mobileOpen ? 'Tutup sidebar' : 'Buka sidebar'}
                >
                    {mobileOpen ? (
                        <LuX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                        <LuPanelLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                </button>
                <button
                    type="button"
                    className={`${iconTriggerClass} hidden lg:inline-flex`}
                    onClick={onToggleCollapsed}
                    aria-label={
                        collapsed ? 'Expand sidebar' : 'Collapse sidebar'
                    }
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <LuPanelLeft
                        className={`h-3.5 w-3.5 transition-transform sm:h-4 sm:w-4 ${collapsed ? 'rotate-180' : ''}`}
                    />
                </button>

                <div className="ml-1 sm:ml-2">
                    <p className="truncate text-xs font-semibold text-slate-800 sm:text-sm">
                        {title}
                    </p>
                    <p className="hidden text-xs text-slate-500 md:block lg:text-sm">
                        {currentDate} - {curentTime}
                    </p>
                </div>
            </div>

            <div
                ref={wrapperRef}
                className="relative ml-1 flex shrink-0 items-center gap-2 sm:ml-2 sm:gap-3 lg:gap-4"
            >
                <div className="relative">
                    <button
                        type="button"
                        className={`${iconTriggerClass} relative inline-flex`}
                        onClick={() => toggleMenu('notification')}
                        aria-label="Open notifications"
                    >
                        <LuBell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {notifications?.count > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                                {notifications.count}
                            </span>
                        )}
                    </button>
                    {openMenu === 'notification' && (
                        <div className="absolute right-0 z-20 mt-2 w-72 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200 sm:w-80">
                            <div className="mb-2 flex flex-col gap-2 border-b border-slate-100 px-1 pb-2">
                                <h3 className="px-2 pt-1 text-sm font-bold text-slate-800">
                                    Notifikasi Koperasi
                                </h3>
                                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                                    <button
                                        onClick={() => setActiveTab('upcoming')}
                                        className={`flex-1 rounded-md py-1 text-xs font-semibold transition ${
                                            activeTab === 'upcoming'
                                                ? 'bg-white text-blue-700 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        Mendatang ({notifications?.count || 0})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('overdue')}
                                        className={`flex-1 rounded-md py-1 text-xs font-semibold transition ${
                                            activeTab === 'overdue'
                                                ? 'bg-white text-red-700 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        Terlambat (
                                        {notifications?.overdue_count || 0})
                                    </button>
                                </div>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                {notifications?.[activeTab]?.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {notifications[activeTab].map(
                                            (item: any) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() =>
                                                        router.get(item.url)
                                                    }
                                                    className="group relative flex flex-col gap-1 rounded-xl p-3 text-left transition hover:bg-slate-50"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                {item.type}
                                                            </span>
                                                            <span
                                                                className={`w-fit text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                                    activeTab ===
                                                                    'upcoming'
                                                                        ? 'text-blue-700 bg-blue-100'
                                                                        : 'text-red-700 bg-red-100'
                                                                }`}
                                                            >
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {item.tanggal}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                                                        {item.anggota_nama}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {item.type ===
                                                        'Angsuran'
                                                            ? 'Tagihan: '
                                                            : 'Saldo: '}
                                                        <span className="font-semibold text-slate-700">
                                                            Rp{' '}
                                                            {item.nominal.toLocaleString(
                                                                'id-ID',
                                                            )}
                                                        </span>
                                                    </p>
                                                </button>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                            <LuBell className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            Tidak ada notifikasi{' '}
                                            {activeTab === 'upcoming'
                                                ? 'mendatang'
                                                : 'terlambat'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {((activeTab === 'upcoming' &&
                                notifications.count > 0) ||
                                (activeTab === 'overdue' &&
                                    notifications.overdue_count > 0)) && (
                                <div className="mt-2 border-t border-slate-100 px-1 pt-2">
                                    <button
                                        onClick={() =>
                                            router.get(
                                                activeTab === 'upcoming'
                                                    ? '/riwayat-transaksi'
                                                    : '/pinjaman/terlambat',
                                            )
                                        }
                                        className="w-full rounded-lg py-2 text-center text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                                    >
                                        Lihat Semua Data
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 sm:px-3 sm:text-sm"
                        onClick={() => toggleMenu('avatar')}
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold text-blue-800 sm:h-8 sm:w-8 sm:text-sm">
                                {initials}
                            </span>
                            <div className="hidden flex-col gap-1 text-left md:flex">
                                <span className="text-sm font-semibold text-slate-900">
                                    {userName}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {userEmail}
                                </span>
                            </div>
                        </div>
                        <LuChevronDown
                            className={`h-3.5 w-3.5 transition-transform sm:h-4 sm:w-4 ${openMenu === 'avatar' ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {openMenu === 'avatar' && (
                        <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                            <button
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-700 hover:bg-red-100"
                            >
                                <LuLogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
