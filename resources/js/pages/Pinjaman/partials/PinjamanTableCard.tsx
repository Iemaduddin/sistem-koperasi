import { router } from '@inertiajs/react';
import Button from '@/components/button';
import type { PinjamanRow } from '../types';
import {
    formatRupiah,
    formatTanggal,
    getLabelStatusPinjaman,
    hitungProgressPersen,
    hitungSisaAngsuran,
} from '../utils';

type Props = {
    rows: PinjamanRow[];
    onRequestDelete: (row: PinjamanRow) => void;
};

export default function PinjamanTableCard({ rows, onRequestDelete }: Props) {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-neutral-800">
                    Daftar Pinjaman
                </h2>
                <p className="mt-0.5 text-sm text-neutral-400">
                    Total {rows.length} pinjaman terdaftar
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-wider text-neutral-500">
                        <tr>
                            <th className="px-4 py-3 text-left">Anggota</th>
                            <th className="px-4 py-3 text-right">Jumlah Pinjaman</th>
                            <th className="px-4 py-3 text-right">Angsuran/Bulan</th>
                            <th className="px-4 py-3 text-center">Tenor</th>
                            <th className="px-4 py-3 text-left">Tgl. Mulai</th>
                            <th className="px-4 py-3 text-left">Progress</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {rows.map((row) => {
                            const progress = hitungProgressPersen(row);
                            const sisaAngsuran = hitungSisaAngsuran(row);
                            const statusClass =
                                row.status === 'lunas'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700';

                            return (
                                <tr
                                    key={row.id}
                                    className="hover:bg-neutral-50"
                                >
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-neutral-800">
                                            {row.anggota?.nama ?? '-'}
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                            {row.anggota?.no_anggota ?? '-'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-neutral-800">
                                        {formatRupiah(row.jumlah_pinjaman)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-neutral-700">
                                        {formatRupiah(row.jumlah_angsuran)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-neutral-600">
                                        {row.tenor_bulan} bln
                                    </td>
                                    <td className="px-4 py-3 text-neutral-600">
                                        {formatTanggal(row.tanggal_mulai)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
                                                <div
                                                    className="h-full rounded-full bg-green-500"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="whitespace-nowrap text-xs text-neutral-500">
                                                {progress}% ({sisaAngsuran} sisa)
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                                        >
                                            {getLabelStatusPinjaman(row.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.visit(`/pinjaman/${row.id}`)
                                                }
                                            >
                                                Detail
                                            </Button>
                                            {row.status === 'aktif' && (
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => onRequestDelete(row)}
                                                >
                                                    Hapus
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {rows.length === 0 && (
                    <p className="py-10 text-center text-sm text-neutral-400">
                        Belum ada data pinjaman.
                    </p>
                )}
            </div>
        </div>
    );
}
