import { Head, router, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/button';
import Modal from '@/components/modal';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import DepositoFormCard from './partials/DepositoFormCard';
import DepositoTableCard from './partials/DepositoTableCard';
import {
    addMonths,
    createInitialDepositoForm,
    formatRupiah,
    getPersenBagiHasil,
    normalizeDateOnly,
    type DepositoForm,
    type DepositoPageProps,
} from './types';
import {
    buildPayload,
    buildPreviewLogs,
    getFirstValidationError,
    normalizeNumber,
    validatePayload,
} from './validation';

export default function DepositoIndex() {
    const { props } = usePage<{ props: DepositoPageProps }>();
    const pageProps = props as unknown as DepositoPageProps;
    const rekeningKoperasiData = pageProps.rekening_koperasi ?? [];
    const anggotaData = pageProps.anggota ?? [];
    const depositoRows = pageProps.simpanan_deposito ?? [];
    const rekeningSimpananRows = pageProps.rekening_simpanan ?? [];
    const jenisSimpananRows = pageProps.jenis_simpanan ?? [];

    const [formData, setFormData] = useState<DepositoForm>(
        createInitialDepositoForm(),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
    const lastRequirementKeyRef = useRef('');

    const tenor = Number(formData.tenor_bulan) || 0;

    useEffect(() => {
        const tenorPersen = getPersenBagiHasil(formData.tenor_bulan);
        setFormData((prev) => ({
            ...prev,
            persen_bagi_hasil: tenorPersen,
            tanggal_selesai: addMonths(
                prev.tanggal_mulai,
                Number(prev.tenor_bulan),
            ),
        }));
    }, [formData.tenor_bulan, formData.tanggal_mulai]);

    const rekeningKoperasiOptions = useMemo(
        () =>
            rekeningKoperasiData.map((rekening) => ({
                value: rekening.id,
                label: `${rekening.nama} (${rekening.jenis})${rekening.nomor_rekening ? ` - ${rekening.nomor_rekening}` : ''}`,
            })),
        [rekeningKoperasiData],
    );

    const anggotaOptions = useMemo(
        () =>
            anggotaData.map((anggota) => ({
                value: anggota.id,
                label: `${anggota.no_anggota} - ${anggota.nama}`,
            })),
        [anggotaData],
    );

    const saldoNumber = useMemo(
        () => normalizeNumber(formData.saldo) ?? 0,
        [formData.saldo],
    );

    const nominalBagiHasilBulanan = useMemo(
        () => Math.round(saldoNumber * (formData.persen_bagi_hasil / 100)),
        [formData.persen_bagi_hasil, saldoNumber],
    );

    const previewLogs = useMemo(
        () =>
            buildPreviewLogs(
                formData.tanggal_mulai,
                tenor,
                nominalBagiHasilBulanan,
            ),
        [formData.tanggal_mulai, nominalBagiHasilBulanan, tenor],
    );

    const totalBagiHasil = useMemo(
        () =>
            previewLogs.reduce(
                (total, row) => total + row.nominal_bagi_hasil,
                0,
            ),
        [previewLogs],
    );

    const minimumPokok = useMemo(() => {
        const jenis = jenisSimpananRows.find(
            (item) => (item.kode ?? '').toUpperCase() === 'POKOK',
        );
        const value = Number(jenis?.jumlah_minimum ?? 0);
        return Number.isNaN(value) ? 0 : value;
    }, [jenisSimpananRows]);

    const minimumWajib = useMemo(() => {
        const jenis = jenisSimpananRows.find(
            (item) => (item.kode ?? '').toUpperCase() === 'WAJIB',
        );
        const value = Number(jenis?.jumlah_minimum ?? 0);
        return Number.isNaN(value) ? 0 : value;
    }, [jenisSimpananRows]);

    const selectedAnggotaRequirement = useMemo(() => {
        if (!formData.anggota_id) {
            return {
                pokokSaldo: 0,
                wajibSaldo: 0,
                pokokIncomplete: false,
                wajibIncomplete: false,
                blocked: false,
                messages: [] as string[],
            };
        }

        let pokokSaldo = 0;
        let wajibSaldo = 0;

        for (const rekening of rekeningSimpananRows) {
            if (rekening.anggota_id !== formData.anggota_id) {
                continue;
            }

            const kode = (rekening.jenis_simpanan?.kode ?? '').toUpperCase();
            const saldo = Number(rekening.saldo ?? 0);
            const saldoValue = Number.isNaN(saldo) ? 0 : saldo;

            if (kode === 'POKOK') {
                pokokSaldo += saldoValue;
            }

            if (kode === 'WAJIB') {
                wajibSaldo += saldoValue;
            }
        }

        const pokokIncomplete = pokokSaldo <= 0;
        const wajibIncomplete = wajibSaldo <= 0;
        const messages: string[] = [];

        if (pokokIncomplete) {
            messages.push(
                `Simpanan pokok belum terpenuhi. Wajib setor ${formatRupiah(minimumPokok)}.`,
            );
        }

        if (wajibIncomplete) {
            messages.push(
                `Simpanan wajib belum terpenuhi. Wajib setor minimal ${formatRupiah(minimumWajib)}.`,
            );
        }

        return {
            pokokSaldo,
            wajibSaldo,
            pokokIncomplete,
            wajibIncomplete,
            blocked: pokokIncomplete || wajibIncomplete,
            messages,
        };
    }, [formData.anggota_id, minimumPokok, minimumWajib, rekeningSimpananRows]);

    const requirementHintText = selectedAnggotaRequirement.messages.join(' ');

    useEffect(() => {
        if (!formData.anggota_id || !selectedAnggotaRequirement.blocked) {
            return;
        }

        const key = `${formData.anggota_id}:${selectedAnggotaRequirement.messages.join('|')}`;

        if (lastRequirementKeyRef.current === key) {
            return;
        }

        lastRequirementKeyRef.current = key;
        setIsRequirementModalOpen(true);
    }, [
        formData.anggota_id,
        selectedAnggotaRequirement.blocked,
        selectedAnggotaRequirement.messages,
    ]);

    const onChangeField = <K extends keyof DepositoForm>(
        field: K,
        value: DepositoForm[K],
    ) => {
        if (field === 'tanggal_mulai') {
            const normalizedDate = normalizeDateOnly(String(value));
            setFormData((prev) => ({
                ...prev,
                tanggal_mulai: normalizedDate,
                tanggal_selesai: addMonths(
                    normalizedDate,
                    Number(prev.tenor_bulan),
                ),
            }));
            return;
        }

        if (field === 'tanggal_selesai') {
            setFormData((prev) => ({
                ...prev,
                tanggal_selesai: normalizeDateOnly(String(value)),
            }));
            return;
        }

        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData(createInitialDepositoForm());
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (selectedAnggotaRequirement.blocked) {
            setIsRequirementModalOpen(true);
            return;
        }

        const payload = buildPayload(formData, previewLogs);
        const validation = validatePayload(payload);

        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);

        router.post('/deposito', validation.data, {
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat menyimpan simpanan deposito',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Tabungan Berjangka" />

            <section className="space-y-4">
                <DepositoFormCard
                    formData={formData}
                    isSubmitting={isSubmitting}
                    isBlockedBySimpananRequirement={
                        selectedAnggotaRequirement.blocked
                    }
                    requirementHintText={requirementHintText}
                    rekeningKoperasiOptions={rekeningKoperasiOptions}
                    anggotaOptions={anggotaOptions}
                    onSubmit={handleSubmit}
                    onChangeField={onChangeField}
                />

                <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <h2 className="text-base font-semibold">
                        Ringkasan Bagi Hasil Tabungan Berjangka
                    </h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-emerald-200 bg-white p-3">
                            <p className="text-xs tracking-wide text-emerald-700 uppercase">
                                Bagi Hasil Per Bulan
                            </p>
                            <p className="mt-1 text-lg font-semibold text-emerald-900">
                                {formatRupiah(nominalBagiHasilBulanan)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-white p-3">
                            <p className="text-xs tracking-wide text-emerald-700 uppercase">
                                Total Hingga Selesai Tenor
                            </p>
                            <p className="mt-1 text-lg font-semibold text-emerald-900">
                                {formatRupiah(totalBagiHasil)}
                            </p>
                        </div>
                    </div>
                </section>

                <DepositoTableCard rows={depositoRows} />
            </section>

            <Modal
                open={isRequirementModalOpen}
                title="Simpanan Pokok/Wajib Belum Terpenuhi"
                description="Transaksi tabungan berjangka dinonaktifkan sementara untuk anggota ini."
                onClose={() => setIsRequirementModalOpen(false)}
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                router.visit('/simpanan', {
                                    preserveScroll: true,
                                })
                            }
                        >
                            Setor Simpanan
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsRequirementModalOpen(false)}
                        >
                            Tutup
                        </Button>
                    </div>
                }
            >
                <div className="space-y-2 text-sm text-slate-700">
                    {selectedAnggotaRequirement.messages.map((message) => (
                        <p key={message}>{message}</p>
                    ))}
                    <p>
                        Selesaikan setoran simpanan pokok/wajib terlebih dahulu
                        melalui menu Simpanan.
                    </p>
                </div>
            </Modal>
        </>
    );
}

DepositoIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Tabungan Berjangka">{page}</DashboardLayout>
);
