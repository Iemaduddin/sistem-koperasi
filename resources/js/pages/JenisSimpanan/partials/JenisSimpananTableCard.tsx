import { useMemo } from 'react';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { JenisSimpananRow } from '../types';
import { LuPen, LuTrash } from 'react-icons/lu';

type Props = {
    jenis_simpanan: JenisSimpananRow[];
    onStartEdit: (item: JenisSimpananRow) => void;
    onRemove: (id: string, nama: string) => void;
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

export default function JenisSimpananTableCard({
    jenis_simpanan,
    onStartEdit,
    onRemove,
}: Props) {
    const columns = useMemo<DataTableColumn<JenisSimpananRow>[]>(
        () => [
            {
                id: 'id',
                header: 'ID',
                accessor: 'id',
                sortable: true,
            },
            {
                id: 'nama',
                header: 'Nama',
                accessor: 'nama',
                sortable: true,
                searchable: true,
            },
            {
                id: 'kode',
                header: 'Kode',
                accessor: 'kode',
                sortable: true,
                searchable: true,
            },
            {
                id: 'terkunci',
                header: 'Terkunci',
                accessor: 'terkunci',
                render: (row) => (row.terkunci ? 'Ya' : 'Tidak'),
            },
            {
                id: 'jumlah_minimal',
                header: 'Jumlah Minimal',
                accessor: 'jumlah_minimal',
                render: (row) =>
                    row.jumlah_minimal !== null
                        ? row.jumlah_minimal.toLocaleString('id-ID')
                        : '-',
            },
            {
                id: 'jumlah_maksimal',
                header: 'Jumlah Maksimal',
                accessor: 'jumlah_maksimal',
                render: (row) =>
                    row.jumlah_maksimal !== null
                        ? row.jumlah_maksimal.toLocaleString('id-ID')
                        : '-',
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
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onRemove(row.id, row.nama)}
                        >
                            <LuTrash className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [onRemove, onStartEdit],
    );

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
                Daftar Jenis Simpanan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Kelola data jenis simpanan.
            </p>

            <div className="mt-4">
                <DataTable
                    data={jenis_simpanan}
                    columns={columns}
                    getRowId={(row) => row.id}
                    selectable={false}
                    searchPlaceholder="Cari nama atau kode jenis simpanan..."
                    emptyMessage="Tidak ada data jenis simpanan ditemukan"
                />
            </div>
        </article>
    );
}
