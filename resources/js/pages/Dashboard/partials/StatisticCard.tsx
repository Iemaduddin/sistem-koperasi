import { useState } from 'react';
import FloatingSelect from '@/components/floating-input/select';
import { type Stats, anggotaOptions } from '../types';
import { 
    LuUsers, 
    LuHandshake, 
    LuClock, 
    LuArrowUp, 
    LuArrowDown,
    LuTrendingUp,
    LuTrendingDown
} from 'react-icons/lu';

type Props = {
    stats: Stats;
};

export default function StatisticCard({ stats }: Props) {
    const [anggotaFilter, setAnggotaFilter] =
        useState<keyof Stats['anggota']>('aktif');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <section className="grid gap-6 lg:grid-cols-2">
            {/* Group 1: Cash Flow Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-blue-600"></div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Ringkasan Arus Kas</h3>
                </div>
                <div className="grid grid-cols-2 gap-6 divide-x divide-slate-100">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500">
                            <LuTrendingUp className="text-emerald-500" size={14} />
                            <span className="text-xs font-medium">Pemasukan</span>
                        </div>
                        <div className="flex items-baseline gap-1 text-emerald-600">
                            <LuArrowUp size={18} className="translate-y-0.5" />
                            <span className="text-2xl font-bold truncate">{formatCurrency(stats.aset.period_value)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Tabungan & Angsuran Masuk</p>
                    </div>
                    <div className="pl-6 space-y-2">
                        <div className="flex items-center gap-2 text-slate-500">
                            <LuTrendingDown className="text-rose-500" size={14} />
                            <span className="text-xs font-medium">Pengeluaran</span>
                        </div>
                        <div className="flex items-baseline gap-1 text-rose-600">
                            <LuArrowDown size={18} className="translate-y-0.5" />
                            <span className="text-2xl font-bold truncate">{formatCurrency(stats.saldo_keluar.value)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Total Piutang Berjalan</p>
                    </div>
                </div>
            </div>

            {/* Group 2: Member & Loan Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-emerald-600"></div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Anggota & Pinjaman</h3>
                </div>
                <div className="grid grid-cols-2 gap-6 divide-x divide-slate-100">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500">
                                <LuUsers className="text-blue-500" size={14} />
                                <span className="text-xs font-medium">Total Anggota</span>
                            </div>
                            <FloatingSelect
                                label="Status"
                                value={anggotaFilter}
                                options={anggotaOptions}
                                onValueChange={(value) =>
                                    setAnggotaFilter(value as keyof Stats['anggota'])
                                }
                                searchable={false}
                                containerClassName="max-w-24"
                                size="xs"
                                className="!h-7 text-[10px]"
                            />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{stats.anggota[anggotaFilter]}</div>
                        <p className="text-[10px] text-slate-400 capitalize">
                            Status: {anggotaFilter === 'total' ? 'Semua' : anggotaFilter}
                        </p>
                    </div>
                    <div className="pl-6 space-y-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <LuHandshake className="text-emerald-500" size={14} />
                            <span className="text-xs font-medium">Pinjaman Aktif</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{stats.pinjaman_aktif.value}</div>
                        <p className="text-[10px] text-slate-400">Anggota meminjam</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
