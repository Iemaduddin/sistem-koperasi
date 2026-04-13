import Button from '@/components/button';
import Modal from '@/components/modal';
import { formatCurrency } from '@/utils/number';
import type { SimpananBatch } from '../types';
import {
    buildRekeningDetail,
    getBatchTransactions,
    summarizeInvoice,
    tipeTransaksiLabel,
} from '../utils';
import { formatDateTimeLong } from '@/utils/text';

type Props = {
    selectedInvoiceBatch: SimpananBatch | null;
    onClose: () => void;
    onExportPdf: () => void;
};

export default function SimpananInvoicePreviewModal({
    selectedInvoiceBatch,
    onClose,
    onExportPdf,
}: Props) {
    const summary = summarizeInvoice(selectedInvoiceBatch);
    const transactions = getBatchTransactions(selectedInvoiceBatch);

    return (
        <Modal
            open={selectedInvoiceBatch !== null}
            title={
                selectedInvoiceBatch
                    ? `Preview Invoice - ${selectedInvoiceBatch.kode_transaksi}`
                    : 'Preview Invoice'
            }
            description={
                selectedInvoiceBatch
                    ? `${selectedInvoiceBatch.anggota?.no_anggota ?? '-'} - ${selectedInvoiceBatch.anggota?.nama ?? '-'}`
                    : undefined
            }
            onClose={onClose}
            maxWidthClassName="max-w-5xl"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                    <Button variant="primary" onClick={onExportPdf}>
                        Export PDF
                    </Button>
                </>
            }
        >
            {selectedInvoiceBatch ? (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                    Kode Transaksi
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                    {selectedInvoiceBatch.kode_transaksi}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {formatDateTimeLong(
                                        selectedInvoiceBatch.tanggal_transaksi,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm">
                                <p className="text-slate-500">Petugas</p>
                                <p className="font-semibold text-slate-900">
                                    {selectedInvoiceBatch.user?.name ?? '-'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-xl bg-white p-3">
                                <p className="text-xs tracking-wide text-slate-500 uppercase">
                                    Anggota
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {selectedInvoiceBatch.anggota?.no_anggota ??
                                        '-'}{' '}
                                    -{' '}
                                    {selectedInvoiceBatch.anggota?.nama ?? '-'}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white p-3">
                                <p className="text-xs tracking-wide text-slate-500 uppercase">
                                    Total
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    Rp{' '}
                                    {formatCurrency(
                                        Number(selectedInvoiceBatch.total ?? 0),
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="min-w-full border-collapse text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        No
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        Tipe
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        Rekening Simpanan
                                    </th>
                                    <th className="px-3 py-2 text-right font-semibold">
                                        Jumlah
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? (
                                    transactions.map((transaction, index) => (
                                        <tr
                                            key={transaction.id}
                                            className="border-t border-slate-200"
                                        >
                                            <td className="px-3 py-2 align-top text-slate-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-3 py-2 align-top font-medium text-slate-900">
                                                {
                                                    tipeTransaksiLabel[
                                                        transaction
                                                            .jenis_transaksi
                                                    ]
                                                }
                                            </td>
                                            <td className="px-3 py-2 align-top text-slate-700">
                                                <div className="font-medium text-slate-900">
                                                    {buildRekeningDetail(
                                                        transaction,
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {transaction.keterangan ??
                                                        '-'}
                                                </p>
                                            </td>
                                            <td className="px-3 py-2 text-right align-top font-semibold text-slate-900">
                                                Rp{' '}
                                                {formatCurrency(
                                                    Number(
                                                        transaction.jumlah ?? 0,
                                                    ),
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-3 py-6 text-center text-slate-500"
                                        >
                                            Tidak ada detail transaksi pada
                                            batch ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}
