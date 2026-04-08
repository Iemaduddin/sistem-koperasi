import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import ConfirmDialog from '@/components/confirm-dialog';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import type {
    JenisSimpananForm,
    JenisSimpananPageProps,
    JenisSimpananRow,
} from './types';
import { initialJenisSimpananForm } from './types';
import {
    buildPayload,
    createJenisSimpananSchema,
    getFirstValidationError,
    updateJenisSimpananSchema,
} from './validation';
import JenisSimpananFormCard from './partials/JenisSimpananFormCard';
import JenisSimpananTableCard from './partials/JenisSimpananTableCard';

export default function JenisSimpananIndex() {
    const { props } = usePage<{ props: JenisSimpananPageProps }>();
    const pageProps = props as unknown as JenisSimpananPageProps;
    const jenisSimpanan = pageProps.jenis_simpanan ?? [];

    const [editingJenisSimpananId, setEditingJenisSimpananId] = useState<
        string | null
    >(null);
    const [deleteTarget, setDeleteTarget] = useState<JenisSimpananRow | null>(
        null,
    );

    const [isSubmitting, setIsSubmitting] = useState(false);

    const createForm = useForm<JenisSimpananForm>(initialJenisSimpananForm);
    const updateForm = useForm<JenisSimpananForm>(initialJenisSimpananForm);

    const editingJenisSimpanan = useMemo(
        () =>
            jenisSimpanan.find((item) => item.id === editingJenisSimpananId) ??
            null,
        [jenisSimpanan, editingJenisSimpananId],
    );

    const submitCreate = () => {
        const payload = buildPayload(createForm.data);
        const validation = createJenisSimpananSchema.safeParse(payload);

        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);
        router.post('/jenis-simpanan', validation.data, {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat menambahkan jenis simpanan',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const submitUpdate = () => {
        if (!editingJenisSimpananId) return;

        const payload = buildPayload(updateForm.data);
        const validation = updateJenisSimpananSchema.safeParse(payload);

        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);
        router.put(
            `/jenis-simpanan/${editingJenisSimpananId}`,
            validation.data,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingJenisSimpananId(null);
                    updateForm.reset();
                    createForm.reset();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        firstError
                            ? String(firstError)
                            : 'Terjadi kesalahan saat memperbarui jenis simpanan',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingJenisSimpananId !== null) {
            submitUpdate();
            return;
        }

        submitCreate();
    };

    const handlePrimaryAction = () => {
        if (editingJenisSimpananId !== null) {
            submitUpdate();
            return;
        }

        submitCreate();
    };

    const startEdit = (item: JenisSimpananRow) => {
        setEditingJenisSimpananId(item.id);
        updateForm.setData({
            nama: item.nama,
            kode: item.kode,
            terkunci: item.terkunci,
            jumlah_minimal:
                item.jumlah_minimal !== null ? String(item.jumlah_minimal) : '',
            jumlah_maksimal:
                item.jumlah_maksimal !== null
                    ? String(item.jumlah_maksimal)
                    : '',
        });
    };

    const removeJenisSimpanan = (id: string, nama: string) => {
        setDeleteTarget(
            jenisSimpanan.find((item) => item.id === id) ?? {
                id,
                nama,
                kode: '',
                terkunci: false,
                jumlah_minimal: null,
                jumlah_maksimal: null,
                created_at: null,
                updated_at: null,
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/jenis-simpanan/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleteTarget(null);
            },
        });
    };

    return (
        <>
            <Head title="Management Jenis Simpanan" />

            <section className="space-y-4">
                <JenisSimpananFormCard
                    key={editingJenisSimpananId ?? 'create'}
                    editingJenisSimpanan={editingJenisSimpanan}
                    createData={createForm.data}
                    updateData={updateForm.data}
                    createErrors={createForm.errors}
                    updateErrors={updateForm.errors}
                    createProcessing={createForm.processing}
                    updateProcessing={updateForm.processing}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    onPrimaryAction={handlePrimaryAction}
                    onCancelEdit={() => {
                        setEditingJenisSimpananId(null);
                        updateForm.reset();
                        createForm.reset();
                    }}
                    onChangeField={(field, value) => {
                        if (editingJenisSimpanan) {
                            updateForm.setData(field, value as never);
                            return;
                        }

                        createForm.setData(field, value as never);
                    }}
                />

                <JenisSimpananTableCard
                    jenis_simpanan={jenisSimpanan}
                    onStartEdit={startEdit}
                    onRemove={removeJenisSimpanan}
                />
            </section>

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Hapus Jenis Simpanan"
                description={
                    deleteTarget
                        ? `Apakah Anda yakin ingin menghapus jenis simpanan ${deleteTarget.nama}? Tindakan ini tidak dapat dibatalkan.`
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

JenisSimpananIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Management Jenis Simpanan">{page}</DashboardLayout>
);
