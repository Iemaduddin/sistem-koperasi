import DataTable, { type DataTableColumn } from '@/components/data-table';
import { useMemo } from 'react';
import { PageProps } from '../type';

type AnggotaListItem = NonNullable<PageProps['anggota_list']>[number];

type Props = {
    anggotaList: AnggotaListItem[];
    formatCurrency: (value: number | null | undefined) => string;
};

export default function RekapanSummaryTable({
    anggotaList,
    formatCurrency,
}: Props) {
    const columns = useMemo<DataTableColumn<AnggotaListItem>[]>(
        () => [
            {
                id: 'no_anggota',
                header: 'Nomor',
                accessor: 'no_anggota',
                sortable: true,
                searchable: true,
            },
            {
                id: 'nama',
                header: 'Nama',
                accessor: 'nama',
                sortable: true,
                searchable: true,
            },
            {
                id: 'simpanan_pokok',
                header: 'Tabungan Pokok',
                sortable: true,
                sortValue: (row) => row.simpanan_pokok,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.simpanan_pokok),
            },
            {
                id: 'simpanan_wajib',
                header: 'Tabungan Wajib',
                sortable: true,
                sortValue: (row) => row.simpanan_wajib,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.simpanan_wajib),
            },
            {
                id: 'simpanan_sukarela',
                header: 'Tabungan Sukarela',
                sortable: true,
                sortValue: (row) => row.simpanan_sukarela,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.simpanan_sukarela),
            },
            {
                id: 'pinjaman_pokok',
                header: 'Pinjaman Pokok',
                sortable: true,
                sortValue: (row) => row.pinjaman_pokok,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.pinjaman_pokok),
            },
            {
                id: 'pinjaman_total',
                header: 'Pinjaman Total',
                sortable: true,
                sortValue: (row) => row.pinjaman_total,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.pinjaman_total),
            },
            {
                id: 'angsuran_terbayar',
                header: 'Terbayar',
                sortable: true,
                sortValue: (row) => row.angsuran_terbayar,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.angsuran_terbayar),
            },
            {
                id: 'sisa_pinjaman',
                header: 'Sisa',
                sortable: true,
                sortValue: (row) => row.sisa_pinjaman,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.sisa_pinjaman),
            },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => row.status,
                render: (row) => (
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.status === 'AKTIF'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                        }`}
                    >
                        {row.status}
                    </span>
                ),
            },
        ],
        [formatCurrency],
    );

    return (
        <div className="mt-4">
            <DataTable
                data={anggotaList}
                columns={columns}
                getRowId={(row) => row.id}
                selectable={false}
                initialPageSize={20}
                searchPlaceholder="Cari nomor/nama anggota..."
                emptyMessage="Belum ada data rekapan anggota."
            />
        </div>
    );
}
