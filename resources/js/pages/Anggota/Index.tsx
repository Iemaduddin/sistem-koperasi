import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import ConfirmDialog from '@/components/confirm-dialog';
import FloatingInput from '@/components/floating-input/input';
import FloatingTextarea from '@/components/floating-input/textarea';
import Modal from '@/components/modal';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import type { AnggotaForm, AnggotaPageProps, AnggotaRow } from './types';
import { initialAnggotaForm } from './types';
import {
    buildPayload,
    createAnggotaSchema,
    getFirstValidationError,
    updateAnggotaSchema,
} from './validation';
import AnggotaFormCard from './partials/AnggotaFormCard';
import AnggotaTableCard from './partials/AnggotaTableCard';

export default function AnggotaIndex() {
    const { props } = usePage<{ props: AnggotaPageProps }>();
    const pageProps = props as unknown as AnggotaPageProps;
    const anggota = pageProps.anggota ?? [];
    const statusOptions = pageProps.statusOptions ?? [
        'aktif',
        'nonaktif',
        'keluar',
    ];

    const [editingAnggotaId, setEditingAnggotaId] = useState<string | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] = useState<AnggotaRow | null>(null);
    const [setKeluarTarget, setSetKeluarTarget] = useState<AnggotaRow | null>(
        null,
    );
    const [setKeluarForm, setSetKeluarForm] = useState({
        alasan_keluar: '',
        tanggal_keluar: new Date().toISOString().slice(0, 10),
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSetKeluarSubmitting, setIsSetKeluarSubmitting] = useState(false);

    const createForm = useForm<AnggotaForm>(initialAnggotaForm);
    const updateForm = useForm<AnggotaForm>(initialAnggotaForm);

    const editingAnggota = useMemo(
        () => anggota.find((item) => item.id === editingAnggotaId) ?? null,
        [anggota, editingAnggotaId],
    );

    const submitCreate = () => {
        const payload = buildPayload(createForm.data);
        const validation = createAnggotaSchema.safeParse(payload);

        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);
        router.post('/anggota', validation.data, {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat menambahkan anggota',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const submitUpdate = () => {
        if (!editingAnggotaId) return;

        const payload = buildPayload(updateForm.data);
        const validation = updateAnggotaSchema.safeParse(payload);

        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);
        router.put(`/anggota/${editingAnggotaId}`, validation.data, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingAnggotaId(null);
                updateForm.reset();
                createForm.reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat memperbarui anggota',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingAnggotaId !== null) {
            submitUpdate();
            return;
        }

        submitCreate();
    };

    const handlePrimaryAction = () => {
        if (editingAnggotaId !== null) {
            submitUpdate();
            return;
        }

        submitCreate();
    };

    const startEdit = (item: AnggotaRow) => {
        setEditingAnggotaId(item.id);
        updateForm.setData({
            nik: item.nik,
            nama: item.nama,
            alamat: item.alamat,
            no_hp: item.no_hp,
            no_hp_cadangan: item.no_hp_cadangan ?? '',
            status: item.status,
            tanggal_bergabung: item.tanggal_bergabung,
        });
    };

    const removeAnggota = (id: string, nama: string) => {
        setDeleteTarget(
            anggota.find((item) => item.id === id) ?? {
                id,
                no_anggota: '',
                nik: '',
                nama,
                alamat: '',
                no_hp: '',
                no_hp_cadangan: null,
                status: 'aktif',
                tanggal_bergabung: '',
                created_at: null,
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/anggota/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleteTarget(null);
            },
        });
    };

    const startSetKeluar = (item: AnggotaRow) => {
        setSetKeluarTarget(item);
        setSetKeluarForm({
            alasan_keluar: '',
            tanggal_keluar: new Date().toISOString().slice(0, 10),
        });
    };

    const submitSetKeluar = () => {
        if (!setKeluarTarget) {
            return;
        }

        if (!setKeluarForm.alasan_keluar.trim()) {
            toast.error('Alasan keluar wajib diisi.');
            return;
        }

        if (!setKeluarForm.tanggal_keluar) {
            toast.error('Tanggal keluar wajib diisi.');
            return;
        }

        setIsSetKeluarSubmitting(true);
        router.post(
            `/anggota/${setKeluarTarget.id}/set-keluar`,
            setKeluarForm,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSetKeluarTarget(null);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        firstError
                            ? String(firstError)
                            : 'Terjadi kesalahan saat mengubah status anggota',
                    );
                },
                onFinish: () => {
                    setIsSetKeluarSubmitting(false);
                },
            },
        );
    };

    return (
        <>
            <Head title="Management Anggota" />

            <section className="space-y-4">
                <AnggotaFormCard
                    key={editingAnggotaId ?? 'create'}
                    editingAnggota={editingAnggota}
                    createData={createForm.data}
                    updateData={updateForm.data}
                    createErrors={createForm.errors}
                    updateErrors={updateForm.errors}
                    createProcessing={createForm.processing}
                    updateProcessing={updateForm.processing}
                    isSubmitting={isSubmitting}
                    statusOptions={statusOptions}
                    onSubmit={handleSubmit}
                    onPrimaryAction={handlePrimaryAction}
                    onCancelEdit={() => {
                        setEditingAnggotaId(null);
                        updateForm.reset();
                        createForm.reset();
                    }}
                    onChangeField={(field, value) => {
                        if (editingAnggota) {
                            updateForm.setData(field, value as never);
                            return;
                        }

                        createForm.setData(field, value as never);
                    }}
                />

                <AnggotaTableCard
                    anggota={anggota}
                    onSetKeluar={startSetKeluar}
                    onStartEdit={startEdit}
                    onRemove={removeAnggota}
                />
            </section>

            <Modal
                open={setKeluarTarget !== null}
                title="Set Anggota Keluar"
                description={
                    setKeluarTarget ? (
                        <>
                            Anda akan mengubah status{' '}
                            <strong>{setKeluarTarget.nama}</strong> menjadi{' '}
                            <b>keluar</b>.
                        </>
                    ) : (
                        ''
                    )
                }
                onClose={() => {
                    if (!isSetKeluarSubmitting) {
                        setSetKeluarTarget(null);
                    }
                }}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setSetKeluarTarget(null)}
                            disabled={isSetKeluarSubmitting}
                            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={submitSetKeluar}
                            disabled={isSetKeluarSubmitting}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSetKeluarSubmitting
                                ? 'Menyimpan...'
                                : 'Set Keluar'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <FloatingInput
                        id="tanggal_keluar"
                        type="date"
                        label="Tanggal Keluar"
                        required
                        value={setKeluarForm.tanggal_keluar}
                        onChange={(event) =>
                            setSetKeluarForm((prev) => ({
                                ...prev,
                                tanggal_keluar: event.target.value,
                            }))
                        }
                    />

                    <FloatingTextarea
                        id="alasan_keluar"
                        label="Alasan Keluar"
                        required
                        rows={4}
                        value={setKeluarForm.alasan_keluar}
                        onChange={(event) =>
                            setSetKeluarForm((prev) => ({
                                ...prev,
                                alasan_keluar: event.target.value,
                            }))
                        }
                        placeholder="Tuliskan alasan anggota keluar"
                    />
                </div>
            </Modal>

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Hapus Anggota"
                description={
                    deleteTarget
                        ? `Apakah Anda yakin ingin menghapus anggota ${deleteTarget.nama}? Tindakan ini tidak dapat dibatalkan.`
                        : ''
                }
                confirmText="Hapus"
                isLoading={false}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
}

AnggotaIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Management Anggota">{page}</DashboardLayout>
);
