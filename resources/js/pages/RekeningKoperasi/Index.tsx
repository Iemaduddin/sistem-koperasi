import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import type {
    RekeningKoperasiForm,
    RekeningKoperasiPageProps,
    RekeningKoperasiRow,
} from './types';
import { initialRekeningKoperasiForm } from './types';
import {
    buildCreatePayload,
    buildUpdatePayload,
    createRekeningKoperasiSchema,
    getFirstValidationError,
    updateRekeningKoperasiSchema,
} from './validation';
import RekeningKoperasiFormCard from './partials/RekeningKoperasiFormCard';
import RekeningKoperasiTableCard from './partials/RekeningKoperasiTableCard';

export default function RekeningKoperasiIndex() {
    const { props } = usePage<{ props: RekeningKoperasiPageProps }>();
    const pageProps = props as unknown as RekeningKoperasiPageProps;
    const rekeningKoperasi = pageProps.rekening_koperasi ?? [];

    const [editingRekeningKoperasiId, setEditingRekeningKoperasiId] = useState<
        string | null
    >(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createForm = useForm<RekeningKoperasiForm>(
        initialRekeningKoperasiForm,
    );
    const updateForm = useForm<RekeningKoperasiForm>(
        initialRekeningKoperasiForm,
    );

    const editingRekeningKoperasi = useMemo(
        () =>
            rekeningKoperasi.find(
                (item) => item.id === editingRekeningKoperasiId,
            ) ?? null,
        [rekeningKoperasi, editingRekeningKoperasiId],
    );

    const submitCreate = () => {
        const payload = buildCreatePayload(createForm.data);
        const validation = createRekeningKoperasiSchema.safeParse(payload);

        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);
        router.post('/rekening-koperasi', validation.data, {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat menambahkan rekening koperasi',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const submitUpdate = () => {
        if (!editingRekeningKoperasiId) return;

        const payload = buildUpdatePayload(updateForm.data);
        const validation = updateRekeningKoperasiSchema.safeParse(payload);

        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);
        router.put(
            `/rekening-koperasi/${editingRekeningKoperasiId}`,
            validation.data,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingRekeningKoperasiId(null);
                    updateForm.reset();
                    createForm.reset();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        firstError
                            ? String(firstError)
                            : 'Terjadi kesalahan saat memperbarui rekening koperasi',
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

        if (editingRekeningKoperasiId !== null) {
            submitUpdate();
            return;
        }

        submitCreate();
    };

    const handlePrimaryAction = () => {
        if (editingRekeningKoperasiId !== null) {
            submitUpdate();
            return;
        }

        submitCreate();
    };

    const startEdit = (item: RekeningKoperasiRow) => {
        setEditingRekeningKoperasiId(item.id);
        updateForm.setData({
            nama: item.nama,
            jenis: item.jenis,
            nomor_rekening: item.nomor_rekening ?? '',
            saldo: item.saldo !== null ? String(item.saldo) : '',
        });
    };

    return (
        <>
            <Head title="Management Rekening Koperasi" />

            <section className="space-y-4">
                <RekeningKoperasiFormCard
                    key={editingRekeningKoperasiId ?? 'create'}
                    editingRekeningKoperasi={editingRekeningKoperasi}
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
                        setEditingRekeningKoperasiId(null);
                        updateForm.reset();
                        createForm.reset();
                    }}
                    onChangeField={(field, value) => {
                        if (editingRekeningKoperasi) {
                            updateForm.setData(field, value as never);
                            return;
                        }

                        createForm.setData(field, value as never);
                    }}
                />

                <RekeningKoperasiTableCard
                    rekening_koperasi={rekeningKoperasi}
                    onStartEdit={startEdit}
                />
            </section>
        </>
    );
}

RekeningKoperasiIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Management Rekening Koperasi">
        {page}
    </DashboardLayout>
);
