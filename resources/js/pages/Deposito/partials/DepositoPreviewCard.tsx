import { useEffect, useState } from 'react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { formatDateOnly } from '@/utils/text';
import {
    formatRupiah,
    normalizeDateOnly,
    type LogBagiHasilRow,
} from '../types';

type Props = {
    nominalBagiHasilBulanan: number;
    totalBagiHasil: number;
    previewLogs: LogBagiHasilRow[];
    shouldAutoOpen: boolean;
};

export default function DepositoPreviewCard({
    nominalBagiHasilBulanan,
    totalBagiHasil,
    previewLogs,
    shouldAutoOpen,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(shouldAutoOpen);
    }, [shouldAutoOpen]);

    return (
        <details
            open={isOpen}
            onToggle={(event) =>
                setIsOpen((event.currentTarget as HTMLDetailsElement).open)
            }
            className="rounded-xl border border-slate-200 bg-white p-4"
        >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                <span>
                    Preview Bagi Hasil Deposito ({previewLogs.length} bulan)
                </span>
                <span className="text-slate-500" aria-hidden="true">
                    {isOpen ? (
                        <LuChevronUp className="h-4 w-4" />
                    ) : (
                        <LuChevronDown className="h-4 w-4" />
                    )}
                </span>
            </summary>

            <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p>
                        Bagi hasil per bulan:{' '}
                        <span className="font-semibold">
                            {formatRupiah(nominalBagiHasilBulanan)}
                        </span>
                    </p>
                    <p>
                        Total hingga tenor selesai:{' '}
                        <span className="font-semibold">
                            {formatRupiah(totalBagiHasil)}
                        </span>
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    <th className="px-4 py-2">Bulan Ke</th>
                                    <th className="px-4 py-2">
                                        Tanggal Perhitungan
                                    </th>
                                    <th className="px-4 py-2 text-right">
                                        Nominal Bagi Hasil
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-4 py-4 text-center text-slate-500"
                                        >
                                            Isi saldo deposito untuk melihat
                                            preview log bagi hasil.
                                        </td>
                                    </tr>
                                ) : (
                                    previewLogs.map((log, index) => (
                                        <tr
                                            key={`${log.tanggal_perhitungan}-${index}`}
                                            className="border-t border-slate-200"
                                        >
                                            <td className="px-4 py-2">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-2">
                                                {formatDateOnly(
                                                    `${normalizeDateOnly(log.tanggal_perhitungan)}T00:00:00`,
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-800">
                                                {formatRupiah(
                                                    log.nominal_bagi_hasil,
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </details>
    );
}
