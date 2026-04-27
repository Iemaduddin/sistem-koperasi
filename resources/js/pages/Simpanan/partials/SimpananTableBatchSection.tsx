import { useEffect, useMemo, useRef } from 'react';
import { LuEye, LuX } from 'react-icons/lu';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { SimpananBatch } from '../types';
import type { AnggotaNominalRow, BatchSummaryRow } from '../types';
import {
    buildAmountLabel,
    buildRekeningDetail,
    tipeTransaksiLabel,
} from '../utils';
import { formatDateTime } from '@/utils/text';

type Props = {
    selectedAnggota: AnggotaNominalRow | null;
    data: BatchSummaryRow[];
    onClose: () => void;
    onPreviewInvoice: (batch: SimpananBatch) => void;
};

export default function SimpananTableBatchSection({
    selectedAnggota,
    data,
    onClose,
    onPreviewInvoice,
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

    const columns = useMemo<DataTableColumn<BatchSummaryRow>[]>(
        () => [
            {
                id: 'kode_transaksi',
                header: 'Kode Transaksi',
                accessor: 'kode_transaksi',
                searchable: true,
                sortable: true,
                render: (row) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-slate-900">
                            {row.kode_transaksi}
                        </div>
                        <div className="text-xs text-slate-500">
                            {row.batch.anggota?.no_anggota ?? '-'} -{' '}
                            {row.batch.anggota?.nama ?? '-'}
                        </div>
                    </div>
                ),
                searchValue: (row) =>
                    `${row.kode_transaksi} ${row.batch.anggota?.no_anggota ?? ''} ${row.batch.anggota?.nama ?? ''}`,
                sortValue: (row) => row.kode_transaksi,
            },
            {
                id: 'tanggal_transaksi',
                header: 'Tanggal',
                accessor: 'tanggal_transaksi',
                sortable: true,
                render: (row) => formatDateTime(row.tanggal_transaksi),
                sortValue: (row) => new Date(row.tanggal_transaksi),
            },
            {
                id: 'detail_transaksi',
                header: 'Rincian',
                searchable: true,
                render: (row) => (
                    <div className="space-y-2">
                        {row.details.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-900">
                                        {
                                            tipeTransaksiLabel[
                                                transaction.jenis_transaksi
                                            ]
                                        }
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                        {buildAmountLabel(
                                            Number(transaction.jumlah ?? 0),
                                        )}
                                    </span>
                                </div>
                                <div className="mt-1">
                                    {buildRekeningDetail(transaction)}
                                </div>
                            </div>
                        ))}
                    </div>
                ),
                searchValue: (row) =>
                    row.details
                        .map(
                            (transaction) =>
                                `${transaction.id} ${transaction.jenis_transaksi} ${transaction.keterangan ?? ''} ${transaction.rekening_simpanan?.jenis_simpanan?.nama ?? ''}`,
                        )
                        .join(' '),
            },
            {
                id: 'total',
                header: 'Total',
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
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="soft"
                            className="flex items-center gap-1.5"
                            onClick={() => onPreviewInvoice(row.batch)}
                        >
                            <LuEye className="h-4 w-4" />
                            Lihat Pembayaran
                        </Button>
                    </div>
                ),
            },
        ],
        [onPreviewInvoice],
    );

    if (!selectedAnggota) {
        return null;
    }

    return (
        <article
            ref={detailSectionRef}
            className="rounded-xl border-2 border-purple-800 bg-white p-4"
        >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Transaksi Simpanan Per Anggota
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        {selectedAnggota.no_anggota} - {selectedAnggota.nama}
                    </p>
                </div>

                <Button size="sm" variant="outline" onClick={onClose}>
                    <LuX className="h-4 w-4" />
                    Tutup
                </Button>
            </div>

            <div className="mt-4">
                <DataTable
                    data={data}
                    columns={columns}
                    getRowId={(row) => row.batch.id}
                    selectable={false}
                    searchPlaceholder="Cari kode transaksi, tanggal, atau anggota..."
                    emptyMessage="Belum ada batch transaksi untuk anggota ini"
                />
            </div>
        </article>
    );
}
