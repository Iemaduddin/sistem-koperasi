import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import Button from '@/components/button';
import FloatingSelect from '@/components/floating-input/select';
import { formatRupiah, formatTanggal } from '../Pinjaman/utils';

type ReminderFilter = 'all' | 'week' | '3' | '2' | '1';

type BagiHasilReminderRow = {
    id: number;
    simpanan_deposito_id: string;
    nominal_bagi_hasil: number | string;
    tanggal_perhitungan: string;
    status_pengambilan?: 'belum' | 'sudah';
    hari_tersisa: number;
    simpanan_deposito?: {
        saldo?: number | string;
        tanggal_mulai?: string;
        anggota?: {
            nama?: string | null;
            no_anggota?: string | null;
        };
    };
};

type Props = {
    reminder_bagi_hasil: BagiHasilReminderRow[];
};

const filterOptions: Array<{
    value: ReminderFilter;
    label: string;
    maxDays?: number;
}> = [
    { value: 'all', label: 'Semua' },
    { value: 'week', label: 'H-1 minggu', maxDays: 7 },
    { value: '3', label: 'H-3 hari', maxDays: 3 },
    { value: '2', label: 'H-2 hari', maxDays: 2 },
    { value: '1', label: 'H-1 hari', maxDays: 1 },
];

export default function JatuhTempoDeposito({ reminder_bagi_hasil }: Props) {
    const [activeFilter, setActiveFilter] = useState<ReminderFilter>('2');

    const filteredRows = useMemo(() => {
        return reminder_bagi_hasil.filter((row) => {
            if (activeFilter === 'all') {
                return true;
            }

            const selected = filterOptions.find(
                (item) => item.value === activeFilter,
            );
            const maxDays = selected?.maxDays ?? 0;

            return row.hari_tersisa === maxDays;
        });
    }, [activeFilter, reminder_bagi_hasil]);

    const totalDana = useMemo(
        () =>
            filteredRows.reduce(
                (total, row) => total + (Number(row.nominal_bagi_hasil) || 0),
                0,
            ),
        [filteredRows],
    );

    const depositoColumns = useMemo<DataTableColumn<BagiHasilReminderRow>[]>(
        () => [
            {
                id: 'anggota',
                header: 'Anggota',
                render: (row) => (
                    <div>
                        <p className="font-medium text-neutral-800">
                            {row.simpanan_deposito?.anggota?.nama ?? '-'}
                        </p>
                        <p className="text-xs text-neutral-400">
                            {row.simpanan_deposito?.anggota?.no_anggota ?? '-'}
                        </p>
                    </div>
                ),
                searchable: true,
                searchValue: (row) =>
                    `${row.simpanan_deposito?.anggota?.nama ?? ''} ${row.simpanan_deposito?.anggota?.no_anggota ?? ''}`,
                sortable: true,
                sortValue: (row) => row.simpanan_deposito?.anggota?.nama ?? '',
            },
            {
                id: 'tanggal_mulai',
                header: 'Tanggal Mulai',
                sortable: true,
                render: (row) => (
                    <span className="text-slate-700">
                        {row.simpanan_deposito?.tanggal_mulai
                            ? formatTanggal(row.simpanan_deposito.tanggal_mulai)
                            : '-'}
                    </span>
                ),
                sortValue: (row) => row.simpanan_deposito?.tanggal_mulai ?? '',
            },
            {
                id: 'tanggal_perhitungan',
                header: 'Tanggal Pencairan',
                sortable: true,
                render: (row) => (
                    <span className="font-medium text-emerald-700">
                        {formatTanggal(row.tanggal_perhitungan)}
                    </span>
                ),
                sortValue: (row) => row.tanggal_perhitungan,
            },
            {
                id: 'hari_tersisa',
                header: 'Sisa Hari',
                sortable: true,
                render: (row) => (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        H-{row.hari_tersisa}
                    </span>
                ),
                sortValue: (row) => row.hari_tersisa,
            },
            {
                id: 'nominal_bagi_hasil',
                header: 'Nominal Harus Dicairkan',
                sortable: true,
                render: (row) => (
                    <span className="font-semibold text-slate-900">
                        {formatRupiah(Number(row.nominal_bagi_hasil) || 0)}
                    </span>
                ),
                sortValue: (row) => Number(row.nominal_bagi_hasil) || 0,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: () => (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit('/deposito')}
                    >
                        Detail Deposito
                    </Button>
                ),
                sortable: false,
            },
        ],
        [],
    );

    return (
        <>
            <Head title="Reminder Pencairan Deposito" />

            <div className="space-y-4">
                <header className="rounded-lg bg-white p-6 shadow">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                                Reminder Koperasi
                            </p>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Pencairan Bagi Hasil Deposito Bulanan
                            </h1>
                            <p className="max-w-3xl text-sm text-slate-500">
                                Menampilkan deposito yang jatuh tempo pada bulan
                                ini, beserta sisa hari menuju pencairan dan
                                total dana yang harus dipersiapkan koperasi.
                            </p>
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <p className="text-sm font-medium text-emerald-600 uppercase">
                                Total Dana untuk Pencairan Bagi Hasil
                            </p>
                            <p className="mt-1 text-2xl font-bold text-emerald-900">
                                {formatRupiah(totalDana)}
                            </p>
                        </div>
                    </div>
                </header>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="max-w-xs">
                        <FloatingSelect
                            label="Filter Sisa Hari"
                            value={activeFilter}
                            onValueChange={(value) =>
                                setActiveFilter(value as ReminderFilter)
                            }
                            searchable={false}
                            options={filterOptions.map((option) => ({
                                value: option.value,
                                label: option.label,
                            }))}
                        />
                    </div>

                    <div className="mt-4">
                        <DataTable
                            data={filteredRows}
                            columns={depositoColumns}
                            getRowId={(row) => `deposito-reminder-${row.id}`}
                            selectable={false}
                            searchPlaceholder="Cari nama/no anggota..."
                            emptyMessage="Tidak ada pencairan deposito yang perlu diingat pada periode ini."
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

JatuhTempoDeposito.layout = (page: ReactElement) => (
    <DashboardLayout title="Reminder Pencairan Deposito">
        {page}
    </DashboardLayout>
);
