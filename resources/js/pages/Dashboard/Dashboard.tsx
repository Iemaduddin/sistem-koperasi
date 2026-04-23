import { Head, router } from '@inertiajs/react';
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
        value: number;
        period: string;
    };
    pinjaman_aktif: {
        value: number;
        period: string;
    };
    tagihan_jatuh_tempo: {
        value: number;
        period: string;
    };
    saldo_keluar: {
        value: number;
        period: string;
    };
}

interface ChartData {
    loans: {
        x: string;
        y: number;
    }[];
    cashflow: {
        id: string;
        color: string;
        data: {
            x: string;
            y: number;
        }[];
    }[];
    filters: {
        cash_period: string;
        loan_period: string;
    };
}

const periodOptions = [
    { value: 'hari', label: 'Hari' },
    { value: 'minggu', label: 'Minggu' },
    { value: 'bulan', label: 'Bulan' },
    { value: 'tahun', label: 'Tahun' },
    { value: 'semua', label: 'Semua' },
];

export default function Dashboard({ stats, charts }: { stats: Stats, charts: ChartData }) {
    const [anggotaFilter, setAnggotaFilter] = useState<keyof Stats['anggota']>('aktif');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handlePeriodChange = (type: string, value: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set(`${type}_period`, value);
        
        router.get('/dashboard', Object.fromEntries(params.entries()), {
            preserveState: true,
            preserveScroll: true,
            only: ['stats', 'charts'],
        });
    };

    const anggotaOptions = [
        { value: 'total', label: 'Semua' },
        { value: 'aktif', label: 'Aktif' },
        { value: 'nonaktif', label: 'Non-aktif' },
        { value: 'keluar', label: 'Keluar' },
    ];

    const getPeriodLabel = (period: string) => {
        return periodOptions.find(opt => opt.value === period)?.label || 'Semua';
    };

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
                            value={stats.aset.period}
                            onChange={(val) => handlePeriodChange('aset', val)}
                            options={periodOptions}
                        />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900 truncate">
                        {formatCurrency(stats.aset.value)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Periode: {getPeriodLabel(stats.aset.period)}
                    </p>
                </div>

                {/* Saldo Keluar */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Saldo Keluar</p>
                        <FilterDropdown 
                            value={stats.saldo_keluar.period}
                            onChange={(val) => handlePeriodChange('saldo_keluar', val)}
                            options={periodOptions}
                        />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-blue-600 truncate">
                        {formatCurrency(stats.saldo_keluar.value)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Periode: {getPeriodLabel(stats.saldo_keluar.period)}</p>
                </div>

                {/* Pinjaman Aktif */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Pinjaman Aktif</p>
                        <FilterDropdown 
                            value={stats.pinjaman_aktif.period}
                            onChange={(val) => handlePeriodChange('pinjaman_aktif', val)}
                            options={periodOptions}
                        />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {stats.pinjaman_aktif.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Periode: {getPeriodLabel(stats.pinjaman_aktif.period)}</p>
                </div>

                {/* Tagihan Jatuh Tempo */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Tagihan Jatuh Tempo</p>
                        <FilterDropdown 
                            value={stats.tagihan_jatuh_tempo.period}
                            onChange={(val) => handlePeriodChange('tagihan', val)}
                            options={periodOptions}
                        />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-red-600">
                        {stats.tagihan_jatuh_tempo.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Periode: {getPeriodLabel(stats.tagihan_jatuh_tempo.period)}
                    </p>
                </div>
            </section>


            <section className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Cash Flow Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Grafik Kas</h3>
                            <p className="text-sm text-slate-500">Perbandingan Kas Masuk vs Kas Keluar</p>
                        </div>
                        <FilterDropdown 
                            value={charts.filters.cash_period}
                            onChange={(val) => handlePeriodChange('cash', val)}
                            options={periodOptions}
                        />
                    </div>
                    <CashChart data={charts.cashflow} />
                </div>

                {/* Loan Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Grafik Pinjaman</h3>
                            <p className="text-sm text-slate-500">Total Pencairan Pinjaman</p>
                        </div>
                        <FilterDropdown 
                            value={charts.filters.loan_period}
                            onChange={(val) => handlePeriodChange('loan', val)}
                            options={periodOptions}
                        />
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
