import { Head, router, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { LuShieldAlert } from 'react-icons/lu';
import { toast } from 'react-toastify';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import ConfirmDialog from '@/components/confirm-dialog';
import type {
    RoleForm,
    RoleRow,
    RolesPageProps,
} from './types';
import { initialRoleForm } from './types';
import {
    buildPayload,
    getFirstValidationError,
    roleSchema,
} from './validation';
import RoleFormCard from './partials/RoleFormCard';
import RolesTableCard from './partials/RolesTableCard';

export default function RolesIndex() {
    const { props } = usePage<{
        roles: RoleRow[];
        permissions: string[];
    }>();
    
    const roles = props.roles ?? [];
    const permissions = props.permissions ?? [];

    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<RoleForm>(initialRoleForm);
    const [errors, setErrors] = useState<Partial<Record<keyof RoleForm, string>>>({});

    const editingRole = useMemo(
        () => roles.find((role) => role.uuid === editingRoleId) ?? null,
        [roles, editingRoleId],
    );

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload = buildPayload(formData);
        const validation = roleSchema.safeParse(payload);

        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);
        const method = editingRoleId ? 'put' : 'post';
        const url = editingRoleId ? `/roles/${editingRoleId}` : '/roles';

        router[method](url, validation.data, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingRoleId(null);
                setFormData(initialRoleForm);
                setErrors({});
                toast.success(`Role berhasil ${editingRoleId ? 'diperbarui' : 'ditambahkan'}`);
            },
            onError: (errs) => {
                setErrors(errs as any);
                const firstError = Object.values(errs)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : `Terjadi kesalahan saat ${editingRoleId ? 'memperbarui' : 'menambahkan'} role`,
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const startEdit = (role: RoleRow) => {
        setEditingRoleId(role.uuid);
        setFormData({
            name: role.name,
            permissions: role.permissions,
        });
        setErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingRoleId(null);
        setFormData(initialRoleForm);
        setErrors({});
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(`/roles/${deleteTarget.uuid}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                toast.success('Role berhasil dihapus');
            },
            onFinish: () => {
                setDeleteTarget(null);
            },
        });
    };

    return (
        <>
            <Head title="Role Management" />

            <section className="space-y-6">
                <RoleFormCard
                    editingRole={editingRole}
                    formData={formData}
                    errors={errors}
                    isSubmitting={isSubmitting}
                    availablePermissions={permissions}
                    onSubmit={handleSubmit}
                    onCancelEdit={cancelEdit}
                    onChangeField={(field, value) => {
                        setFormData(prev => ({ ...prev, [field]: value }));
                    }}
                />

                <RolesTableCard
                    roles={roles}
                    canEditRole={() => true}
                    onStartEdit={startEdit}
                    onDeleteRole={(role) => setDeleteTarget(role)}
                />
            </section>

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Hapus Role"
                description={
                    deleteTarget
                        ? `Apakah Anda yakin ingin menghapus role "${deleteTarget.name}"? Action ini tidak dapat dibatalkan.`
                        : ''
                }
                tone="danger"
                icon={<LuShieldAlert className="h-7 w-7" />}
                confirmText="Hapus Role"
                isLoading={false}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
}

RolesIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Role Management">{page}</DashboardLayout>
);
