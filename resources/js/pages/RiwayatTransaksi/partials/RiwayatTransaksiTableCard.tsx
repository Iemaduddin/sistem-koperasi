import { useMemo } from 'react';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { TransactionRow } from '../types';
import { getTransactionDate } from '../helpers';

type Props = {
    transactions: TransactionRow[];
};

export default function RiwayatTransaksiTableCard({ transactions }: Props) {
    const columns = useMemo<DataTableColumn<TransactionRow>[]>(
        () => [
            {
                id: 'tanggal',
                header: 'Tanggal',
                sortable: true,
                sortValue: (row) => getTransactionDate(row),
                searchable: true,
                searchValue: (row) =>
                    getTransactionDate(row).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    }),
                render: (row) => {
                    const date = getTransactionDate(row);
                    const hasTime =
                        date.getHours() !== 0 || date.getMinutes() !== 0;

                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-700">
                                {date.toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                            {hasTime && (
                                <span className="text-xs text-slate-400">
                                    {date.toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'jenis',
                header: 'Jenis',
                sortable: true,
                accessor: 'jenis',
                searchable: true,
                searchValue: (row) =>
                    row.jenis === 'masuk' ? 'Masuk' : 'Keluar',
                render: (row) => (
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            row.jenis === 'masuk'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                        }`}
                    >
                        {row.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
                    </span>
                ),
            },
            {
                id: 'sumber',
                header: 'Sumber',
                sortable: true,
                searchable: true,
                searchValue: (row) => row.source_label,
                render: (row) => (
                    <span className="text-slate-600">{row.source_label}</span>
                ),
            },
            {
                id: 'anggota',
                header: 'Anggota',
                sortable: true,
                searchable: true,
                searchValue: (row) => row.member_name,
                render: (row) => (
                    <span className="font-medium text-slate-700">
                        {row.member_name}
                    </span>
                ),
            },
            {
                id: 'keterangan',
                header: 'Keterangan',
                searchable: true,
                searchValue: (row) => row.keterangan ?? '',
                render: (row) => (
                    <p
                        className="max-w-xs truncate text-slate-500"
                        title={row.keterangan ?? undefined}
                    >
                        {row.keterangan || '-'}
                    </p>
                ),
            },
            {
                id: 'jumlah',
                header: 'Jumlah',
                headerClassName: 'text-right',
                cellClassName: 'text-right',
                sortable: true,
                sortValue: (row) => Number(row.jumlah),
                searchable: true,
                searchValue: (row) => String(row.jumlah),
                render: (row) => (
                    <span
                        className={`font-semibold ${
                            row.jenis === 'masuk'
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                        }`}
                    >
                        {row.jenis === 'keluar' ? '-' : ''}
                        Rp {Number(row.jumlah).toLocaleString('id-ID')}
                    </span>
                ),
            },
        ],
        [],
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <DataTable
                data={transactions}
                columns={columns}
                getRowId={(row) => row.id}
                selectable={false}
                searchable
                searchPlaceholder="Cari transaksi"
                emptyMessage="Tidak ada riwayat transaksi yang ditemukan."
            />
        </div>
    );
}
