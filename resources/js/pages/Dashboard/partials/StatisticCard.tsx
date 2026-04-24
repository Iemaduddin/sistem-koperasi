import { useState } from 'react';
import FloatingSelect from '@/components/floating-input/select';
import { type Stats, anggotaOptions } from '../types';

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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Stacked Pemasukan & Pengeluaran */}
            <div className="flex flex-col gap-4">
                <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">
                        Pemasukan
                    </p>
                    <p className="mt-1 truncate text-2xl font-bold text-emerald-600">
                        {formatCurrency(stats.aset.period_value)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                        Tabungan & Angsuran Masuk
                    </p>
                </div>
                <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">
                        Pengeluaran (Piutang)
                    </p>
                    <p className="mt-1 truncate text-2xl font-bold text-blue-600">
                        {formatCurrency(stats.saldo_keluar.value)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                        Total Angsuran Belum Bayar
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-500">
                        Total Anggota
                    </p>
                    <FloatingSelect
                        label="Status"
                        value={anggotaFilter}
                        options={anggotaOptions}
                        onValueChange={(value) =>
                            setAnggotaFilter(value as keyof Stats['anggota'])
                        }
                        searchable={false}
                        containerClassName="max-w-28"
                        size="xs"
                    />
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats.anggota[anggotaFilter]}
                </p>
                <p className="mt-1 text-xs text-slate-500 capitalize">
                    Status:{' '}
                    {anggotaFilter === 'total' ? 'Semua' : anggotaFilter}
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                    Pinjaman Aktif
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats.pinjaman_aktif.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Jumlah anggota meminjam
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                    Jatuh Tempo
                </p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                    {stats.tagihan_jatuh_tempo.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Tagihan belum lunas
                </p>
            </div>
        </section>
    );
}
