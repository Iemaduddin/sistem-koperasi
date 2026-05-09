'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { LuBell } from 'react-icons/lu';

type NotificationItem = {
    id: string;
    type: string;
    anggota_nama: string;
    tanggal: string;
    nominal: number;
    label: string;
    url: string;
};

type DepositoReminderItem = {
    id: number;
    simpanan_deposito_id: string;
    nominal_bagi_hasil: number | string;
    tanggal_perhitungan: string;
    status_pengambilan?: 'belum' | 'sudah';
    hari_tersisa: number;
    title: string;
    simpanan_deposito?: {
        saldo?: number | string;
        tanggal_mulai?: string;
        anggota?: {
            nama?: string | null;
            no_anggota?: string | null;
        };
    };
};

type NavbarNotifications = {
    count: number;
    angsuran?: {
        count: number;
        overdue_count: number;
        upcoming_count: number;
        overdue: NotificationItem[];
        upcoming: NotificationItem[];
    };
    deposito?: {
        count: number;
        reminders: DepositoReminderItem[];
    };
};

type NotificationMenuProps = {
    notifications?: NavbarNotifications;
    isOpen: boolean;
    onClose: () => void;
};

type NotificationBellProps = {
    notifications?: NavbarNotifications;
    iconTriggerClass: string;
};

// Utility function
function formatBadgeCount(value: number): string {
    return value > 99 ? '99+' : value.toString();
}

