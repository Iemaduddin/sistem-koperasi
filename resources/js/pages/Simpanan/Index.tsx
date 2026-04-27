import { Head, router, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/button';
import ConfirmDialog from '@/components/confirm-dialog';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import Modal from '@/components/modal';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import SimpananFormCard from './partials/SimpananFormCard';
import SimpananTableCard from './partials/SimpananTableCard';
import {
    initialSimpananForm,
    type AnggotaOption,
    type RekeningSimpananOption,
    type SimpananForm,
    type SimpananPageProps,
} from './types';
import {
    buildPayload,
    getFirstValidationError,
    validatePayload,
} from './validation';

type TarikSukarelaTarget = {
    anggotaId: string;
    anggotaLabel: string;
    maxTarikSukarela: number;
};

type TarikSukarelaForm = {
    rekening_koperasi_id: string;
    jumlah: string;
    keterangan: string;
    created_at: string;
};

function toDatetimeLocalValue(value: Date): string {
    const pad = (input: number) => String(input).padStart(2, '0');

    return (
        [
            value.getFullYear(),
            pad(value.getMonth() + 1),
            pad(value.getDate()),
        ].join('-') + `T${pad(value.getHours())}:${pad(value.getMinutes())}`
    );
}

const initialTarikSukarelaForm = (): TarikSukarelaForm => ({
    rekening_koperasi_id: '',
    jumlah: '',
    keterangan: '',
    created_at: toDatetimeLocalValue(new Date()),
});

function formatIdr(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function SimpananIndex() {
    const { props } = usePage<{ props: SimpananPageProps }>();
    const pageProps = props as unknown as SimpananPageProps;
    const rows = pageProps.simpanan ?? [];
    const rekeningKoperasiData = pageProps.rekening_koperasi ?? [];

    const [anggotaData, setAnggotaData] = useState<AnggotaOption[]>([]);
    const [rekeningSimpananData, setRekeningSimpananData] = useState<
        RekeningSimpananOption[]
    >([]);
    const [isLoadingFormData, setIsLoadingFormData] = useState(false);

    const [formData, setFormData] = useState<SimpananForm>(initialSimpananForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTarikSubmitting, setIsTarikSubmitting] = useState(false);
    const [overflowConfirmMessage, setOverflowConfirmMessage] = useState('');
    const [isOverflowConfirmOpen, setIsOverflowConfirmOpen] = useState(false);
    const [tarikTarget, setTarikTarget] = useState<TarikSukarelaTarget | null>(
        null,
    );
    const [tarikForm, setTarikForm] = useState<TarikSukarelaForm>(
        initialTarikSukarelaForm,
    );

    // Load form data (anggota & rekening simpanan) once when component mounts
    useEffect(() => {
        const loadFormData = async () => {
            setIsLoadingFormData(true);
            try {
                const [anggotaRes, rekeningSimpananRes] = await Promise.all([
                    fetch('/simpanan/options/anggota'),
                    fetch('/simpanan/options/rekening-simpanan'),
                ]);

                if (!anggotaRes.ok || !rekeningSimpananRes.ok) {
                    throw new Error('Failed to load form options');
                }

                const anggotaData = (await anggotaRes.json()) as {
                    anggota: AnggotaOption[];
                };
                const rekeningSimpananData =
                    (await rekeningSimpananRes.json()) as {
                        rekening_simpanan: RekeningSimpananOption[];
                    };

                setAnggotaData(anggotaData.anggota);
                setRekeningSimpananData(rekeningSimpananData.rekening_simpanan);
            } catch (error) {
                console.error('Error loading form options:', error);
                toast.error('Gagal memuat data form. Silakan refresh halaman.');
            } finally {
                setIsLoadingFormData(false);
            }
        };

        loadFormData();
    }, []);

    const rekeningKoperasiOptions = useMemo(
        () =>
            rekeningKoperasiData.map((rekening) => {
                const saldo = Number(rekening.saldo ?? 0);
                const isPositiveOrZero = saldo >= 0;
                const absFormattedSaldo = formatIdr(Math.abs(saldo));

                return {
                    value: rekening.id,
                    label: `${rekening.nama} (${rekening.jenis})${rekening.nomor_rekening ? ` - ${rekening.nomor_rekening}` : ''} ${absFormattedSaldo}`,
                    richLabel: (
                        <span>
                            {rekening.nama} ({rekening.jenis})
                            {rekening.nomor_rekening
                                ? ` - ${rekening.nomor_rekening} -`
                                : ''}{' '}
                            <span
                                className={
                                    isPositiveOrZero
                                        ? 'font-semibold text-emerald-600'
                                        : 'font-semibold text-red-600'
                                }
                            >
                                {absFormattedSaldo}
                            </span>
                        </span>
                    ),
                };
            }),
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

    const rekeningKoperasiSaldoById = useMemo(() => {
        const map = new Map<string, number>();

        for (const rekening of rekeningKoperasiData) {
            const saldo = Number(rekening.saldo ?? 0);
            map.set(rekening.id, Number.isNaN(saldo) ? 0 : saldo);
        }

        return map;
    }, [rekeningKoperasiData]);

    const isSelectedRekeningMinus = useMemo(() => {
        if (!formData.rekening_koperasi_id) {
            return false;
        }

        return (
            (rekeningKoperasiSaldoById.get(formData.rekening_koperasi_id) ??
                0) < 0
        );
    }, [formData.rekening_koperasi_id, rekeningKoperasiSaldoById]);

    const isSelectedTarikRekeningMinus = useMemo(() => {
        if (!tarikForm.rekening_koperasi_id) {
            return false;
        }

        return (
            (rekeningKoperasiSaldoById.get(tarikForm.rekening_koperasi_id) ??
                0) < 0
        );
    }, [rekeningKoperasiSaldoById, tarikForm.rekening_koperasi_id]);

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

    const wajibStatusByAnggota = useMemo(() => {
        const map = new Map<
            string,
            { saldo: number; maksimum: number | null; locked: boolean }
        >();

        for (const rekening of rekeningSimpananData) {
            const kode = (rekening.jenis_simpanan?.kode ?? '').toUpperCase();
            const anggotaId = rekening.anggota?.id;

            if (kode !== 'WAJIB' || !anggotaId) {
                continue;
            }

            const saldo = Number(rekening.saldo ?? 0);
            const maksimumRaw = rekening.jenis_simpanan?.jumlah_maksimum;
            const maksimum =
                maksimumRaw === null || maksimumRaw === undefined
                    ? null
                    : Number(maksimumRaw);

            const saldoValid = Number.isNaN(saldo) ? 0 : saldo;
            const maksimumValid =
                maksimum === null || Number.isNaN(maksimum) ? null : maksimum;

            map.set(anggotaId, {
                saldo: saldoValid,
                maksimum: maksimumValid,
                locked: maksimumValid !== null && saldoValid >= maksimumValid,
            });
        }

        return map;
    }, [rekeningSimpananData]);

    const selectedWajibStatus = useMemo(() => {
        if (!formData.anggota_id) {
            return {
                saldo: 0,
                maksimum: null as number | null,
                locked: false,
            };
        }

        return (
            wajibStatusByAnggota.get(formData.anggota_id) ?? {
                saldo: 0,
                maksimum: null as number | null,
                locked: false,
            }
        );
    }, [formData.anggota_id, wajibStatusByAnggota]);

    const isWajibLocked = selectedWajibStatus.locked;

    const pokokInfoText = isPokokLocked
        ? `Simpanan pokok anggota ini sudah terpenuhi (saldo saat ini: Rp ${selectedPokokSaldo.toLocaleString('id-ID')}). Pembayaran berikutnya hanya untuk simpanan wajib/sukarela.`
        : 'Simpanan pokok wajib dibayar pada transaksi pertama anggota.';

    const wajibInfoText = isWajibLocked
        ? `Simpanan wajib anggota ini sudah penuh (saldo saat ini: Rp ${selectedWajibStatus.saldo.toLocaleString('id-ID')}${
              selectedWajibStatus.maksimum !== null
                  ? ` dari maksimal Rp ${selectedWajibStatus.maksimum.toLocaleString('id-ID')}`
                  : ''
          }). Setoran berikutnya diarahkan ke simpanan sukarela.`
        : '';

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

    useEffect(() => {
        if (!isWajibLocked) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            simpanan_wajib_jumlah: '',
            simpanan_wajib_keterangan: '',
        }));
    }, [isWajibLocked]);

    const resetForm = () => {
        setFormData(initialSimpananForm);
    };

    const submitSimpanan = (alihkanSisaWajibKeSukarela = false) => {
        const payload = buildPayload(formData, alihkanSisaWajibKeSukarela);

        setIsSubmitting(true);

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

    const openTarikModal = (payload: TarikSukarelaTarget) => {
        setTarikTarget(payload);
        setTarikForm({
            ...initialTarikSukarelaForm(),
            jumlah: String(Math.max(0, Math.floor(payload.maxTarikSukarela))),
        });
    };

    const closeTarikModal = () => {
        setTarikTarget(null);
        setTarikForm(initialTarikSukarelaForm());
    };

    const submitTarikSukarela = () => {
        if (!tarikTarget) {
            return;
        }

        if (!tarikForm.rekening_koperasi_id) {
            toast.error('Rekening koperasi wajib dipilih');
            return;
        }

        const jumlah = Number(tarikForm.jumlah || 0);
        if (Number.isNaN(jumlah) || jumlah <= 0) {
            toast.error('Nominal tarik harus lebih dari 0');
            return;
        }

        if (jumlah > tarikTarget.maxTarikSukarela) {
            toast.error(
                'Nominal tarik tidak boleh melebihi saldo simpanan sukarela',
            );
            return;
        }

        setIsTarikSubmitting(true);

        router.post(
            '/simpanan/tarik-sukarela',
            {
                anggota_id: tarikTarget.anggotaId,
                rekening_koperasi_id: tarikForm.rekening_koperasi_id,
                jumlah,
                keterangan: tarikForm.keterangan,
                created_at: tarikForm.created_at,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeTarikModal();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        firstError
                            ? String(firstError)
                            : 'Terjadi kesalahan saat memproses tarik sukarela',
                    );
                },
                onFinish: () => {
                    setIsTarikSubmitting(false);
                },
            },
        );
    };

    return (
        <>
            <Head title="Simpanan" />

            <section className="space-y-4">
                <SimpananFormCard
                    formData={formData}
                    isSubmitting={isSubmitting}
                    isLoadingOptions={isLoadingFormData}
                    isRekeningMinus={isSelectedRekeningMinus}
                    isPokokLocked={isPokokLocked}
                    pokokInfoText={pokokInfoText}
                    isWajibLocked={isWajibLocked}
                    wajibInfoText={wajibInfoText}
                    rekeningKoperasiOptions={rekeningKoperasiOptions}
                    anggotaOptions={anggotaOptions}
                    onSubmit={handleSubmit}
                    onChangeField={onChangeField}
                />

                <SimpananTableCard
                    rows={rows}
                    rekeningSimpananData={rekeningSimpananData}
                    onRequestTarik={openTarikModal}
                />
            </section>

            <Modal
                open={tarikTarget !== null}
                title="Tarik Saldo Simpanan Sukarela"
                description={
                    tarikTarget
                        ? `Anggota: ${tarikTarget.anggotaLabel}`
                        : undefined
                }
                onClose={closeTarikModal}
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeTarikModal}
                            disabled={isTarikSubmitting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="warning"
                            loading={isTarikSubmitting}
                            disabled={
                                isTarikSubmitting ||
                                isSelectedTarikRekeningMinus
                            }
                            onClick={submitTarikSukarela}
                        >
                            Proses Tarik
                        </Button>
                    </>
                }
            >
                <div className="mt-2 grid grid-cols-1 gap-4">
                    <FloatingSelect
                        label="Rekening Koperasi"
                        value={tarikForm.rekening_koperasi_id}
                        options={rekeningKoperasiOptions}
                        onValueChange={(value) =>
                            setTarikForm((prev) => ({
                                ...prev,
                                rekening_koperasi_id: value,
                            }))
                        }
                        searchable
                        required
                    />

                    <FloatingInput
                        label="Nominal Tarik"
                        type="rupiah"
                        value={tarikForm.jumlah}
                        disabled={isSelectedTarikRekeningMinus}
                        helperText={
                            tarikTarget
                                ? `Maksimal: Rp ${tarikTarget.maxTarikSukarela.toLocaleString('id-ID')}`
                                : undefined
                        }
                        onCurrencyValueChange={(value) => {
                            const maxTarik = tarikTarget?.maxTarikSukarela ?? 0;
                            const numericValue = value.numeric ?? 0;
                            const clampedValue = Math.min(
                                numericValue,
                                maxTarik,
                            );

                            setTarikForm((prev) => ({
                                ...prev,
                                jumlah: String(
                                    Math.max(0, Math.floor(clampedValue)),
                                ),
                            }));
                        }}
                        required
                    />

                    <FloatingInput
                        label="Keterangan (Opsional)"
                        value={tarikForm.keterangan}
                        disabled={isSelectedTarikRekeningMinus}
                        onChange={(event) =>
                            setTarikForm((prev) => ({
                                ...prev,
                                keterangan: event.target.value,
                            }))
                        }
                    />

                    <FloatingInput
                        label="Tanggal Transaksi"
                        type="datetime-local"
                        value={tarikForm.created_at}
                        disabled={isSelectedTarikRekeningMinus}
                        onChange={(event) =>
                            setTarikForm((prev) => ({
                                ...prev,
                                created_at: event.target.value,
                            }))
                        }
                        required
                    />
                    {isSelectedTarikRekeningMinus && (
                        <p className="text-xs text-red-600">
                            Rekening koperasi yang dipilih bersaldo minus.
                            Proses tarik dinonaktifkan.
                        </p>
                    )}
                </div>
            </Modal>

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
