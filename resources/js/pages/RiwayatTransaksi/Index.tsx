import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { ReactElement, useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    LuArrowUp, 
    LuArrowDown, 
    LuWallet, 
    LuSearch, 
    LuFilter,
    LuCalendar,
    LuChevronLeft,
    LuChevronRight,
    LuFileText
} from 'react-icons/lu';
import Button from '@/Components/button';
import FloatingInput from '@/Components/floating-input/input';
import FloatingSelect from '@/Components/floating-input/select';

interface Props {
    transactions: {
        data: any[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        start_date?: string;
        end_date?: string;
        jenis?: string;
        search?: string;
    };
}

export default function RiwayatTransaksiIndex({ transactions, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [jenis, setJenis] = useState(filters.jenis || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleFilter = () => {
        router.get('/riwayat-transaksi', {
            search,
            jenis,
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (url: string) => {
        if (url) router.get(url, {}, { preserveState: true });
    };

    const getSourceLabel = (transaction: any) => {
        const type = transaction.sumber_tipe;
        const sumber = transaction.sumber;

        if (type === 'simpanan') {
            const jenisSimpanan = sumber?.rekening_simpanan?.jenis_simpanan?.nama || 'Simpanan';
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
        const sumber = transaction.sumber;

        if (type === 'simpanan') {
            return sumber?.rekening_simpanan?.anggota?.nama || '-';
        }
        if (type === 'pinjaman') {
            return sumber?.anggota?.nama || '-';
        }
        if (type === 'angsuran_pinjaman') {
            return sumber?.angsuran?.pinjaman?.anggota?.nama || '-';
        }
        if (type === 'deposito') {
            return sumber?.anggota?.nama || '-';
        }
        return '-';
    };

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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                            onChange={(e) => setJenis(e.target.value)}
                            options={[
                                { value: 'all', label: 'Semua Jenis' },
                                { value: 'masuk', label: 'Masuk' },
                                { value: 'keluar', label: 'Keluar' },
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
                <div className="mt-4 flex justify-end gap-2">
                    <Button 
                        variant="soft" 
                        onClick={() => {
                            setSearch('');
                            setJenis('all');
                            setStartDate('');
                            setEndDate('');
                            router.get('/riwayat-transaksi');
                        }}
                    >
                        Reset
                    </Button>
                    <Button onClick={handleFilter}>
                        <LuFilter className="mr-2" />
                        Terapkan Filter
                    </Button>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Tanggal</th>
                                <th className="px-6 py-4 font-semibold">Jenis</th>
                                <th className="px-6 py-4 font-semibold">Sumber</th>
                                <th className="px-6 py-4 font-semibold">Anggota</th>
                                <th className="px-6 py-4 font-semibold">Keterangan</th>
                                <th className="px-6 py-4 font-semibold text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.data.length > 0 ? (
                                transactions.data.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700">
                                                    {new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                tx.jenis === 'masuk' 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {tx.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600">{getSourceLabel(tx)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-700">{getMemberName(tx)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="max-w-xs truncate text-slate-500" title={tx.keterangan}>
                                                {tx.keterangan || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-semibold ${
                                                tx.jenis === 'masuk' ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                                {tx.jenis === 'keluar' ? '-' : ''}
                                                Rp {parseFloat(tx.jumlah).toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <LuFileText size={48} className="mb-2 opacity-20" />
                                            <p>Tidak ada riwayat transaksi yang ditemukan.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {transactions.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                        <span className="text-xs text-slate-500">
                            Menampilkan {transactions.from} - {transactions.to} dari {transactions.total} transaksi
                        </span>
                        <div className="flex gap-2">
                            {transactions.links.map((link: any, i: number) => {
                                // Simplify pagination links
                                if (link.label.includes('Previous')) {
                                    return (
                                        <Button
                                            key={i}
                                            variant="outline"
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => handlePageChange(link.url)}
                                        >
                                            <LuChevronLeft size={16} />
                                        </Button>
                                    );
                                }
                                if (link.label.includes('Next')) {
                                    return (
                                        <Button
                                            key={i}
                                            variant="outline"
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => handlePageChange(link.url)}
                                        >
                                            <LuChevronRight size={16} />
                                        </Button>
                                    );
                                }
                                if (link.active || (!isNaN(parseInt(link.label)))) {
                                    return (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'primary' : 'outline'}
                                            size="sm"
                                            onClick={() => handlePageChange(link.url)}
                                            className={link.active ? '' : 'hidden md:inline-flex'}
                                        >
                                            {link.label}
                                        </Button>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

RiwayatTransaksiIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Riwayat Transaksi">{page}</DashboardLayout>
);