export function NotificationMenu({
    notifications,
    isOpen,
    onClose,
}: NotificationMenuProps) {
    const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming'>(
        'overdue',
    );
    const [activeDepositoTab, setActiveDepositoTab] = useState<'2' | '1'>('2');
    const [activeGlobalTab, setActiveGlobalTab] = useState<
        'angsuran' | 'deposito'
    >('angsuran');

    const angsuranNotifications = notifications?.angsuran ?? {
        count: 0,
        overdue_count: 0,
        upcoming_count: 0,
        overdue: [],
        upcoming: [],
    };
    const depositoNotifications = notifications?.deposito ?? {
        count: 0,
        reminders: [],
    };

    const activeDepositoItems = useMemo(
        () =>
            depositoNotifications.reminders.filter((item) => {
                if (activeDepositoTab === '2') {
                    return item.hari_tersisa === 2;
                }
                return item.hari_tersisa === 1;
            }),
        [activeDepositoTab, depositoNotifications.reminders],
    );

    const depositoH1Count = useMemo(
        () =>
            depositoNotifications.reminders.filter(
                (item) => item.hari_tersisa === 1,
            ).length,
        [depositoNotifications.reminders],
    );

    const depositoH2Count = useMemo(
        () =>
            depositoNotifications.reminders.filter(
                (item) => item.hari_tersisa === 2,
            ).length,
        [depositoNotifications.reminders],
    );

    const activeAngsuranItems =
        activeTab === 'overdue'
            ? angsuranNotifications.overdue
            : angsuranNotifications.upcoming;

    const depositoTotalCount = depositoNotifications.reminders.length;

    if (!isOpen) return null;

    return (
        <div className="fixed top-16 right-2 left-2 z-20 origin-top rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200 sm:right-4 sm:left-4 lg:absolute lg:top-auto lg:right-0 lg:left-auto lg:w-4xl lg:origin-top-right lg:translate-x-0">
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 px-1 pb-2">
                <div>
                    <h3 className="px-2 pt-1 text-lg font-bold text-slate-800">
                        Notifikasi Koperasi
                    </h3>
                    <p className="px-2 text-xs text-slate-500 md:text-sm">
                        Angsuran pinjaman dan reminder tabungan berjangka
                    </p>
                </div>
            </div>

            <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1 lg:hidden">
                <button
                    type="button"
                    onClick={() => setActiveGlobalTab('angsuran')}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        activeGlobalTab === 'angsuran'
                            ? 'bg-white text-red-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Angsuran
                </button>
                <button
                    type="button"
                    onClick={() => setActiveGlobalTab('deposito')}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        activeGlobalTab === 'deposito'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Tabungan Berjangka
                </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-1 pb-1">
                <div className="grid gap-3 lg:grid-cols-2">
                    {/* Angsuran Section */}
                    <section
                        className={`${activeGlobalTab === 'angsuran' ? 'block' : 'hidden'} rounded-2xl border border-red-100 bg-red-50/40 p-2 sm:p-3 lg:block`}
                    >
                        <div className="mb-3 flex items-center justify-between gap-2 px-1">
                            <div>
                                <p className="text-sm font-semibold tracking-wide text-red-700 md:text-lg">
                                    Angsuran Pinjaman
                                </p>
                                <p className="text-xs text-slate-500 md:text-sm">
                                    Terlambat dan jatuh tempo bulan ini
                                </p>
                            </div>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-100 md:text-sm">
                                {angsuranNotifications.count} data
                            </span>
                        </div>

                        <div className="mb-3 flex gap-1 rounded-xl bg-red-100 p-1 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setActiveTab('overdue')}
                                className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition sm:text-sm ${
                                    activeTab === 'overdue'
                                        ? 'bg-white text-red-700 shadow-sm'
                                        : 'text-red-700/70 hover:text-red-700'
                                }`}
                            >
                                Terlambat ({angsuranNotifications.overdue_count}
                                )
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('upcoming')}
                                className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition sm:text-sm ${
                                    activeTab === 'upcoming'
                                        ? 'bg-white text-amber-700 shadow-sm'
                                        : 'text-amber-700/70 hover:text-amber-700'
                                }`}
                            >
                                Jatuh Tempo (
                                {angsuranNotifications.upcoming_count})
                            </button>
                        </div>

                        {activeAngsuranItems.slice(0, 10).length > 0 ? (
                            <div className="space-y-1.5">
                                {activeAngsuranItems
                                    .slice(0, 10)
                                    .map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => router.get(item.url)}
                                            className={`group flex w-full flex-col gap-1 rounded-xl p-3 text-left transition sm:p-3.5 ${
                                                activeTab === 'overdue'
                                                    ? 'hover:bg-red-50'
                                                    : 'hover:bg-amber-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex min-w-0 flex-col gap-0.5">
                                                    <span
                                                        className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider md:text-xs ${
                                                            activeTab ===
                                                            'overdue'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-medium text-slate-400">
                                                    {item.tanggal}
                                                </span>
                                            </div>
                                            <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                                                {item.anggota_nama}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Tagihan:{' '}
                                                <span className="font-semibold text-slate-700">
                                                    Rp{' '}
                                                    {item.nominal.toLocaleString(
                                                        'id-ID',
                                                    )}
                                                </span>
                                            </p>
                                        </button>
                                    ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center">
                                <p className="text-xs text-slate-500 sm:text-sm">
                                    Tidak ada data pada tab ini.
                                </p>
                            </div>
                        )}

                        <div className="mt-2 border-t border-red-100 px-1 pt-2">
                            <button
                                onClick={() => router.get('/pinjaman/angsuran')}
                                className="w-full rounded-lg py-2 text-center text-xs font-semibold text-red-700 transition hover:bg-red-50 sm:text-sm"
                            >
                                Lihat Semua Angsuran
                            </button>
                        </div>
                    </section>

                    {/* Deposito Section */}
                    <section
                        className={`${activeGlobalTab === 'deposito' ? 'block' : 'hidden'} rounded-2xl border border-emerald-100 bg-emerald-50/40 p-2 sm:p-3 lg:block`}
                    >
                        <div className="mb-2 flex items-start justify-between gap-2 px-1">
                            <div>
                                <p className="text-sm font-semibold tracking-wide text-emerald-700 sm:text-lg">
                                    Tabungan Berjangka
                                </p>
                                <p className="text-xs text-slate-500 md:text-sm">
                                    Pencairan bagi hasil 1-2 hari lagi
                                </p>
                            </div>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 md:text-sm">
                                {depositoTotalCount} data
                            </span>
                        </div>

                        <div className="mb-3 flex gap-1 rounded-xl bg-emerald-100 p-1 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setActiveDepositoTab('2')}
                                className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition sm:text-sm ${
                                    activeDepositoTab === '2'
                                        ? 'bg-white text-emerald-700 shadow-sm'
                                        : 'text-emerald-700/70 hover:text-emerald-700'
                                }`}
                            >
                                2 hari lagi ({depositoH2Count})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveDepositoTab('1')}
                                className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition sm:text-sm ${
                                    activeDepositoTab === '1'
                                        ? 'bg-white text-emerald-700 shadow-sm'
                                        : 'text-emerald-700/70 hover:text-emerald-700'
                                }`}
                            >
                                1 hari lagi ({depositoH1Count})
                            </button>
                        </div>

                        {activeDepositoItems.slice(0, 10).length > 0 ? (
                            <div className="space-y-1.5">
                                {activeDepositoItems
                                    .slice(0, 10)
                                    .map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() =>
                                                router.get(
                                                    '/deposito/bagi-hasil',
                                                )
                                            }
                                            className="group flex w-full flex-col gap-1 rounded-xl p-3 text-left transition hover:bg-emerald-50 sm:p-3.5"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex min-w-0 flex-col gap-0.5">
                                                    <span className="w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 md:text-xs">
                                                        {item.title}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-medium text-slate-400">
                                                    {item.tanggal_perhitungan}
                                                </span>
                                            </div>
                                            <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                                                {item.simpanan_deposito?.anggota
                                                    ?.nama ?? '-'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Saldo:{' '}
                                                <span className="font-semibold text-slate-700">
                                                    Rp{' '}
                                                    {Number(
                                                        item.simpanan_deposito
                                                            ?.saldo ?? 0,
                                                    ).toLocaleString('id-ID')}
                                                </span>
                                            </p>
                                        </button>
                                    ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center">
                                <p className="text-xs text-slate-500 sm:text-sm">
                                    Tidak ada reminder pada tab ini.
                                </p>
                            </div>
                        )}

                        <div className="mt-2 border-t border-emerald-100 px-1 pt-2">
                            <button
                                onClick={() =>
                                    router.get('/deposito/bagi-hasil')
                                }
                                className="w-full rounded-lg py-2 text-center text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:text-sm"
                            >
                                Lihat Reminder Tabungan Berjangka
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export function NotificationBell({
    notifications,
    iconTriggerClass,
}: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                className={`${iconTriggerClass} relative inline-flex`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Open notifications"
            >
                <LuBell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {(notifications?.count ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-1 ring-white md:-right-4 md:px-4 md:text-xs">
                        {formatBadgeCount(notifications?.count ?? 0)}
                    </span>
                )}
            </button>
            <NotificationMenu
                notifications={notifications}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
}

export type { NotificationItem, DepositoReminderItem, NavbarNotifications };
export { formatBadgeCount };
