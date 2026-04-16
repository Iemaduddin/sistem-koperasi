import DataTable, { type DataTableColumn } from '@/components/data-table';
import { formatCurrency, formatDateTime, type SimpananItem } from '../types';

type SimpananTabProps = {
    items: SimpananItem[];
};

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            {message}
        </div>
    );
}

export default function SimpananTab({ items }: SimpananTabProps) {
    const totalSetor = items
        .filter((item) => item.jenis === 'setor')
        .reduce((total, item) => total + item.jumlah, 0);
    const totalTarik = items
        .filter((item) => item.jenis === 'tarik')
        .reduce((total, item) => total + item.jumlah, 0);
    const saldoBersih = totalSetor - totalTarik;

    const columns: DataTableColumn<SimpananItem>[] = [
        {
            id: 'tanggal',
            header: 'Tanggal',
            render: (item) => formatDateTime(item.tanggal),
            sortable: true,
            sortValue: (item) => item.tanggal ?? '',
            searchable: false,
        },
        {
            id: 'jenis',
            header: 'Jenis',
            render: (item) => (
                <div>
                    <p className="font-medium text-slate-800 capitalize">
                        {item.jenis}
                    </p>
                    {item.kategori ? (
                        <p className="text-xs text-slate-500">
                            {item.kategori}
                        </p>
                    ) : null}
                </div>
            ),
            searchable: true,
            searchValue: (item) => `${item.jenis} ${item.kategori ?? ''}`,
        },
        {
            id: 'jumlah',
            header: 'Nominal',
            render: (item) => (
                <span className="font-medium text-slate-900">
                    {formatCurrency(item.jumlah)}
                </span>
            ),
            sortable: true,
            sortValue: (item) => item.jumlah,
            searchable: false,
        },
        {
            id: 'ringkasan',
            header: 'Ringkasan',
            render: (item) => (
                <div className="space-y-1 text-xs text-slate-600">
                    <p>
                        <span className="font-medium text-slate-700">
                            Kategori:
                        </span>{' '}
                        {item.kategori ?? '-'}
                    </p>
                    <p>
                        <span className="font-medium text-slate-700">
                            Transaksi:
                        </span>{' '}
                        {item.jenis}
                    </p>
                </div>
            ),
            searchable: false,
        },
    ];

    if (items.length === 0) {
        return <EmptyState message="Belum ada transaksi simpanan." />;
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">
                        Total Setoran
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatCurrency(totalSetor)}
                    </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">
                        Total Penarikan
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatCurrency(totalTarik)}
                    </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">
                        Saldo Bersih
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatCurrency(saldoBersih)}
                    </p>
                </div>
            </div>

            <DataTable
                data={items}
                columns={columns}
                getRowId={(row) => row.id}
                selectable={false}
                searchPlaceholder="Cari jenis atau kategori..."
                emptyMessage="Tidak ada transaksi simpanan."
            />
        </div>
    );
}
