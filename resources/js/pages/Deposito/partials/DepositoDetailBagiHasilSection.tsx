import { forwardRef, useEffect, useState } from 'react';
import { formatDateOnly, formatDateTimeLong } from '@/utils/text';
import Button from '@/components/button';
import ConfirmDialog from '@/components/confirm-dialog';
import Tooltip from '@/components/tooltip';
import {
    formatRupiah,
    normalizeDateOnly,
    type SimpananDepositoRow,
} from '../types';
import { LuEqualApproximately } from 'react-icons/lu';

export type VisibleLogRow = {
    id?: number;
    tanggal_perhitungan: string;
    nominal_bagi_hasil: number | string;
    status_pengambilan?: 'belum' | 'sudah';
    tanggal_pengambilan?: string | null;
    parsedDate: Date;
};

type Props = {
    selectedRow: SimpananDepositoRow;
    visibleLogs: VisibleLogRow[];
    eligibleLogsCount: number;
    isTarikSingleSubmittingId: number | null;
    isTarikKumulatifSubmitting: boolean;
    onTarikSingle: (logId: number) => void;
    onTarikKumulatif: () => void;
    onClose: () => void;
};

const DepositoDetailBagiHasilSection = forwardRef<HTMLElement, Props>(
    function DepositoDetailBagiHasilSection(
        {
            selectedRow,
            visibleLogs,
            eligibleLogsCount,
            isTarikSingleSubmittingId,
            isTarikKumulatifSubmitting,
            onTarikSingle,
            onTarikKumulatif,
            onClose,
        },
        ref,
    ) {
        const [confirmSingleLog, setConfirmSingleLog] =
            useState<VisibleLogRow | null>(null);
        const [isConfirmKumulatifOpen, setIsConfirmKumulatifOpen] =
            useState(false);

        useEffect(() => {
            if (isTarikSingleSubmittingId === null) {
                setConfirmSingleLog(null);
            }
        }, [isTarikSingleSubmittingId]);

        useEffect(() => {
            if (!isTarikKumulatifSubmitting) {
                setIsConfirmKumulatifOpen(false);
            }
        }, [isTarikKumulatifSubmitting]);

        return (
            <>
                <article
                    ref={ref}
                    className="rounded-xl border-2 border-purple-800 bg-white p-4"
                >
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900">
                                Detail Transaksi Bagi Hasil
                            </h4>
                            <p className="text-xs text-slate-600">
                                {selectedRow.anggota?.no_anggota ?? '-'} -{' '}
                                {selectedRow.anggota?.nama ??
                                    'anggota terpilih'}
                            </p>
                            <p className="text-xs text-slate-600">
                                Penarikan hanya dapat diproses jika tanggal hari
                                ini sudah melewati tanggal perhitungan.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {eligibleLogsCount > 1 ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="warning"
                                    onClick={() =>
                                        setIsConfirmKumulatifOpen(true)
                                    }
                                    disabled={isTarikKumulatifSubmitting}
                                    loading={isTarikKumulatifSubmitting}
                                >
                                    Tarik Kumulatif ({eligibleLogsCount})
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={onClose}
                            >
                                Tutup Detail
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    <th className="px-4 py-2">
                                        Tanggal Perhitungan
                                    </th>
                                    <th className="px-4 py-2 text-right">
                                        Nominal
                                    </th>
                                    <th className="px-4 py-2 text-center">
                                        Status Pengambilan
                                    </th>
                                    <th className="px-4 py-2 text-center">
                                        Tanggal Diambil
                                    </th>
                                    <th className="px-4 py-2 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-4 text-center text-slate-500"
                                        >
                                            Belum ada rincian yang tampil untuk
                                            periode sampai bulan depan.
                                        </td>
                                    </tr>
                                ) : (
                                    visibleLogs.map((log, index) => {
                                        const tanggalPengambilan =
                                            log.tanggal_pengambilan ?? '';
                                        const status =
                                            log.status_pengambilan ?? 'belum';
                                        const logId = Number(log.id ?? 0);
                                        const canTarik =
                                            status === 'belum' &&
                                            !Number.isNaN(
                                                log.parsedDate.getTime(),
                                            ) &&
                                            log.parsedDate <= new Date() &&
                                            logId > 0;

                                        return (
                                            <tr
                                                key={`${log.tanggal_perhitungan}-${index}`}
                                                className="border-t border-slate-200"
                                            >
                                                <td className="px-4 py-2">
                                                    {formatDateOnly(
                                                        `${log.tanggal_perhitungan}T00:00:00`,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatRupiah(
                                                        Number(
                                                            log.nominal_bagi_hasil,
                                                        ) || 0,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Tooltip
                                                        content={
                                                            status === 'sudah'
                                                                ? 'Bagi hasil sudah diambil.'
                                                                : 'Isi tanggal pengambilan saat bagi hasil diambil.'
                                                        }
                                                    >
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                                status ===
                                                                'sudah'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                            }`}
                                                        >
                                                            {status}
                                                        </span>
                                                    </Tooltip>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {tanggalPengambilan
                                                        ? formatDateTimeLong(
                                                              tanggalPengambilan,
                                                          )
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {canTarik ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="warning"
                                                            onClick={() =>
                                                                setConfirmSingleLog(
                                                                    log,
                                                                )
                                                            }
                                                            loading={
                                                                isTarikSingleSubmittingId ===
                                                                logId
                                                            }
                                                            disabled={
                                                                isTarikSingleSubmittingId ===
                                                                logId
                                                            }
                                                        >
                                                            Tarik
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>

                <ConfirmDialog
                    open={confirmSingleLog !== null}
                    tone="warning"
                    icon={<LuEqualApproximately />}
                    title="Konfirmasi Penarikan Bagi Hasil"
                    description={
                        confirmSingleLog
                            ? `Tarik bagi hasil sebesar ${formatRupiah(Number(confirmSingleLog.nominal_bagi_hasil) || 0)} untuk tanggal perhitungan ${formatDateOnly(`${confirmSingleLog.tanggal_perhitungan}T00:00:00`)}?`
                            : 'Apakah Anda yakin ingin menarik bagi hasil ini?'
                    }
                    confirmText="Ya, Tarik"
                    cancelText="Batal"
                    isLoading={isTarikSingleSubmittingId !== null}
                    onCancel={() => setConfirmSingleLog(null)}
                    onConfirm={() => {
                        if (!confirmSingleLog?.id) {
                            return;
                        }

                        onTarikSingle(Number(confirmSingleLog.id));
                    }}
                />

                <ConfirmDialog
                    open={isConfirmKumulatifOpen}
                    tone="warning"
                    icon={<LuEqualApproximately />}
                    title="Konfirmasi Penarikan Kumulatif"
                    description={`Tarik kumulatif untuk ${eligibleLogsCount} log bagi hasil yang sudah jatuh tempo?`}
                    confirmText="Ya, Tarik Semua"
                    cancelText="Batal"
                    isLoading={isTarikKumulatifSubmitting}
                    onCancel={() => setIsConfirmKumulatifOpen(false)}
                    onConfirm={onTarikKumulatif}
                />
            </>
        );
    },
);

export default DepositoDetailBagiHasilSection;
