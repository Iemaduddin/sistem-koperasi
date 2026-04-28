import { useMemo } from 'react';
import { router } from '@inertiajs/react';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { PinjamanRow } from '../types';
import {
    formatRupiah,
    formatTanggal,
    getLabelStatusPinjaman,
    hitungProgressPersen,
    hitungSisaAngsuran,
} from '../utils';

type Props = {
    rows: PinjamanRow[];
    onRequestDelete: (row: PinjamanRow) => void;
};

export default function PinjamanTableCard({ rows, onRequestDelete }: Props) {
    const columns = useMemo<DataTableColumn<PinjamanRow>[]>(
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
                sortable: true,
                sortValue: (row) => row.anggota?.nama ?? '',
            },
            {
                id: 'jumlah_pinjaman',
                header: 'Jumlah Pinjaman',
                sortable: true,
                render: (row) => formatRupiah(row.jumlah_pinjaman),
                sortValue: (row) => row.jumlah_pinjaman,
            },
            {
                id: 'jumlah_angsuran',
                header: 'Angsuran/Bulan',
                sortable: true,
                render: (row) => formatRupiah(row.jumlah_angsuran),
                sortValue: (row) => row.jumlah_angsuran,
            },
            {
                id: 'tenor_bulan',
                header: 'Tenor',
                sortable: true,
                render: (row) => `${row.tenor_bulan} bln`,
                sortValue: (row) => row.tenor_bulan,
            },
            {
                id: 'tanggal_mulai',
                header: 'Tgl. Mulai',
                sortable: true,
                render: (row) => formatTanggal(row.tanggal_mulai),
                sortValue: (row) => row.tanggal_mulai,
            },
            {
                id: 'progress',
                header: 'Progress',
                sortable: true,
                render: (row) => {
                    const progress = hitungProgressPersen(row);
                    const sisaAngsuran = hitungSisaAngsuran(row);

                    return (
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
                                <div
                                    className="h-full rounded-full bg-green-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-xs whitespace-nowrap text-neutral-500">
                                {progress}% ({sisaAngsuran} sisa)
                            </span>
                        </div>
                    );
                },
                sortable: true,
                sortValue: (row) => hitungProgressPersen(row),
            },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                render: (row) => {
                    const statusClass =
                        row.status === 'lunas'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700';

                    return (
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                        >
                            {getLabelStatusPinjaman(row.status)}
                        </span>
                    );
                },
                sortValue: (row) => row.status,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(`/pinjaman/${row.id}`)}
                        >
                            Detail
                        </Button>
                        {row.status === 'aktif' && (
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => onRequestDelete(row)}
                            >
                                Hapus
                            </Button>
                        )}
                    </div>
                ),
                sortable: false,
            },
        ],
        [onRequestDelete],
    );

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
                Daftar Pinjaman
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Total {rows.length} pinjaman terdaftar.
            </p>

            <div className="mt-4">
                <DataTable
                    data={rows}
                    columns={columns}
                    getRowId={(row) => String(row.id)}
                    selectable={false}
                    searchPlaceholder="Cari nama/no anggota..."
                    emptyMessage="Belum ada data pinjaman."
                />
            </div>
        </article>
    );
}
