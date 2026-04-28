import { useMemo } from 'react';
import { LuEye } from 'react-icons/lu';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { AnggotaNominalRow } from '../types';
import { buildAmountLabel } from '../utils';

type Props = {
    data: AnggotaNominalRow[];
    onSelectAnggota: (row: AnggotaNominalRow) => void;
    onRequestTarik: (payload: {
        anggotaId: string;
        anggotaLabel: string;
        maxTarikSukarela: number;
    }) => void;
};

export default function SimpananTableNominalSection({
    data,
    onSelectAnggota,
    onRequestTarik,
}: Props) {
    const columns = useMemo<DataTableColumn<AnggotaNominalRow>[]>(
        () => [
            {
                id: 'no_anggota',
                header: 'No. Anggota',
                accessor: 'no_anggota',
                searchable: true,
                sortable: true,
            },
            {
                id: 'nama',
                header: 'Nama Anggota',
                accessor: 'nama',
                searchable: true,
                sortable: true,
            },
            {
                id: 'pokok',
                header: 'Nominal Pokok',
                sortable: true,
                render: (row) => buildAmountLabel(row.pokok),
                sortValue: (row) => row.pokok,
            },
            {
                id: 'wajib',
                header: 'Nominal Wajib',
                sortable: true,
                render: (row) => buildAmountLabel(row.wajib),
                sortValue: (row) => row.wajib,
            },
            {
                id: 'sukarela',
                header: 'Nominal Sukarela',
                sortable: true,
                render: (row) => buildAmountLabel(row.sukarela),
                sortValue: (row) => row.sukarela,
            },
            {
                id: 'total',
                header: 'Total Simpanan',
                sortable: true,
                render: (row) => (
                    <span className="font-semibold text-slate-900">
                        {buildAmountLabel(row.total)}
                    </span>
                ),
                sortValue: (row) => row.total,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="info"
                            onClick={() => onSelectAnggota(row)}
                            leftIcon={<LuEye className="h-4 w-4" />}
                        >
                            Lihat Transaksi
                        </Button>
                        <Button
                            size="sm"
                            variant="warning"
                            disabled={!row.anggota_id || row.sukarela <= 0}
                            onClick={() => {
                                if (!row.anggota_id || row.sukarela <= 0) {
                                    return;
                                }

                                onRequestTarik({
                                    anggotaId: row.anggota_id,
                                    anggotaLabel: `${row.no_anggota} - ${row.nama}`,
                                    maxTarikSukarela: row.sukarela,
                                });
                            }}
                        >
                            Tarik Sukarela
                        </Button>
                    </div>
                ),
            },
        ],
        [onRequestTarik, onSelectAnggota],
    );

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
                Ringkasan Simpanan Per Anggota
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Menampilkan posisi nominal simpanan pokok, wajib, sukarela, dan
                total per anggota.
            </p>

            <div className="mt-4">
                <DataTable
                    data={data}
                    columns={columns}
                    getRowId={(row) => row.id}
                    selectable={false}
                    searchPlaceholder="Cari no anggota atau nama anggota..."
                    emptyMessage="Belum ada nominal simpanan per anggota"
                />
            </div>
        </article>
    );
}
