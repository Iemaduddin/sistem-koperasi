import Button from '@/components/button';
import Modal from '@/components/modal';
import { formatRupiah, type SimpananDepositoRow } from '../types';
import { formatDateTimeLong, formatDateOnly } from '@/utils/text';
import { LuDownload } from 'react-icons/lu';
import type { VisibleLogRow } from './DepositoDetailBagiHasilSection';

type Props = {
    selectedRow: SimpananDepositoRow;
    selectedLog: VisibleLogRow | null;
    onClose: () => void;
    onExportPdf: () => void;
};

export default function DepositoInvoicePreviewModal({
    selectedRow,
    selectedLog,
    onClose,
    onExportPdf,
}: Props) {
    if (!selectedLog) return null;

    return (
        <Modal
            open={selectedLog !== null}
            title={`Lihat Transaksi Bagi Hasil`}
            description={`${selectedRow.anggota?.no_anggota ?? '-'} - ${selectedRow.anggota?.nama ?? '-'}`}
            onClose={onClose}
            maxWidthClassName="max-w-4xl"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onExportPdf}
                        className="flex items-center gap-1.5"
                    >
                        <LuDownload className="h-4 w-4" />
                        Unduh PDF
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                ID Transaksi
                            </p>
                            <p className="text-xl font-bold text-slate-900">
                                LOG-
                                {selectedLog.id
                                    ? String(selectedLog.id).padStart(6, '0')
                                    : 'N/A'}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                {selectedLog.tanggal_pengambilan
                                    ? formatDateTimeLong(
                                          selectedLog.tanggal_pengambilan,
                                      )
                                    : new Date().toISOString()}
                            </p>
                        </div>

                        <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm">
                            <p className="text-slate-500">Status Pengambilan</p>
                            <p className="font-semibold text-slate-900">
                                {selectedLog.status_pengambilan === 'sudah'
                                    ? 'Sudah Diambil'
                                    : 'Belum Diambil'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-xl bg-white p-3">
                            <p className="text-xs tracking-wide text-slate-500 uppercase">
                                Anggota
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {selectedRow.anggota?.no_anggota ?? '-'} -{' '}
                                {selectedRow.anggota?.nama ?? '-'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                            <p className="text-xs tracking-wide text-slate-500 uppercase">
                                Nominal Bagi Hasil
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {formatRupiah(
                                    Number(selectedLog.nominal_bagi_hasil) || 0,
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">
                                    Deskripsi
                                </th>
                                <th className="px-4 py-3 text-center font-semibold">
                                    Tanggal Perhitungan
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Nominal
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Subtotal
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            <tr>
                                <td className="px-4 py-3 text-slate-900">
                                    Bagi Hasil Deposito
                                </td>
                                <td className="px-4 py-3 text-center text-slate-700">
                                    {formatDateOnly(
                                        `${selectedLog.tanggal_perhitungan}T00:00:00`,
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-700">
                                    {formatRupiah(
                                        Number(
                                            selectedLog.nominal_bagi_hasil,
                                        ) || 0,
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                    {formatRupiah(
                                        Number(
                                            selectedLog.nominal_bagi_hasil,
                                        ) || 0,
                                    )}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-50">
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-4 py-3 text-right font-semibold text-slate-600"
                                >
                                    Total Keseluruhan
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                    {formatRupiah(
                                        Number(
                                            selectedLog.nominal_bagi_hasil,
                                        ) || 0,
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-sm font-medium text-green-800">
                        ✓ Status: Bagi hasil sudah diambil
                    </p>
                </div>
            </div>
        </Modal>
    );
}
