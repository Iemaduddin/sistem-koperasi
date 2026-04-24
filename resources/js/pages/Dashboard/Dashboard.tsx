import { Head, router, Link } from '@inertiajs/react';
import { type ReactElement } from 'react';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { type ChartData, type Stats, groupByOptions } from './types';
import LoanChart from './partials/LoanChart';
import CashChart from './partials/CashChart';
import FloatingSelect from '@/components/floating-input/select';
import StatisticCard from './partials/StatisticCard';
import FloatingInput from '@/components/floating-input/input';
import { LuArrowUp, LuArrowDown } from 'react-icons/lu';

type DashboardProps = {
    stats: Stats;
    charts: ChartData;
    recent_transactions: any[];
};

export default function Dashboard({ stats, charts, recent_transactions }: DashboardProps) {
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

    const getSourceLabel = (tx: any) => {
        const type = tx.sumber_tipe;
        const sumber = tx.sumber;
        if (type === 'simpanan') return `Simpanan ${sumber?.rekening_simpanan?.jenis_simpanan?.nama || ''}`;
        if (type === 'pinjaman') return 'Pinjaman';
        if (type === 'angsuran_pinjaman') return 'Angsuran Pinjaman';
        if (type === 'deposito') return 'Simpanan Deposito';
        return type;
    };

    const getMemberName = (tx: any) => {
        const type = tx.sumber_tipe;
        const sumber = tx.sumber;
        if (type === 'simpanan') return sumber?.rekening_simpanan?.anggota?.nama || '-';
        if (type === 'pinjaman') return sumber?.anggota?.nama || '-';
        if (type === 'angsuran_pinjaman') return sumber?.angsuran?.pinjaman?.anggota?.nama || '-';
        if (type === 'deposito') return sumber?.anggota?.nama || '-';
        return '-';
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
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Aktivitas Terbaru
                    </h2>
                    <Link 
                        href="/riwayat-transaksi" 
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        Lihat Semua
                    </Link>
                </div>
                
                {recent_transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                                    <th className="px-4 py-3 font-semibold">Member</th>
                                    <th className="px-4 py-3 font-semibold">Sumber</th>
                                    <th className="px-4 py-3 font-semibold text-right">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recent_transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700 truncate max-w-[150px]">
                                            {getMemberName(tx)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {getSourceLabel(tx)}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-semibold flex items-center justify-end gap-1 ${tx.jenis === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.jenis === 'masuk' ? <LuArrowUp size={16} /> : <LuArrowDown size={16} />}
                                            {tx.jenis === 'keluar' ? '-' : ''}
                                            {formatCurrency(parseFloat(tx.jumlah))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
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
                    </div>
                )}
            </section>
        </>
    );
}

Dashboard.layout = (page: ReactElement) => (
    <DashboardLayout title="Dashboard">{page}</DashboardLayout>
);
