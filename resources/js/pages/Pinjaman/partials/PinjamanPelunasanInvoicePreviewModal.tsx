import Button from '@/components/button';
import Modal from '@/components/modal';
import type { PinjamanRow } from '../types';
import { formatRupiah, getLabelStatusPinjaman } from '../utils';
import { formatDateTimeLong } from '@/utils/text';
import { LuDownload } from 'react-icons/lu';

type Props = {
    pinjaman: PinjamanRow;
    open: boolean;
    onClose: () => void;
    onExportPdf: () => void;
};

export default function PinjamanPelunasanInvoicePreviewModal({
    pinjaman,
    open,
    onClose,
    onExportPdf,
}: Props) {
    if (!pinjaman) return null;

    const totalPokok = pinjaman.angsuran?.reduce((sum, a) => sum + Number(a.pokok), 0) ?? 0;
    const totalBunga = pinjaman.angsuran?.reduce((sum, a) => sum + Number(a.bunga), 0) ?? 0;
    const totalDenda = pinjaman.angsuran?.reduce((sum, a) => sum + Number(a.denda), 0) ?? 0;
    const totalBayar = pinjaman.angsuran?.reduce((sum, a) => sum + Number(a.jumlah_dibayar), 0) ?? 0;

    return (
        <Modal
            open={open}
            title="Preview Invoice Pelunasan"
            description={`${pinjaman.anggota?.no_anggota ?? '-'} - ${pinjaman.anggota?.nama ?? '-'}`}
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
                                ID Pelunasan
                            </p>
                            <p className="text-xl font-bold text-slate-900">
                                PLN-{pinjaman.id.substring(0, 8).toUpperCase()}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                {formatDateTimeLong(pinjaman.updated_at || new Date().toISOString())}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm">
                            <p className="text-slate-500">Status Pinjaman</p>
                            <p className="font-semibold text-green-600">
                                {getLabelStatusPinjaman(pinjaman.status)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-xl bg-white p-3">
                            <p className="text-xs tracking-wide text-slate-500 uppercase">
                                Anggota
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {pinjaman.anggota?.no_anggota ?? '-'} -{' '}
                                {pinjaman.anggota?.nama ?? '-'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                            <p className="text-xs tracking-wide text-slate-500 uppercase">
                                Total Pelunasan
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {formatRupiah(totalBayar)}
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
                                <th className="px-4 py-3 text-right font-semibold">
                                    Total Pokok
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Total Bagi Hasil
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Total Denda
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Subtotal
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {pinjaman.angsuran?.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3 text-slate-900">
                                        Angsuran Ke-{a.angsuran_ke}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-700">
                                        {formatRupiah(a.pokok)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-700">
                                        {formatRupiah(a.bunga)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-700">
                                        {formatRupiah(a.denda)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                                        {formatRupiah(a.jumlah_dibayar)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-3 text-right font-semibold text-slate-600"
                                >
                                    Total Keseluruhan
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                    {formatRupiah(totalBayar)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </Modal>
    );
}
