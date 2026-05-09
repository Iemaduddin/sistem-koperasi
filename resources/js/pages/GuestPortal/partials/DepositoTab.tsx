import { useMemo, useRef, useState } from 'react';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import {
    formatCurrency,
    formatDateOnly,
    formatDateTime,
    type DepositoItem,
} from '../types';

type DepositoTabProps = {
    items: DepositoItem[];
};

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            {message}
        </div>
    );
}

export default function DepositoTab({ items }: DepositoTabProps) {
    const [selectedDepositoId, setSelectedDepositoId] = useState<string | null>(
        null,
    );
    const detailRef = useRef<HTMLDivElement | null>(null);

    const columns: DataTableColumn<DepositoItem>[] = [
        {
            id: 'periode',
            header: 'Periode',
            render: (item) =>
                `${formatDateOnly(item.tanggal_mulai)} - ${formatDateOnly(item.tanggal_selesai)}`,
            sortable: true,
            sortValue: (item) => item.tanggal_mulai ?? '',
            searchable: false,
        },
        {
            id: 'saldo',
            header: 'Saldo',
            render: (item) => (
                <span className="font-medium text-slate-900">
                    {formatCurrency(item.saldo)}
                </span>
            ),
            sortable: true,
            sortValue: (item) => item.saldo,
            searchable: false,
        },
        {
            id: 'tenor',
            header: 'Tenor',
            render: (item) => `${item.tenor_bulan} bulan`,
            sortable: true,
            sortValue: (item) => item.tenor_bulan,
            searchable: false,
        },
        {
            id: 'bagi_hasil',
            header: 'Bagi Hasil',
            render: (item) => `${item.persen_bagi_hasil}%`,
            sortable: true,
            sortValue: (item) => item.persen_bagi_hasil,
            searchable: false,
        },
        {
            id: 'status',
            header: 'Status',
            render: (item) => (
                <span className="text-slate-700 capitalize">{item.status}</span>
            ),
            searchable: true,
            searchValue: (item) => item.status,
        },
        {
            id: 'action',
            header: 'Aksi',
            render: (item) => (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        setSelectedDepositoId(item.id);
                        window.requestAnimationFrame(() => {
                            detailRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                            });
                        });
                    }}
                >
                    Lihat Rincian
                </Button>
            ),
            searchable: false,
        },
    ];

    const selectedDeposito = useMemo(
        () => items.find((item) => item.id === selectedDepositoId) ?? null,
        [items, selectedDepositoId],
    );

    const selectedDepositoLogContent = selectedDeposito ? (
        selectedDeposito.logs.length > 0 ? (
            <div className="space-y-2">
                {selectedDeposito.logs.map((log) => (
                    <div
                        key={`${selectedDeposito.id}-log-${log.id}`}
                        className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm shadow-sm"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium text-slate-900">
                                {formatDateOnly(log.tanggal_perhitungan)}
                            </p>
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 capitalize">
                                {log.status_pengambilan}
                            </span>
                        </div>
                        <div className="mt-1 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                            <p>
                                <span className="font-medium text-slate-700">
                                    Nominal:
                                </span>{' '}
                                {formatCurrency(log.nominal_bagi_hasil)}
                            </p>
                            <p>
                                <span className="font-medium text-slate-700">
                                    Diambil:
                                </span>{' '}
                                {log.tanggal_pengambilan
                                    ? formatDateTime(log.tanggal_pengambilan)
                                    : '-'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <EmptyState message="Tabungan berjangka ini belum memiliki log bagi hasil." />
        )
    ) : null;

    if (items.length === 0) {
        return <EmptyState message="Belum ada transaksi tabungan berjangka." />;
    }

    return (
        <div className="space-y-4">
            <DataTable
                data={items}
                columns={columns}
                getRowId={(row) => row.id}
                selectable={false}
                searchPlaceholder="Cari status tabungan berjangka..."
                emptyMessage="Tidak ada transaksi tabungan berjangka."
            />

            {selectedDeposito ? (
                <div
                    ref={detailRef}
                    className="scroll-mt-6 rounded-2xl border-2 border-violet-300 bg-white p-4 shadow-sm"
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-violet-700 uppercase">
                                Detail Log Tabungan Berjangka
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                {selectedDeposito.tanggal_mulai
                                    ? `${formatDateOnly(selectedDeposito.tanggal_mulai)} - ${formatDateOnly(selectedDeposito.tanggal_selesai)}`
                                    : 'Periode Tabungan Berjangka'}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Saldo {formatCurrency(selectedDeposito.saldo)} ·{' '}
                                {selectedDeposito.tenor_bulan} bulan ·{' '}
                                {selectedDeposito.persen_bagi_hasil}%
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDepositoId(null)}
                        >
                            Tutup Detail
                        </Button>
                    </div>

                    <div className="mt-4">{selectedDepositoLogContent}</div>
                </div>
            ) : null}
        </div>
    );
}
