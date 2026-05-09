import DataTable, {
    type DataTableColumn,
    type DataTableHeaderGroup,
} from '@/components/data-table';
import { useMemo } from 'react';
import { PageProps } from '../type';

type AnggotaDetailRow = NonNullable<PageProps['anggota_detail_rows']>[number];
type MonthColumn = NonNullable<PageProps['month_columns']>[number];

type Props = {
    anggotaDetailRows: AnggotaDetailRow[];
    monthColumns: MonthColumn[];
    formatCurrency: (value: number | null | undefined) => string;
};

export default function RekapanDetailedTable({
    anggotaDetailRows,
    monthColumns,
    formatCurrency,
}: Props) {
    const columns = useMemo<DataTableColumn<AnggotaDetailRow>[]>(() => {
        const baseColumns: DataTableColumn<AnggotaDetailRow>[] = [
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
                id: 'tanggal_masuk',
                header: 'Tanggal Masuk',
                accessor: 'tanggal_masuk',
                sortable: true,
            },
            {
                id: 'pinjaman',
                header: 'Pinjaman',
                sortable: true,
                sortValue: (row) => row.pinjaman,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.pinjaman),
            },
            {
                id: 'angsuran',
                header: 'Angsuran',
                sortable: true,
                sortValue: (row) => row.angsuran,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.angsuran),
            },
            {
                id: 'tenor',
                header: 'Tenor',
                sortable: true,
                sortValue: (row) => row.tenor,
                cellClassName: 'text-center',
                render: (row) => row.tenor || '-',
            },
            {
                id: 'simpanan_anggota',
                header: 'Anggota',
                sortable: true,
                sortValue: (row) => row.simpanan_awal.anggota,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.simpanan_awal.anggota),
            },
            {
                id: 'simpanan_wajib',
                header: 'Wajib',
                sortable: true,
                sortValue: (row) => row.simpanan_awal.wajib,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.simpanan_awal.wajib),
            },
            {
                id: 'simpanan_sukarela',
                header: 'Sukarela',
                sortable: true,
                sortValue: (row) => row.simpanan_awal.sukarela,
                cellClassName: 'text-right',
                render: (row) => formatCurrency(row.simpanan_awal.sukarela),
            },
        ];

        const monthlyColumns: DataTableColumn<AnggotaDetailRow>[] = [];

        monthColumns.forEach((month) => {
            monthlyColumns.push(
                {
                    id: `${month.key}-angsuran`,
                    header: 'Angsuran',
                    sortable: true,
                    sortValue: (row) =>
                        row.entries_bulanan.find(
                            (detail) => detail.month_key === month.key,
                        )?.angsuran ?? 0,
                    cellClassName: 'text-right',
                    render: (row) => {
                        const entry = row.entries_bulanan.find(
                            (detail) => detail.month_key === month.key,
                        );

                        return formatCurrency(entry?.angsuran);
                    },
                },
                {
                    id: `${month.key}-wajib`,
                    header: 'Wajib',
                    sortable: true,
                    sortValue: (row) =>
                        row.entries_bulanan.find(
                            (detail) => detail.month_key === month.key,
                        )?.wajib ?? 0,
                    cellClassName: 'text-right',
                    render: (row) => {
                        const entry = row.entries_bulanan.find(
                            (detail) => detail.month_key === month.key,
                        );

                        return formatCurrency(entry?.wajib);
                    },
                },
                {
                    id: `${month.key}-sukarela`,
                    header: 'Sukarela',
                    sortable: true,
                    sortValue: (row) =>
                        row.entries_bulanan.find(
                            (detail) => detail.month_key === month.key,
                        )?.sukarela ?? 0,
                    cellClassName: 'text-right',
                    render: (row) => {
                        const entry = row.entries_bulanan.find(
                            (detail) => detail.month_key === month.key,
                        );

                        return formatCurrency(entry?.sukarela);
                    },
                },
            );
        });

        return [...baseColumns, ...monthlyColumns];
    }, [formatCurrency, monthColumns]);

    const headerGroups = useMemo<DataTableHeaderGroup[]>(() => {
        const groups: DataTableHeaderGroup[] = [
            {
                id: 'daftar',
                label: 'Daftar',
                columnIds: [
                    'simpanan_anggota',
                    'simpanan_wajib',
                    'simpanan_sukarela',
                ],
            },
        ];

        monthColumns.forEach((month) => {
            groups.push({
                id: `group-${month.key}`,
                label: month.label,
                columnIds: [
                    `${month.key}-angsuran`,
                    `${month.key}-wajib`,
                    `${month.key}-sukarela`,
                ],
            });
        });

        return groups;
    }, [monthColumns]);

    return (
        <div className="mt-4">
            <DataTable
                data={anggotaDetailRows}
                columns={columns}
                getRowId={(row) => row.id}
                selectable={false}
                initialPageSize={20}
                searchPlaceholder="Cari Nomor/Nama Anggota"
                emptyMessage="Belum ada data rekapan detail per bulan."
                headerGroups={headerGroups}
                stickyHeader
                stickyColumnCount={2}
                tableContainerClassName="max-h-[70vh]"
            />
        </div>
    );
}
