import { useMemo } from 'react';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { RekeningKoperasiRow } from '../types';
import { LuPen } from 'react-icons/lu';
import { formatCurrency } from '@/utils/general';

type Props = {
    rekening_koperasi: RekeningKoperasiRow[];
    onStartEdit: (item: RekeningKoperasiRow) => void;
};

function formatIndonesianDateTime(value: string): string {
    const date = new Date(value);

    const formattedDate = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);

    const formattedTime = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
        .format(date)
        .replace(':', '.');

    return `${formattedDate}, ${formattedTime}`;
}

export default function RekeningKoperasiTableCard({
    rekening_koperasi,
    onStartEdit,
}: Props) {
    const columns = useMemo<DataTableColumn<RekeningKoperasiRow>[]>(
        () => [
            {
                id: 'nama',
                header: 'Nama',
                accessor: 'nama',
                sortable: true,
                searchable: true,
            },
            {
                id: 'kode',
                header: 'Jenis',
                accessor: 'jenis',
                sortable: true,
                searchable: true,
                render: (row) => (row.jenis === 'bank' ? 'Bank' : 'Tunai'),
            },
            {
                id: 'nomor_rekening',
                header: 'Nomor Rekening',
                accessor: 'nomor_rekening',
                searchable: true,
                render: (row) => row.nomor_rekening ?? '-',
            },
            {
                id: 'saldo',
                header: 'Saldo',
                accessor: 'saldo',
                render: (row) => 'Rp ' + formatCurrency(row.saldo),
            },
            {
                id: 'created_at',
                header: 'Dibuat Pada',
                accessor: 'created_at',
                render: (row) =>
                    row.created_at
                        ? formatIndonesianDateTime(row.created_at)
                        : '',
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="soft"
                            onClick={() => onStartEdit(row)}
                        >
                            <LuPen className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [onStartEdit],
    );

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
                Daftar Rekening Koperasi
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Kelola data rekening koperasi.
            </p>

            <div className="mt-4">
                <DataTable
                    data={rekening_koperasi}
                    columns={columns}
                    getRowId={(row) => row.id}
                    selectable={false}
                    searchPlaceholder="Cari nama, jenis, atau nomor rekening..."
                    emptyMessage="Tidak ada data rekening koperasi ditemukan"
                />
            </div>
        </article>
    );
}
