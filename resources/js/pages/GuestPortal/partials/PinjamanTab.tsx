import { useMemo, useState } from 'react';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import {
    formatCurrency,
    formatDateTime,
    isWithinRange,
    type TransaksiPinjamanItem,
} from '../types';

type PinjamanTabProps = {
    items: TransaksiPinjamanItem[];
};

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            {message}
        </div>
    );
}

function DateFilterBar({
    from,
    to,
    onChangeFrom,
    onChangeTo,
    onReset,
}: {
    from: string;
    to: string;
    onChangeFrom: (value: string) => void;
    onChangeTo: (value: string) => void;
    onReset: () => void;
}) {
    return (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
            <label className="flex flex-col gap-1 text-xs text-slate-600">
                Dari Tanggal
                <input
                    type="date"
                    value={from}
                    onChange={(event) => onChangeFrom(event.target.value)}
                    className="h-9 rounded-md border border-blue-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-600">
                Sampai Tanggal
                <input
                    type="date"
                    value={to}
                    onChange={(event) => onChangeTo(event.target.value)}
                    className="h-9 rounded-md border border-blue-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
            </label>
            <Button size="sm" variant="outline" onClick={onReset}>
                Reset Filter
            </Button>
        </div>
    );
}

export default function PinjamanTab({ items }: PinjamanTabProps) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const filteredItems = useMemo(
        () =>
            items.filter((item) => isWithinRange(item.tanggal_bayar, from, to)),
        [items, from, to],
    );

    const columns: DataTableColumn<TransaksiPinjamanItem>[] = [
        {
            id: 'tanggal_bayar',
            header: 'Tanggal Bayar',
            render: (item) => formatDateTime(item.tanggal_bayar),
            sortable: true,
            sortValue: (item) => item.tanggal_bayar ?? '',
            searchable: false,
        },
        {
            id: 'pinjaman_id',
            header: 'Pinjaman',
            accessor: 'pinjaman_id',
            sortable: true,
            searchable: true,
        },
        {
            id: 'jumlah_bayar',
            header: 'Jumlah Bayar',
            render: (item) => (
                <span className="font-medium text-slate-900">
                    {formatCurrency(item.jumlah_bayar)}
                </span>
            ),
            sortable: true,
            sortValue: (item) => item.jumlah_bayar,
            searchable: false,
        },
        {
            id: 'denda_dibayar',
            header: 'Denda',
            render: (item) => formatCurrency(item.denda_dibayar),
            sortable: true,
            sortValue: (item) => item.denda_dibayar,
            searchable: false,
        },
    ];

    if (items.length === 0) {
        return (
            <EmptyState message="Belum ada transaksi pembayaran pinjaman." />
        );
    }

    return (
        <div className="space-y-4">
            <DateFilterBar
                from={from}
                to={to}
                onChangeFrom={setFrom}
                onChangeTo={setTo}
                onReset={() => {
                    setFrom('');
                    setTo('');
                }}
            />
            <DataTable
                data={filteredItems}
                columns={columns}
                getRowId={(row) => row.id}
                selectable={false}
                searchPlaceholder="Cari ID pinjaman..."
                emptyMessage="Tidak ada transaksi pinjaman pada rentang tanggal ini."
            />
        </div>
    );
}
