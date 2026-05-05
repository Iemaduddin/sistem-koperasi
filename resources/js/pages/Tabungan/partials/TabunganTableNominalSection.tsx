import { useMemo } from 'react';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import { LuEye } from 'react-icons/lu';

type TabunganNominalRow = {
    id: string;
    anggota_id: string | null;
    no_anggota: string;
    nama: string;
    nominal: number;
};

type Props = {
    data: TabunganNominalRow[];
    onRequestTarik: (payload: {
        anggotaId: string;
        anggotaLabel: string;
        maxTarikTabungan: number;
    }) => void;
    onRequestLihatTransaksi: (anggota: TabunganNominalRow) => void;
};

function buildAmountLabel(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function TabunganTableNominalSection({
    data,
    onRequestTarik,
    onRequestLihatTransaksi,
}: Props) {
    const columns = useMemo<DataTableColumn<TabunganNominalRow>[]>(
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
                id: 'nominal',
                header: 'Nominal Tabungan',
                sortable: true,
                render: (row) => (
                    <span className="font-semibold text-slate-900">
                        {buildAmountLabel(row.nominal)}
                    </span>
                ),
                sortValue: (row) => row.nominal,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="info"
                            disabled={!row.anggota_id}
                            onClick={() => {
                                if (!row.anggota_id) {
                                    return;
                                }

                                onRequestLihatTransaksi(row);
                            }}
                            leftIcon={<LuEye className="h-4 w-4" />}
                        >
                            Lihat Transaksi
                        </Button>
                        <Button
                            size="sm"
                            variant="warning"
                            disabled={!row.anggota_id || row.nominal <= 0}
                            onClick={() => {
                                if (!row.anggota_id || row.nominal <= 0) {
                                    return;
                                }

                                onRequestTarik({
                                    anggotaId: row.anggota_id,
                                    anggotaLabel: `${row.no_anggota} - ${row.nama}`,
                                    maxTarikTabungan: row.nominal,
                                });
                            }}
                        >
                            Tarik Tabungan
                        </Button>
                    </div>
                ),
            },
        ],
        [onRequestTarik, onRequestLihatTransaksi],
    );

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
                Ringkasan Tabungan Per Anggota
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Menampilkan posisi nominal tabungan per anggota.
            </p>

            <div className="mt-4">
                <DataTable
                    data={data}
                    columns={columns}
                    getRowId={(row) => row.id}
                    selectable={false}
                    searchPlaceholder="Cari no anggota atau nama anggota..."
                    emptyMessage="Belum ada nominal tabungan per anggota"
                />
            </div>
        </article>
    );
}
