import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { ReactElement, useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    LuFileText
} from 'react-icons/lu';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import DataTable, { type DataTableColumn } from '@/components/data-table';

interface Props {
    transactions: any[];
    filters: {
        start_date?: string;
        end_date?: string;
        jenis?: string;
        sumber?: string;
        search?: string;
    };
}

export default function RiwayatTransaksiIndex({ transactions, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [jenis, setJenis] = useState(filters.jenis || 'all');
    const [sumber, setSumber] = useState(filters.sumber || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // Auto filter with debounce for search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Only trigger if at least one filter has changed from the initial props
            // (Actually, Inertia's router.get with preserveState handles this well)
            router.get('/riwayat-transaksi', {
                search,
                jenis,
                sumber,
                start_date: startDate,
                end_date: endDate,
            }, {
                preserveState: true,
                replace: true,
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, jenis, sumber, startDate, endDate]);

    const getSourceLabel = (transaction: any) => {
        const type = transaction.sumber_tipe;
        const sumberData = transaction.sumber;

        if (type === 'simpanan') {
            const jenisSimpanan = sumberData?.rekening_simpanan?.jenis_simpanan?.nama || 'Simpanan';
            return `Simpanan ${jenisSimpanan}`;
        }
        if (type === 'pinjaman') {
            return 'Pinjaman';
        }
        if (type === 'angsuran_pinjaman') {
            return 'Angsuran Pinjaman';
        }
        if (type === 'deposito') {
            return 'Simpanan Deposito';
        }
        return type;
    };

    const getMemberName = (transaction: any) => {
        const type = transaction.sumber_tipe;
        const sumberData = transaction.sumber;

        if (type === 'simpanan') {
            return sumberData?.rekening_simpanan?.anggota?.nama || '-';
        }
        if (type === 'pinjaman') {
            return sumberData?.anggota?.nama || '-';
        }
        if (type === 'angsuran_pinjaman') {
            return sumberData?.angsuran?.pinjaman?.anggota?.nama || '-';
        }
        if (type === 'deposito') {
            return sumberData?.anggota?.nama || '-';
        }
        return '-';
    };

    const columns = useMemo<DataTableColumn<any>[]>(() => [
        {
            id: 'tanggal',
            header: 'Tanggal',
            sortable: true,
            sortValue: (row) => new Date(row.created_at),
            render: (row) => {
                const date = new Date(row.created_at);
                const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
                
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-700">
                            {date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {hasTime && (
                            <span className="text-xs text-slate-400">
                                {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'jenis',
            header: 'Jenis',
            sortable: true,
            accessor: 'jenis',
            render: (row) => (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    row.jenis === 'masuk' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                }`}>
                    {row.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
                </span>
            )
        },
        {
            id: 'sumber',
            header: 'Sumber',
            sortable: true,
            render: (row) => <span className="text-slate-600">{getSourceLabel(row)}</span>
        },
        {
            id: 'anggota',
            header: 'Anggota',
            sortable: true,
            render: (row) => <span className="font-medium text-slate-700">{getMemberName(row)}</span>
        },
        {
            id: 'keterangan',
            header: 'Keterangan',
            render: (row) => (
                <p className="max-w-xs truncate text-slate-500" title={row.keterangan}>
                    {row.keterangan || '-'}
                </p>
            )
        },
        {
            id: 'jumlah',
            header: 'Jumlah',
            headerClassName: 'text-right',
            cellClassName: 'text-right',
            sortable: true,
            sortValue: (row) => parseFloat(row.jumlah),
            render: (row) => (
                <span className={`font-semibold ${
                    row.jenis === 'masuk' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                    {row.jenis === 'keluar' ? '-' : ''}
                    Rp {parseFloat(row.jumlah).toLocaleString('id-ID')}
                </span>
            )
        }
    ], []);

    return (
        <div className="space-y-6 p-6">
            <Head title="Riwayat Transaksi" />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
                    <p className="text-slate-500">Pantau semua arus kas masuk dan keluar koperasi.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div className="md:col-span-1">
                        <FloatingInput
                            label="Cari Keterangan / Nama"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <FloatingSelect
                            label="Jenis Transaksi"
                            value={jenis}
                            onValueChange={(val) => setJenis(val)}
                            options={[
                                { value: 'all', label: 'Semua Jenis' },
                                { value: 'masuk', label: 'Masuk' },
                                { value: 'keluar', label: 'Keluar' },
                            ]}
                        />
                    </div>
                    <div>
                        <FloatingSelect
                            label="Sumber Dana"
                            value={sumber}
                            onValueChange={(val) => setSumber(val)}
                            options={[
                                { value: 'all', label: 'Semua Sumber' },
                                { value: 'simpanan', label: 'Simpanan' },
                                { value: 'pinjaman', label: 'Pinjaman' },
                                { value: 'angsuran_pinjaman', label: 'Angsuran Pinjaman' },
                                { value: 'deposito', label: 'Simpanan Deposito' },
                            ]}
                        />
                    </div>
                    <div>
                        <FloatingInput
                            label="Dari Tanggal"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <FloatingInput
                            label="Sampai Tanggal"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Transaction Table using DataTable */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <DataTable
                    data={transactions}
                    columns={columns}
                    getRowId={(row) => row.id}
                    selectable={false}
                    searchable={false} // We use our own filters at the top
                    emptyMessage="Tidak ada riwayat transaksi yang ditemukan."
                />
            </div>
        </div>
    );
}

RiwayatTransaksiIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Riwayat Transaksi">{page}</DashboardLayout>
);
