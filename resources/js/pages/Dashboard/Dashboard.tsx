import { Head, router } from '@inertiajs/react';
import { type ReactElement } from 'react';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { type ChartData, type Stats, groupByOptions } from './types';
import LoanChart from './partials/LoanChart';
import CashChart from './partials/CashChart';
import FloatingSelect from '@/components/floating-input/select';
import StatisticCard from './partials/StatisticCard';
import FloatingInput from '@/components/floating-input/input';

type DashboardProps = {
    stats: Stats;
    charts: ChartData;
};

export default function Dashboard({ stats, charts }: DashboardProps) {
    const filters = charts.filters;

    const handleFilterChange = (
        key: keyof typeof filters,
        value: string,
    ) => {
        const nextFilters = { ...filters, [key]: value };

        router.reload({
            data: {
                start_date: nextFilters.start_date,
                end_date: nextFilters.end_date,
                group_by: nextFilters.group_by,
            },
            only: ['stats', 'charts'],
            preserveUrl: true,
            preserveState: true,
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <>
            <Head title="Dashboard" />
            
            {/* Global Filter Bar */}
            <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-48">
                        <FloatingSelect
                            label="Grup Data"
                            value={filters.group_by}
                            options={groupByOptions}
                            onValueChange={(value) => handleFilterChange('group_by', value)}
                            searchable={false}
                        />
                    </div>
                    {filters.group_by !== 'all' && (
                        <>
                            <div className="flex-1 min-w-[200px]">
                                <FloatingInput
                                    label="Tanggal Mulai"
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <FloatingInput
                                    label="Tanggal Selesai"
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </section>

            <div className="mb-6">
                <StatisticCard stats={stats} />
            </div>

            <section className="grid gap-6 lg:grid-cols-2">
                {/* Cash Flow Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Grafik Kas
                        </h3>
                        <p className="text-sm text-slate-500">
                            Perbandingan Kas Masuk vs Kas Keluar
                        </p>
                    </div>
                    <CashChart data={charts.cashflow} />
                </div>

                {/* Loan Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Grafik Pinjaman
                        </h3>
                        <p className="text-sm text-slate-500">
                            Total Pencairan Pinjaman
                        </p>
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
                        <svg
                            className="h-8 w-8 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                        Belum Ada Aktivitas Terbaru
                    </p>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">
                        Area ini akan menampilkan riwayat transaksi, notifikasi,
                        dan ringkasan operasional harian koperasi secara
                        real-time.
                    </p>
                </div>
            </section>
        </>
    );
}

Dashboard.layout = (page: ReactElement) => (
    <DashboardLayout title="Dashboard">{page}</DashboardLayout>
);
