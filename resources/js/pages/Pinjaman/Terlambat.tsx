import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import Button from '@/components/button';
import { formatRupiah, formatTanggal } from './utils';
import type { AngsuranPinjaman } from './types';
import type { SimpananDepositoRow } from '../Deposito/types';

type Props = {
    overdue_angsuran: (AngsuranPinjaman & { hari_terlambat: number; denda_estimasi: number })[];
    overdue_deposito: (SimpananDepositoRow & { hari_terlambat: number })[];
};

export default function PinjamanTerlambat({ overdue_angsuran, overdue_deposito }: Props) {
    const angsuranColumns = useMemo<DataTableColumn<any>[]>(
        () => [
            {
                id: 'anggota',
                header: 'Anggota',
                render: (row) => (
                    <div>
                        <p className="font-medium text-neutral-800">
                            {row.pinjaman?.anggota?.nama ?? '-'}
                        </p>
                        <p className="text-xs text-neutral-400">
                            {row.pinjaman?.anggota?.no_anggota ?? '-'}
                        </p>
                    </div>
                ),
                searchable: true,
                searchValue: (row) =>
                    `${row.pinjaman?.anggota?.nama ?? ''} ${row.pinjaman?.anggota?.no_anggota ?? ''}`,
                sortValue: (row) => row.pinjaman?.anggota?.nama ?? '',
            },
            {
                id: 'angsuran_ke',
                header: 'Ke',
                render: (row) => `Ke-${row.angsuran_ke}`,
                sortValue: (row) => row.angsuran_ke,
            },
            {
                id: 'tanggal_jatuh_tempo',
                header: 'Jatuh Tempo',
                render: (row) => (
                    <span className="text-red-600 font-medium">
                        {formatTanggal(row.tanggal_jatuh_tempo)}
                    </span>
                ),
                sortValue: (row) => row.tanggal_jatuh_tempo,
            },
            {
                id: 'hari_terlambat',
                header: 'Keterlambatan',
                render: (row) => (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        {row.hari_terlambat} Hari
                    </span>
                ),
                sortValue: (row) => row.hari_terlambat ?? 0,
            },
            {
                id: 'tagihan',
                header: 'Tagihan (P+B)',
                render: (row) => formatRupiah(row.total_tagihan),
                sortValue: (row) => row.total_tagihan,
            },
            {
                id: 'denda',
                header: 'Denda (Estimasi)',
                render: (row) => (
                    <span className="text-red-600 font-semibold">
                        {formatRupiah(row.denda_estimasi)}
                    </span>
                ),
                sortValue: (row) => row.denda_estimasi ?? 0,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit(`/pinjaman/${row.pinjaman_id}`)}
                    >
                        Detail Pinjaman
                    </Button>
                ),
                sortable: false,
            },
        ],
        [],
    );

    const depositoColumns = useMemo<DataTableColumn<any>[]>(
        () => [
            {
                id: 'anggota',
                header: 'Anggota',
                render: (row) => (
                    <div>
                        <p className="font-medium text-neutral-800">
                            {row.anggota?.nama ?? '-'}
                        </p>
                        <p className="text-xs text-neutral-400">
                            {row.anggota?.no_anggota ?? '-'}
                        </p>
                    </div>
                ),
                searchable: true,
                searchValue: (row) =>
                    `${row.anggota?.nama ?? ''} ${row.anggota?.no_anggota ?? ''}`,
                sortValue: (row) => row.anggota?.nama ?? '',
            },
            {
                id: 'tanggal_selesai',
                header: 'Tgl. Jatuh Tempo',
                render: (row) => (
                    <span className="text-red-600 font-medium">
                        {formatTanggal(row.tanggal_selesai)}
                    </span>
                ),
                sortValue: (row) => row.tanggal_selesai,
            },
            {
                id: 'hari_terlambat',
                header: 'Keterlambatan',
                render: (row) => (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        {row.hari_terlambat} Hari
                    </span>
                ),
                sortValue: (row) => row.hari_terlambat ?? 0,
            },
            {
                id: 'saldo',
                header: 'Saldo Deposito',
                render: (row) => formatRupiah(row.saldo),
                sortValue: (row) => row.saldo,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit(`/deposito`)}
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
            <Head title="Data Terlambat" />

            <div className="space-y-8">
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Data Terlambat & Jatuh Tempo
                    </h1>
                    <p className="text-slate-500">
                        Menampilkan daftar angsuran dan deposito yang telah melewati tanggal jatuh tempo.
                    </p>
                </header>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-sm">
                                {overdue_angsuran.length}
                            </span>
                            Angsuran Pinjaman Terlambat
                        </h2>
                    </div>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <DataTable
                            data={overdue_angsuran}
                            columns={angsuranColumns}
                            getRowId={(row) => `angsuran-${row.id}`}
                            selectable={false}
                            searchPlaceholder="Cari nama/no anggota..."
                            emptyMessage="Tidak ada angsuran yang terlambat saat ini."
                        />
                    </article>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700 text-sm">
                                {overdue_deposito.length}
                            </span>
                            Deposito Jatuh Tempo
                        </h2>
                    </div>
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <DataTable
                            data={overdue_deposito}
                            columns={depositoColumns}
                            getRowId={(row) => `deposito-${row.id}`}
                            selectable={false}
                            searchPlaceholder="Cari nama/no anggota..."
                            emptyMessage="Tidak ada deposito yang jatuh tempo saat ini."
                        />
                    </article>
                </section>
            </div>
        </>
    );
}

PinjamanTerlambat.layout = (page: ReactElement) => (
    <DashboardLayout title="Data Terlambat">{page}</DashboardLayout>
);
