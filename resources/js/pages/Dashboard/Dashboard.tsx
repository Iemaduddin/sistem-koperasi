import { Head } from '@inertiajs/react';
import { useState, type ReactElement } from 'react';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';

import LoanChart from '@/Components/Dashboard/LoanChart';
import CashChart from '@/Components/Dashboard/CashChart';
import FilterDropdown from '@/Components/Dashboard/FilterDropdown';

interface Stats {
    anggota: {
        total: number;
        aktif: number;
        nonaktif: number;
        keluar: number;
    };
    aset: {
        all: number;
        bulan_ini: number;
    };
    pinjaman_aktif: number;
    tagihan_jatuh_tempo: {
        all: number;
        bulan_ini: number;
    };
    saldo_keluar: number;
}

interface ChartData {
    loans: {
        month: string;
        total: number;
    }[];
    cashflow: {
        id: string;
        color: string;
        data: {
            x: string;
            y: number;
        }[];
    }[];
}

export default function Dashboard({ stats, charts }: { stats: Stats, charts: ChartData }) {
    const [anggotaFilter, setAnggotaFilter] = useState<keyof Stats['anggota']>('aktif');
    const [asetFilter, setAsetFilter] = useState<keyof Stats['aset']>('all');
    const [tagihanFilter, setTagihanFilter] = useState<keyof Stats['tagihan_jatuh_tempo']>('all');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const anggotaOptions = [
        { value: 'total', label: 'Semua' },
        { value: 'aktif', label: 'Aktif' },
        { value: 'nonaktif', label: 'Non-aktif' },
        { value: 'keluar', label: 'Keluar' },
    ];

    const asetOptions = [
        { value: 'all', label: 'Semua' },
        { value: 'bulan_ini', label: 'Bulan Ini' },
    ];

    const tagihanOptions = [
        { value: 'all', label: 'Semua' },
        { value: 'bulan_ini', label: 'Bulan Ini' },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {/* Total Anggota */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Total Anggota</p>
                        <FilterDropdown 
                            value={anggotaFilter}
                            onChange={(val) => setAnggotaFilter(val as any)}
                            options={anggotaOptions}
                        />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {stats.anggota[anggotaFilter]}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 capitalize">
                        Status: {anggotaFilter === 'total' ? 'Semua' : anggotaFilter}
                    </p>
                </div>

                {/* Aset (Simpanan) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Aset</p>
                        <FilterDropdown 
                            value={asetFilter}
                            onChange={(val) => setAsetFilter(val as any)}
                            options={asetOptions}
                        />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900 truncate">
                        {formatCurrency(stats.aset[asetFilter])}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {asetFilter === 'all' ? 'Saldo kumulatif (Simpanan + Kas)' : 'Total dana masuk (Semua sumber)'}
                    </p>
                </div>

                {/* Saldo Keluar */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Saldo Keluar</p>
                    <p className="mt-2 text-2xl font-bold text-blue-600 truncate">
                        {formatCurrency(stats.saldo_keluar)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Total piutang (Pokok+Bunga+Denda)</p>
                </div>

                {/* Pinjaman Aktif */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Pinjaman Aktif</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {stats.pinjaman_aktif}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Total anggota meminjam</p>
                </div>

                {/* Tagihan Jatuh Tempo */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Tagihan Jatuh Tempo</p>
                        <FilterDropdown 
                            value={tagihanFilter}
                            onChange={(val) => setTagihanFilter(val as any)}
                            options={tagihanOptions}
                        />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-red-600">
                        {stats.tagihan_jatuh_tempo[tagihanFilter]}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {tagihanFilter === 'all' ? 'Total tagihan menunggak' : 'Jatuh tempo bulan ini'}
                    </p>
                </div>
            </section>


            <section className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Cash Flow Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Grafik Kas Bulanan</h3>
                        <p className="text-sm text-slate-500">Perbandingan Kas Masuk vs Kas Keluar</p>
                    </div>
                    <CashChart data={charts.cashflow} />
                </div>

                {/* Loan Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Grafik Pinjaman</h3>
                        <p className="text-sm text-slate-500">Total Pencairan Pinjaman per Bulan</p>
                    </div>
                    <LoanChart data={charts.loans} />
                </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                    Aktivitas Terbaru
                </h2>
                <div className="mt-4 flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-4 rounded-full bg-slate-50 p-4">
                        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900">Belum Ada Aktivitas Terbaru</p>
                    <p className="mt-1 text-xs text-slate-500 max-w-xs">
                        Area ini akan menampilkan riwayat transaksi, notifikasi, dan ringkasan operasional harian koperasi secara real-time.
                    </p>
                </div>
            </section>
        </>
    );
}

Dashboard.layout = (page: ReactElement) => (
    <DashboardLayout title="Dashboard">{page}</DashboardLayout>
);
