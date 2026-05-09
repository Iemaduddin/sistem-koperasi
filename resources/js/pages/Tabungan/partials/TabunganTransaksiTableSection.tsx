import { useEffect, useMemo, useRef } from 'react';
import { LuX } from 'react-icons/lu';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { TabunganNominalRow } from '../types';
import { formatDateTime } from '@/utils/text';

type TransaksiRow = {
    id: string;
    kode_transaksi: string;
    jenis_transaksi: 'setor' | 'tarik';
    jumlah: number;
    keterangan: string | null;
    created_at: string;
};

type Props = {
    selectedAnggota: TabunganNominalRow | null;
    transaksi: TransaksiRow[];
    onClose: () => void;
};

function buildAmountLabel(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

const tipeTransaksiLabel: Record<string, string> = {
    setor: 'Setor Tabungan',
    tarik: 'Tarik Tabungan',
};

export default function TabunganTransaksiTableSection({
    selectedAnggota,
    transaksi,
    onClose,
}: Props) {
    const detailSectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!selectedAnggota || !detailSectionRef.current) {
            return;
        }

        // Delay scroll to allow layout to stabilize
        const timeoutId = setTimeout(() => {
            detailSectionRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [selectedAnggota]);

    const columns = useMemo<DataTableColumn<TransaksiRow>[]>(
        () => [
            {
                id: 'kode_transaksi',
                header: 'Kode Transaksi',
                accessor: 'kode_transaksi',
                searchable: true,
                sortable: true,
                render: (row) => (
                    <div className="font-medium text-slate-900">
                        {row.kode_transaksi || '-'}
                    </div>
                ),
            },
            {
                id: 'jenis_transaksi',
                header: 'Jenis',
                accessor: 'jenis_transaksi',
                sortable: true,
                render: (row) => (
                    <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            row.jenis_transaksi === 'setor'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-orange-100 text-orange-700'
                        }`}
                    >
                        {tipeTransaksiLabel[row.jenis_transaksi]}
                    </span>
                ),
            },
            {
                id: 'jumlah',
                header: 'Jumlah',
                accessor: 'jumlah',
                sortable: true,
                render: (row) => (
                    <span className="font-semibold text-slate-900">
                        {buildAmountLabel(row.jumlah)}
                    </span>
                ),
                sortValue: (row) => row.jumlah,
            },
            {
                id: 'created_at',
                header: 'Tanggal',
                accessor: 'created_at',
                sortable: true,
                render: (row) => formatDateTime(row.created_at),
                sortValue: (row) => new Date(row.created_at),
            },
            {
                id: 'keterangan',
                header: 'Keterangan',
                accessor: 'keterangan',
                searchable: true,
                render: (row) => row.keterangan || '-',
            },
        ],
        [],
    );

    if (!selectedAnggota) {
        return null;
    }

    return (
        <section ref={detailSectionRef}>
            <article className="rounded-xl border-2 border-purple-800 bg-white p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Riwayat Transaksi Tabungan
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            {selectedAnggota.no_anggota} -{' '}
                            {selectedAnggota.nama}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="warning"
                        styleMode="outline"
                        onClick={onClose}
                    >
                        <LuX className="h-4 w-4" />
                        Tutup
                    </Button>
                </div>

                <div className="mt-4">
                    <DataTable
                        data={transaksi}
                        columns={columns}
                        getRowId={(row) => row.id}
                        selectable={false}
                        searchPlaceholder="Cari kode transaksi atau keterangan..."
                        emptyMessage="Tidak ada transaksi untuk anggota ini"
                    />
                </div>
            </article>
        </section>
    );
}
