import { Head, router } from '@inertiajs/react';
import { useState, type ReactElement } from 'react';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { type ChartData, type Stats, periodOptions } from './types';
import LoanChart from './partials/LoanChart';
import CashChart from './partials/CashChart';
import FloatingSelect from '@/components/floating-input/select';
import StatisticCard from './partials/StatisticCard';

type DashboardProps = {
    stats: Stats;
    charts: ChartData;
};

export default function Dashboard({ stats, charts }: DashboardProps) {
    const [periodFilters, setPeriodFilters] = useState({
        cash: charts.filters.cash_period,
        loan: charts.filters.loan_period,
        aset: stats.aset.period,
        saldo_keluar: stats.saldo_keluar.period,
        pinjaman_aktif: stats.pinjaman_aktif.period,
        tagihan: stats.tagihan_jatuh_tempo.period,
    });

    const handlePeriodChange = (
        key: keyof typeof periodFilters,
        value: string,
    ) => {
        const nextFilters = { ...periodFilters, [key]: value };
        setPeriodFilters(nextFilters);

        router.reload({
            data: {
                cash_period: nextFilters.cash,
                loan_period: nextFilters.loan,
                aset_period: nextFilters.aset,
                saldo_keluar_period: nextFilters.saldo_keluar,
                pinjaman_aktif_period: nextFilters.pinjaman_aktif,
                tagihan_period: nextFilters.tagihan,
            },
            only: ['stats', 'charts'],
            preserveUrl: true,
        });
    };

    return (
        <>
            <Head title="Dashboard" />
            <StatisticCard
                stats={stats}
                periodFilters={periodFilters}
                onPeriodChange={handlePeriodChange}
            />
            <section className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Cash Flow Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Grafik Kas
                            </h3>
                            <p className="text-sm text-slate-500">
                                Perbandingan Kas Masuk vs Kas Keluar
                            </p>
                        </div>
                        <FloatingSelect
                            label="Pilih Periode"
                            value={periodFilters.cash}
                            options={periodOptions}
                            onValueChange={(value) =>
                                handlePeriodChange('cash', value)
                            }
                            searchable={false}
                            containerClassName="max-w-32"
                            className="text-xs"
                            size="sm"
                        />
                    </div>
                    <CashChart data={charts.cashflow} />
                </div>

                {/* Loan Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Grafik Pinjaman
                            </h3>
                            <p className="text-sm text-slate-500">
                                Total Pencairan Pinjaman
                            </p>
                        </div>
                        <FloatingSelect
                            label="Pilih Periode"
                            value={periodFilters.loan}
                            options={periodOptions}
                            onValueChange={(value) =>
                                handlePeriodChange('loan', value)
                            }
                            searchable={false}
                            containerClassName="max-w-32 "
                            className="text-xs"
                            size="sm"
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
