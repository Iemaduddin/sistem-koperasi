import { Head, router, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import ConfirmDialog from '@/components/confirm-dialog';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import SimpananFormCard from './partials/SimpananFormCard';
import SimpananTableCard from './partials/SimpananTableCard';
import {
    initialSimpananForm,
    type SimpananForm,
    type SimpananPageProps,
} from './types';
import {
    buildPayload,
    getFirstValidationError,
    validatePayload,
} from './validation';

export default function SimpananIndex() {
    const { props } = usePage<{ props: SimpananPageProps }>();
    const pageProps = props as unknown as SimpananPageProps;
    const rows = pageProps.simpanan ?? [];
    const rekeningKoperasiData = pageProps.rekening_koperasi ?? [];
    const anggotaData = pageProps.anggota ?? [];
    const rekeningSimpananData = pageProps.rekening_simpanan ?? [];

    const [formData, setFormData] = useState<SimpananForm>(initialSimpananForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [overflowConfirmMessage, setOverflowConfirmMessage] = useState('');
    const [isOverflowConfirmOpen, setIsOverflowConfirmOpen] = useState(false);

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
                label: `${anggota.no_anggota} - ${anggota.nama} - ${anggota.alamat}`,
            })),
        [anggotaData],
    );

    const pokokSaldoByAnggota = useMemo(() => {
        const map = new Map<string, number>();

        for (const rekening of rekeningSimpananData) {
            const kode = (rekening.jenis_simpanan?.kode ?? '').toUpperCase();
            const anggotaId = rekening.anggota?.id;

            if (kode !== 'POKOK' || !anggotaId) {
                continue;
            }

            const saldo = Number(rekening.saldo ?? 0);
            map.set(anggotaId, Number.isNaN(saldo) ? 0 : saldo);
        }

        return map;
    }, [rekeningSimpananData]);

    const selectedPokokSaldo = useMemo(() => {
        if (!formData.anggota_id) {
            return 0;
        }

        return pokokSaldoByAnggota.get(formData.anggota_id) ?? 0;
    }, [formData.anggota_id, pokokSaldoByAnggota]);

    const isPokokLocked = selectedPokokSaldo > 0;

    const pokokInfoText = isPokokLocked
        ? `Simpanan pokok anggota ini sudah terpenuhi (saldo saat ini: Rp ${selectedPokokSaldo.toLocaleString('id-ID')}). Pembayaran berikutnya hanya untuk simpanan wajib/sukarela.`
        : 'Simpanan pokok wajib dibayar pada transaksi pertama anggota.';

    const onChangeField = <K extends keyof SimpananForm>(
        field: K,
        value: SimpananForm[K],
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        if (!isPokokLocked) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            simpanan_pokok_jumlah: '',
            simpanan_pokok_keterangan: '',
        }));
    }, [isPokokLocked]);

    const resetForm = () => {
        setFormData(initialSimpananForm);
    };

    const submitSimpanan = (alihkanSisaWajibKeSukarela = false) => {
        setIsSubmitting(true);

        const payload = buildPayload(formData, alihkanSisaWajibKeSukarela);
        const validation = validatePayload(payload);

        if (!validation.success) {
            setIsSubmitting(false);
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        router.post('/simpanan', validation.data, {
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
                setIsOverflowConfirmOpen(false);
                setOverflowConfirmMessage('');
            },
            onError: (errors) => {
                const overflowError = errors.alihkan_sisa_wajib_ke_sukarela;
                if (overflowError) {
                    setOverflowConfirmMessage(String(overflowError));
                    setIsOverflowConfirmOpen(true);
                    return;
                }

                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat menambahkan transaksi simpanan',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submitSimpanan(false);
    };

    const handleConfirmOverflowTransfer = () => {
        setIsOverflowConfirmOpen(false);
        submitSimpanan(true);
    };

    return (
        <>
            <Head title="Simpanan" />

            <section className="space-y-4">
                <SimpananFormCard
                    formData={formData}
                    isSubmitting={isSubmitting}
                    isPokokLocked={isPokokLocked}
                    pokokInfoText={pokokInfoText}
                    rekeningKoperasiOptions={rekeningKoperasiOptions}
                    anggotaOptions={anggotaOptions}
                    onSubmit={handleSubmit}
                    onChangeField={onChangeField}
                />

                <SimpananTableCard rows={rows} />
            </section>

            <ConfirmDialog
                open={isOverflowConfirmOpen}
                title="Simpanan Wajib Penuh"
                description={
                    overflowConfirmMessage ||
                    'Sisa setoran simpanan wajib akan dialihkan ke simpanan sukarela. Lanjutkan?'
                }
                tone="warning"
                icon={
                    <span className="text-2xl leading-none font-bold">!</span>
                }
                confirmText="Lanjutkan"
                isLoading={isSubmitting}
                onConfirm={handleConfirmOverflowTransfer}
                onCancel={() => {
                    setIsOverflowConfirmOpen(false);
                    setOverflowConfirmMessage('');
                }}
            />
        </>
    );
}

SimpananIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Simpanan">{page}</DashboardLayout>
);
