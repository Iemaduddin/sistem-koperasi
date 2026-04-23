import { useState } from 'react';
import FloatingSelect from '@/components/floating-input/select';
import { type Stats, periodOptions, anggotaOptions } from '../types';

type Props = {
    stats: Stats;
    periodFilters: {
        aset: string;
        saldo_keluar: string;
        pinjaman_aktif: string;
        tagihan: string;
    };
    onPeriodChange: (
        key: 'aset' | 'saldo_keluar' | 'pinjaman_aktif' | 'tagihan',
        value: string,
    ) => void;
};

export default function StatisticCard({
    stats,
    periodFilters,
    onPeriodChange,
}: Props) {
    const [anggotaFilter, setAnggotaFilter] =
        useState<keyof Stats['anggota']>('aktif');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const getPeriodLabel = (period: string) => {
        return (
            periodOptions.find((opt) => opt.value === period)?.label || 'Semua'
        );
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
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-500">Aset</p>
                    <FloatingSelect
                        label="Periode"
                        value={periodFilters.aset}
                        options={periodOptions}
                        onValueChange={(value) => onPeriodChange('aset', value)}
                        searchable={false}
                        containerClassName="max-w-28"
                        size="xs"
                    />
                </div>
                <p className="mt-2 truncate text-2xl font-bold text-slate-900">
                    {formatCurrency(stats.aset.value)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Periode: {getPeriodLabel(periodFilters.aset)}
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-500">
                        Saldo Keluar
                    </p>
                    <FloatingSelect
                        label="Periode"
                        value={periodFilters.saldo_keluar}
                        options={periodOptions}
                        onValueChange={(value) =>
                            onPeriodChange('saldo_keluar', value)
                        }
                        searchable={false}
                        containerClassName="max-w-28"
                        size="xs"
                    />
                </div>
                <p className="mt-2 truncate text-2xl font-bold text-blue-600">
                    {formatCurrency(stats.saldo_keluar.value)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Periode: {getPeriodLabel(periodFilters.saldo_keluar)}
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-500">
                        Pinjaman Aktif
                    </p>
                    <FloatingSelect
                        label="Periode"
                        value={periodFilters.pinjaman_aktif}
                        options={periodOptions}
                        onValueChange={(value) =>
                            onPeriodChange('pinjaman_aktif', value)
                        }
                        searchable={false}
                        containerClassName="max-w-28"
                        size="xs"
                    />
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats.pinjaman_aktif.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Periode: {getPeriodLabel(periodFilters.pinjaman_aktif)}
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-500">
                        Jatuh Tempo
                    </p>
                    <FloatingSelect
                        label="Periode"
                        value={periodFilters.tagihan}
                        options={periodOptions}
                        onValueChange={(value) =>
                            onPeriodChange('tagihan', value)
                        }
                        searchable={false}
                        containerClassName="max-w-28"
                        size="xs"
                    />
                </div>
                <p className="mt-2 text-3xl font-bold text-red-600">
                    {stats.tagihan_jatuh_tempo.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Periode: {getPeriodLabel(periodFilters.tagihan)}
                </p>
            </div>
        </section>
    );
}
