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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                    Aset
                </p>
                <p className="mt-2 truncate text-3xl font-bold text-slate-900">
                    {formatCurrency(stats.aset.total)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Total saldo saat ini
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                    Piutang Angsuran
                </p>
                <p className="mt-2 truncate text-2xl font-bold text-blue-600">
                    {formatCurrency(stats.saldo_keluar.value)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Tagihan di rentang ini
                </p>
            </div>
        </section>
    );
}
