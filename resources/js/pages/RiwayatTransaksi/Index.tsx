import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { ReactElement, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import RiwayatTransaksiFiltersCard from './partials/RiwayatTransaksiFiltersCard';
import RiwayatTransaksiTableCard from './partials/RiwayatTransaksiTableCard';
import { type FilterState, type TransactionRow } from './types';

interface Props {
    transactions: TransactionRow[];
}

export default function RiwayatTransaksiIndex({ transactions }: Props) {
    const [filters, setFilters] = useState<FilterState>({
        jenis: 'all',
        sumber: 'all',
        startDate: '',
        endDate: '',
    });

    const filteredTransactions = useMemo(() => {
        const normalizedStart = filters.startDate
            ? new Date(`${filters.startDate}T00:00:00`)
            : null;
        const normalizedEnd = filters.endDate
            ? new Date(`${filters.endDate}T23:59:59.999`)
            : null;

        return transactions.filter((transaction) => {
            if (
                filters.jenis !== 'all' &&
                transaction.jenis !== filters.jenis
            ) {
                return false;
            }

            if (filters.sumber !== 'all') {
                const sourceLabel = transaction.source_label.toLowerCase();

                if (filters.sumber === 'tabungan') {
                    if (
                        transaction.sumber_tipe !== 'simpanan' ||
                        !sourceLabel.includes('tabungan')
                    ) {
                        return false;
                    }
                } else if (filters.sumber === 'simpanan_lainnya') {
                    if (
                        transaction.sumber_tipe !== 'simpanan' ||
                        sourceLabel.includes('tabungan')
                    ) {
                        return false;
                    }
                } else if (transaction.sumber_tipe !== filters.sumber) {
                    return false;
                }
            }

            const transactionDate = new Date(transaction.created_at);

            if (normalizedStart && transactionDate < normalizedStart) {
                return false;
            }

            if (normalizedEnd && transactionDate > normalizedEnd) {
                return false;
            }

            return true;
        });
    }, [
        filters.endDate,
        filters.jenis,
        filters.sumber,
        filters.startDate,
        transactions,
    ]);

    return (
        <div className="space-y-6">
            <Head title="Riwayat Transaksi" />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Riwayat Transaksi
                    </h1>
                    <p className="text-slate-500">
                        Pantau semua arus kas masuk dan keluar koperasi.
                    </p>
                </div>
            </div>

            <RiwayatTransaksiFiltersCard
                filters={filters}
                onJenisChange={(value) =>
                    setFilters((prev: FilterState) => ({
                        ...prev,
                        jenis: value,
                    }))
                }
                onSumberChange={(value) =>
                    setFilters((prev: FilterState) => ({
                        ...prev,
                        sumber: value,
                    }))
                }
                onStartDateChange={(value) =>
                    setFilters((prev: FilterState) => ({
                        ...prev,
                        startDate: value,
                    }))
                }
                onEndDateChange={(value) =>
                    setFilters((prev: FilterState) => ({
                        ...prev,
                        endDate: value,
                    }))
                }
                onReset={() =>
                    setFilters({
                        jenis: 'all',
                        sumber: 'all',
                        startDate: '',
                        endDate: '',
                    })
                }
            />

            <RiwayatTransaksiTableCard transactions={filteredTransactions} />
        </div>
    );
}

RiwayatTransaksiIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Riwayat Transaksi">{page}</DashboardLayout>
);
