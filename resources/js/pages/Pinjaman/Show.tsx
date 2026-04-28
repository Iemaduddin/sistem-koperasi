import type { ReactElement } from 'react';
import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import Button from '@/components/button';
import Modal from '@/components/modal';
import FloatingInput from '@/components/floating-input/input';
import type {
    AngsuranPinjaman,
    BayarAngsuranForm,
    PinjamanShowProps,
} from './types';
import { initialBayarAngsuranForm } from './types';
import {
    buildInvoiceHtml,
    formatRupiah,
    formatTanggal,
    getLabelStatusAngsuran,
    getLabelStatusPinjaman,
    hitungEstimasiDenda,
    hitungHariTerlambat,
    hitungProgressPersen,
    isTerlambat,
} from './utils';
import PinjamanInvoicePreviewModal from './partials/PinjamanInvoicePreviewModal';
import { LuEye } from 'react-icons/lu';

export default function PinjamanShow() {
    const { props } = usePage<{ props: PinjamanShowProps }>();
    const pageProps = props as unknown as PinjamanShowProps;
    const pinjaman = pageProps.pinjaman;
    const angsuranList = pinjaman.angsuran ?? [];

    const lunasCount = angsuranList.filter((a) => a.status === 'lunas').length;
    const canPelunasanAwal =
        pinjaman.status !== 'lunas' && lunasCount >= angsuranList.length * 0.5;

    const [bayarForm, setBayarForm] = useState<BayarAngsuranForm>(
        initialBayarAngsuranForm(),
    );
    const [selectedAngsuran, setSelectedAngsuran] =
        useState<AngsuranPinjaman | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [pelunasanConfirmOpen, setPelunasanConfirmOpen] = useState(false);
    const [isPelunasanSubmitting, setIsPelunasanSubmitting] = useState(false);

    const [invoiceAngsuran, setInvoiceAngsuran] =
        useState<AngsuranPinjaman | null>(null);

    const openBayarModal = (angsuran: AngsuranPinjaman) => {
        const totalPokokBungaDibayar =
            angsuran.transaksi?.reduce(
                (sum, t) => sum + Number(t.jumlah_bayar),
                0,
            ) ?? 0;
        const sisaPokokBunga =
            Number(angsuran.pokok) +
            Number(angsuran.bunga) -
            totalPokokBungaDibayar;

        const estimasiDenda = hitungEstimasiDenda(
            angsuran,
            pinjaman.jumlah_pinjaman,
        );

        setBayarForm({
            angsuran_id: angsuran.id,
            jumlah_bayar: String(Math.max(0, sisaPokokBunga)),
            denda_dibayar: String(estimasiDenda),
            tanggal_bayar: new Date().toISOString().substring(0, 10),
        });
        setSelectedAngsuran(angsuran);
    };

    const closeBayarModal = () => {
        setSelectedAngsuran(null);
        setBayarForm(initialBayarAngsuranForm());
    };

    const handleBayar = () => {
        if (!selectedAngsuran) return;

        const jumlah = Number(bayarForm.jumlah_bayar);
        if (Number.isNaN(jumlah) || jumlah <= 0) {
            toast.error('Jumlah bayar harus lebih dari 0.');
            return;
        }

        setIsSubmitting(true);

        router.post(`/pinjaman/${pinjaman.id}/bayar`, bayarForm, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as any).flash;
                if (!flash?.error) {
                    closeBayarModal();
                }
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Gagal memproses pembayaran.',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handlePelunasan = () => {
        setIsPelunasanSubmitting(true);
        router.post(
            `/pinjaman/${pinjaman.id}/pelunasan`,
            { tanggal_pelunasan: new Date().toISOString().substring(0, 10) },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = (page.props as any).flash;
                    if (!flash?.error) {
                        setPelunasanConfirmOpen(false);
                    }
                },
                onError: () => {
                    toast.error('Gagal memproses pelunasan pinjaman.');
                },
                onFinish: () => {
                    setIsPelunasanSubmitting(false);
                },
            },
        );
    };

    const exportInvoiceToPdf = async () => {
        if (!invoiceAngsuran) return;

        const previewWindow = window.open(
            '',
            '_blank',
            'width=1200,height=900',
        );

        if (!previewWindow) {
            toast.error('Gagal membuka jendela preview. Pastikan popup tidak diblokir.');
            return;
        }

        const invoiceHtml = await buildInvoiceHtml(pinjaman, invoiceAngsuran);

        previewWindow.document.open();
        previewWindow.document.write(invoiceHtml);
        previewWindow.document.close();
        previewWindow.focus();

        setTimeout(() => {
            previewWindow.print();
        }, 300);
    };

    const progressPersen = hitungProgressPersen(pinjaman);

    const statusBadgeClass =
        pinjaman.status === 'lunas'
            ? 'bg-green-100 text-green-800'
            : 'bg-blue-100 text-blue-800';

    return (
        <>
            <Head
                title={`Detail Pinjaman – ${pinjaman.anggota?.nama ?? '-'}`}
            />

            <section className="space-y-6">
                {/* ── Info pinjaman ─────────────────────────────────────────── */}
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-neutral-800">
                            Detail Pinjaman
                        </h2>
                        <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass}`}
                        >
                            {getLabelStatusPinjaman(pinjaman.status)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <InfoItem
                            label="Anggota"
                            value={`${pinjaman.anggota?.no_anggota ?? '-'} – ${pinjaman.anggota?.nama ?? '-'}`}
                        />
                        <InfoItem
                            label="Jumlah Pinjaman"
                            value={formatRupiah(pinjaman.jumlah_pinjaman)}
                        />
                        <InfoItem
                            label="Bunga / Bulan"
                            value={`${pinjaman.bunga_persen}%`}
                        />
                        <InfoItem
                            label="Tenor"
                            value={`${pinjaman.tenor_bulan} bulan`}
                        />
                        <InfoItem
                            label="Angsuran / Bulan"
                            value={formatRupiah(pinjaman.jumlah_angsuran)}
                        />
                        <InfoItem
                            label="Tanggal Mulai"
                            value={formatTanggal(pinjaman.tanggal_mulai)}
                        />
                    </div>

                    {/* Progress bar */}
                    <div className="mt-5">
                        <div className="mb-1 flex justify-between text-sm text-neutral-600">
                            <span>Progress Pelunasan</span>
                            <span>{progressPersen}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                            <div
                                className="h-full rounded-full bg-green-500 transition-all"
                                style={{ width: `${progressPersen}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Aksi Tambahan ─────────────────────────────────────────── */}
                {canPelunasanAwal && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-green-800">
                                    Pelunasan Lebih Awal
                                </h3>
                                <p className="mt-1 text-sm text-green-700">
                                    Angsuran sudah berjalan {lunasCount} dari{' '}
                                    {angsuranList.length} bulan (≥ 50%). Anda
                                    dapat melunasi seluruh sisa pinjaman
                                    sekaligus dengan diskon bunga untuk{' '}
                                    {Math.floor(angsuranList.length * 0.2)}{' '}
                                    bulan angsuran terakhir.
                                </p>
                            </div>
                            <Button
                                variant="primary"
                                onClick={() => setPelunasanConfirmOpen(true)}
                            >
                                Pelunasi Semua
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Jadwal angsuran ───────────────────────────────────────── */}
                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <div className="border-b border-neutral-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-neutral-800">
                            Jadwal Angsuran
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 text-xs font-medium tracking-wider text-neutral-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Ke</th>
                                    <th className="px-4 py-3 text-left">
                                        Jatuh Tempo
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Pokok
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Bunga
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Denda
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Total Tagihan
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Dibayar
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {angsuranList.map((angsuran) => {
                                    const terlambat = isTerlambat(angsuran);
                                    const isLunas = angsuran.status === 'lunas';
                                    const hariTerlambat =
                                        terlambat && !isLunas
                                            ? hitungHariTerlambat(angsuran)
                                            : 0;
                                    const estimasiDenda =
                                        terlambat && !isLunas
                                            ? hitungEstimasiDenda(
                                                  angsuran,
                                                  pinjaman.jumlah_pinjaman,
                                              )
                                            : 0;
                                    const statusLabel = getLabelStatusAngsuran(
                                        angsuran.status,
                                    );
                                    const totalTagihanTampil =
                                        Number(angsuran.pokok) +
                                        Number(angsuran.bunga) +
                                        Number(
                                            isLunas
                                                ? angsuran.denda
                                                : estimasiDenda,
                                        );

                                    const badgeClass = isLunas
                                        ? 'bg-green-100 text-green-700'
                                        : terlambat
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-neutral-100 text-neutral-600';

                                    return (
                                        <tr
                                            key={angsuran.id}
                                            className={
                                                terlambat && !isLunas
                                                    ? 'bg-red-50'
                                                    : ''
                                            }
                                        >
                                            <td className="px-4 py-3 font-medium text-neutral-700">
                                                {angsuran.angsuran_ke}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                <div className="flex flex-col gap-0.5">
                                                    <span>
                                                        {formatTanggal(
                                                            angsuran.tanggal_jatuh_tempo,
                                                        )}
                                                    </span>
                                                    {terlambat && !isLunas && (
                                                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                                                            ⚠ Terlambat{' '}
                                                            {hariTerlambat} hari
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-neutral-700">
                                                {formatRupiah(angsuran.pokok)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-neutral-700">
                                                {formatRupiah(angsuran.bunga)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {terlambat && !isLunas ? (
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className="font-semibold text-red-600">
                                                            {formatRupiah(
                                                                estimasiDenda,
                                                            )}
                                                        </span>
                                                        {Number(
                                                            angsuran.denda,
                                                        ) === 0 && (
                                                            <span className="text-xs text-red-400">
                                                                estimasi
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-700">
                                                        {formatRupiah(
                                                            angsuran.denda,
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-neutral-800">
                                                {formatRupiah(
                                                    totalTagihanTampil,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-neutral-700">
                                                {formatRupiah(
                                                    angsuran.jumlah_dibayar,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                                                >
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {!isLunas && (
                                                        <Button
                                                            type="button"
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() =>
                                                                openBayarModal(
                                                                    angsuran,
                                                                )
                                                            }
                                                        >
                                                            Bayar
                                                        </Button>
                                                    )}
                                                    {isLunas && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1.5"
                                                            onClick={() =>
                                                                setInvoiceAngsuran(
                                                                    angsuran,
                                                                )
                                                            }
                                                        >
                                                            <LuEye className="h-4 w-4" />
                                                            Lihat
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {angsuranList.length === 0 && (
                            <p className="py-8 text-center text-sm text-neutral-400">
                                Belum ada jadwal angsuran.
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Kembali ───────────────────────────────────────────────── */}
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit('/pinjaman')}
                    >
                        ← Kembali ke Daftar Pinjaman
                    </Button>
                </div>
            </section>

            <Modal
                open={selectedAngsuran !== null}
                title={`Bayar Angsuran ke-${selectedAngsuran?.angsuran_ke ?? ''}`}
                description={
                    selectedAngsuran
                        ? `Tagihan (Pokok + Bunga): ${formatRupiah(Number(selectedAngsuran.pokok) + Number(selectedAngsuran.bunga))}${isTerlambat(selectedAngsuran) ? ` · Terlambat ${hitungHariTerlambat(selectedAngsuran)} hari` : ''}`
                        : undefined
                }
                onClose={closeBayarModal}
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeBayarModal}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            onClick={handleBayar}
                        >
                            Proses Pembayaran
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    {selectedAngsuran && isTerlambat(selectedAngsuran) && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <p className="font-semibold">
                                ⚠ Angsuran Terlambat{' '}
                                {hitungHariTerlambat(selectedAngsuran)} Hari
                            </p>
                            <p className="mt-0.5 text-red-600">
                                Denda keterlambatan:{' '}
                                <span className="font-semibold">
                                    {formatRupiah(
                                        hitungEstimasiDenda(
                                            selectedAngsuran,
                                            pinjaman.jumlah_pinjaman,
                                        ),
                                    )}
                                </span>
                                {Number(selectedAngsuran.denda) === 0 &&
                                    ' (estimasi, dihitung final oleh sistem)'}
                            </p>
                        </div>
                    )}
                    <FloatingInput
                        label="Jumlah Bayar (Pokok + Bunga)"
                        type="rupiah"
                        value={bayarForm.jumlah_bayar}
                        onCurrencyValueChange={(value) =>
                            setBayarForm((prev) => ({
                                ...prev,
                                jumlah_bayar: String(
                                    Math.max(0, Math.floor(value.numeric ?? 0)),
                                ),
                            }))
                        }
                        required
                    />
                    <FloatingInput
                        label="Denda Dibayar (dapat diubah)"
                        type="rupiah"
                        value={bayarForm.denda_dibayar}
                        onCurrencyValueChange={(value) =>
                            setBayarForm((prev) => ({
                                ...prev,
                                denda_dibayar: String(
                                    Math.max(0, Math.floor(value.numeric ?? 0)),
                                ),
                            }))
                        }
                    />
                    <FloatingInput
                        label="Tanggal Bayar"
                        type="date"
                        value={bayarForm.tanggal_bayar}
                        onChange={(e) =>
                            setBayarForm((prev) => ({
                                ...prev,
                                tanggal_bayar: e.target.value,
                            }))
                        }
                        required
                    />
                </div>
            </Modal>

            {/* ── Modal Konfirmasi Pelunasan ─────────────────────────────────────── */}
            <Modal
                children={undefined}
                open={pelunasanConfirmOpen}
                title="Konfirmasi Pelunasan Pinjaman"
                description="Anda akan melunasi seluruh sisa angsuran pinjaman ini. Sesuai ketentuan, beban bunga untuk persentase sisa bulan terakhir akan dibebaskan. Lanjutkan?"
                onClose={() => setPelunasanConfirmOpen(false)}
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPelunasanConfirmOpen(false)}
                            disabled={isPelunasanSubmitting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            loading={isPelunasanSubmitting}
                            disabled={isPelunasanSubmitting}
                            onClick={handlePelunasan}
                        >
                            Ya, Pelunasi Semua
                        </Button>
                    </>
                }
            />

            <PinjamanInvoicePreviewModal
                pinjaman={pinjaman}
                selectedAngsuran={invoiceAngsuran}
                onClose={() => setInvoiceAngsuran(null)}
                onExportPdf={exportInvoiceToPdf}
            />
        </>
    );
}

// Helper kecil pure component
function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-neutral-400">{label}</p>
            <p className="mt-0.5 font-medium text-neutral-800">{value}</p>
        </div>
    );
}

PinjamanShow.layout = (page: ReactElement) => (
    <DashboardLayout title="Detail Pinjaman">{page}</DashboardLayout>
);
