import { Head, router, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import Modal from '@/components/modal';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import TabunganFormCard from './partials/TabunganFormCard';
import TabunganTableNominalSection from './partials/TabunganTableNominalSection';
import TabunganTransaksiTableSection from './partials/TabunganTransaksiTableSection';
import {
    initialTabunganForm,
    initialTarikTabunganForm,
    type AnggotaOption,
    type TabunganForm,
    type TabunganNominalRow,
    type TarikTabunganTarget,
    type TarikTabunganForm,
    type TabunganPageProps,
} from './types';

function formatIdr(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function TabunganIndex() {
    const { props } = usePage<{ props: TabunganPageProps }>();
    const pageProps = props as unknown as TabunganPageProps;
    const rekeningKoperasiData = pageProps.rekening_koperasi ?? [];
    const rawTabungan = pageProps.tabungan ?? [];

    const [anggotaData, setAnggotaData] = useState<AnggotaOption[]>([]);
    const [formData, setFormData] = useState<TabunganForm>(initialTabunganForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingFormData, setIsLoadingFormData] = useState(false);

    const [isTarikSubmitting, setIsTarikSubmitting] = useState(false);
    const [tarikTarget, setTarikTarget] = useState<TarikTabunganTarget | null>(
        null,
    );
    const [tarikForm, setTarikForm] = useState<TarikTabunganForm>(
        initialTarikTabunganForm(),
    );

    const [selectedAnggota, setSelectedAnggota] =
        useState<TabunganNominalRow | null>(null);
    const [selectedAnggotaTransaksi, setSelectedAnggotaTransaksi] = useState<
        any[]
    >([]);
    const [isLoadingTransaksi, setIsLoadingTransaksi] = useState(false);

    // Load form data (anggota) once when component mounts
    useEffect(() => {
        const loadFormData = async () => {
            setIsLoadingFormData(true);
            try {
                const res = await fetch('/tabungan/options/anggota');

                if (!res.ok) {
                    throw new Error('Failed to load anggota options');
                }

                const data = (await res.json()) as { anggota: AnggotaOption[] };
                setAnggotaData(data.anggota);
            } catch (error) {
                console.error('Error loading anggota options:', error);
                toast.error(
                    'Gagal memuat data anggota. Silakan refresh halaman.',
                );
            } finally {
                setIsLoadingFormData(false);
            }
        };

        loadFormData();
    }, []);

    // Load transaksi for selected anggota
    useEffect(() => {
        if (!selectedAnggota?.anggota_id) {
            setSelectedAnggotaTransaksi([]);
            return;
        }

        setIsLoadingTransaksi(true);
        try {
            const transaksiFiltered = (rawTabungan.data || [])
                .filter(
                    (t: any) =>
                        t.rekening_simpanan?.anggota?.id ===
                        selectedAnggota.anggota_id,
                )
                .map((t: any) => ({
                    id: t.id,
                    kode_transaksi: t.batch?.kode_transaksi || '-',
                    jenis_transaksi: t.jenis_transaksi,
                    jumlah: Number(t.jumlah ?? 0),
                    keterangan: t.keterangan,
                    created_at: t.created_at,
                }))
                .sort(
                    (a: any, b: any) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime(),
                );

            setSelectedAnggotaTransaksi(transaksiFiltered);
            // Debug
            if (transaksiFiltered.length > 0) {
                console.log('First transaksi sample:', transaksiFiltered[0]);
            }
        } catch (error) {
            console.error('Error loading transaksi:', error);
            toast.error('Gagal memuat data transaksi.');
        } finally {
            setIsLoadingTransaksi(false);
        }
    }, [selectedAnggota, rawTabungan]);

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

    const nominalPerAnggota = useMemo<TabunganNominalRow[]>(() => {
        const grouped = new Map<string, TabunganNominalRow>();

        // Build summary from rawTabungan
        for (const transaksi of rawTabungan.data || []) {
            if (!transaksi.rekening_simpanan) {
                continue;
            }

            const rekening = transaksi.rekening_simpanan;
            const anggotaId =
                rekening.anggota?.id ??
                rekening.anggota?.no_anggota ??
                rekening.anggota?.nama ??
                'tanpa-anggota';
            const anggotaNama = rekening.anggota?.nama ?? 'Tanpa nama';
            const noAnggota = rekening.anggota?.no_anggota ?? '-';
            const saldo = Number(rekening.saldo ?? 0);

            const current = grouped.get(anggotaId) ?? {
                id: anggotaId,
                anggota_id: rekening.anggota?.id ?? null,
                no_anggota: noAnggota,
                nama: anggotaNama,
                nominal: 0,
            };

            current.nominal = saldo;
            grouped.set(anggotaId, current);
        }

        return Array.from(grouped.values()).sort((a, b) =>
            a.nama.localeCompare(b.nama, 'id-ID'),
        );
    }, [rawTabungan]);

    const onChangeField = <K extends keyof TabunganForm>(
        field: K,
        value: TabunganForm[K],
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData(initialTabunganForm);
    };

    const submitTabungan = () => {
        if (!formData.anggota_id) {
            toast.error('Anggota wajib dipilih');
            return;
        }

        if (!formData.rekening_koperasi_id) {
            toast.error('Rekening koperasi wajib dipilih');
            return;
        }

        const jumlah = Number(formData.jumlah || 0);
        if (Number.isNaN(jumlah) || jumlah < 0) {
            toast.error('Nominal tabungan tidak boleh negatif');
            return;
        }

        setIsSubmitting(true);

        router.post('/tabungan', formData, {
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat menambahkan tabungan',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const openTarikModal = (payload: TarikTabunganTarget) => {
        setTarikTarget(payload);
        setTarikForm({
            ...initialTarikTabunganForm(),
            jumlah: String(Math.max(0, Math.floor(payload.maxTarikTabungan))),
        });
    };

    const closeTarikModal = () => {
        setTarikTarget(null);
        setTarikForm(initialTarikTabunganForm());
    };

    const submitTarikTabungan = () => {
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

        if (jumlah > tarikTarget.maxTarikTabungan) {
            toast.error('Nominal tarik tidak boleh melebihi saldo tabungan');
            return;
        }

        setIsTarikSubmitting(true);

        router.post(
            '/tabungan/tarik',
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
                    router.get('/tabungan', {}, { preserveScroll: true });
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        firstError
                            ? String(firstError)
                            : 'Terjadi kesalahan saat memproses tarik tabungan',
                    );
                },
                onFinish: () => {
                    setIsTarikSubmitting(false);
                },
            },
        );
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submitTabungan();
    };

    return (
        <>
            <Head title="Tabungan" />

            <section className="space-y-4">
                <TabunganFormCard
                    formData={formData}
                    isSubmitting={isSubmitting}
                    isLoadingOptions={isLoadingFormData}
                    isRekeningMinus={isSelectedRekeningMinus}
                    rekeningKoperasiOptions={rekeningKoperasiOptions}
                    anggotaOptions={anggotaOptions}
                    onSubmit={handleSubmit}
                    onChangeField={onChangeField}
                    onReset={resetForm}
                />

                <TabunganTableNominalSection
                    data={nominalPerAnggota}
                    onRequestTarik={openTarikModal}
                    onRequestLihatTransaksi={setSelectedAnggota}
                />

                {selectedAnggota && (
                    <TabunganTransaksiTableSection
                        selectedAnggota={selectedAnggota}
                        transaksi={selectedAnggotaTransaksi}
                        onClose={() => setSelectedAnggota(null)}
                    />
                )}
            </section>

            {/* Modal Tarik Tabungan */}
            <Modal
                open={tarikTarget !== null}
                title="Tarik Saldo Tabungan"
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
                            onClick={submitTarikTabungan}
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
                                ? `Maksimal: Rp ${tarikTarget.maxTarikTabungan.toLocaleString('id-ID')}`
                                : undefined
                        }
                        onCurrencyValueChange={(value) => {
                            const maxTarik = tarikTarget?.maxTarikTabungan ?? 0;
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
        </>
    );
}

TabunganIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Tabungan">{page}</DashboardLayout>
);
