import type { ReactElement } from 'react';
import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import ConfirmDialog from '@/components/confirm-dialog';
import type { PinjamanPageProps, PinjamanRow } from './types';
import { initialPinjamanForm } from './types';
import PinjamanFormCard from './partials/PinjamanFormCard';
import PinjamanTableCard from './partials/PinjamanTableCard';

export default function PinjamanIndex() {
    const { props } = usePage<{ props: PinjamanPageProps }>();
    const pageProps = props as unknown as PinjamanPageProps;
    const rows = pageProps.pinjaman ?? [];
    const anggotaData = pageProps.anggota ?? [];
    const rekeningKoperasiData = pageProps.rekening_koperasi ?? [];

    const [formData, setFormData] = useState(initialPinjamanForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PinjamanRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const onChangeField = <K extends keyof typeof formData>(
        field: K,
        value: (typeof formData)[K],
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData(initialPinjamanForm);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.anggota_id) {
            toast.error('Anggota wajib dipilih.');
            return;
        }
        if (
            !formData.jumlah_pinjaman ||
            Number(formData.jumlah_pinjaman) <= 0
        ) {
            toast.error('Jumlah pinjaman harus lebih dari 0.');
            return;
        }
        if (!formData.tenor_bulan || Number(formData.tenor_bulan) <= 0) {
            toast.error('Tenor harus lebih dari 0 bulan.');
            return;
        }

        setIsSubmitting(true);

        router.post('/pinjaman', formData, {
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat menambahkan pinjaman.',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;

        setIsDeleting(true);

        router.delete(`/pinjaman/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Gagal menghapus pinjaman.',
                );
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <>
            <Head title="Pinjaman" />

            <section className="space-y-4">
                <PinjamanFormCard
                    formData={formData}
                    anggotaOptions={anggotaData.map((a) => ({
                        value: a.id,
                        label: `${a.no_anggota} - ${a.nama}`,
                    }))}
                    rekeningOptions={rekeningKoperasiData.map((r) => ({
                        value: r.id,
                        label: `${r.nama} - ${r.nomor_rekening || r.jenis}`,
                    }))}
                    isSubmitting={isSubmitting}
                    onChangeField={onChangeField}
                    onSubmit={handleSubmit}
                />

                <PinjamanTableCard
                    rows={rows}
                    onRequestDelete={(row) => setDeleteTarget(row)}
                />
            </section>

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Hapus Pinjaman"
                description={
                    deleteTarget
                        ? `Hapus pinjaman milik ${deleteTarget.anggota?.nama ?? '-'}? Tindakan ini tidak dapat dibatalkan.`
                        : ''
                }
                tone="danger"
                confirmText="Hapus"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
}

PinjamanIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Pinjaman">{page}</DashboardLayout>
);
