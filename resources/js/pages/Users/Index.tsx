import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import ConfirmDialog from '@/components/confirm-dialog';
import type {
    SharedAuthUser,
    UserForm,
    UserRow,
    UsersPageProps,
} from './types';
import { initialUserForm } from './types';
import {
    buildCreatePayload,
    buildUpdatePayload,
    createUserSchema,
    getFirstValidationError,
    updateUserSchema,
} from './validation';
import UserFormCard from './partials/UserFormCard';
import UsersTableCard from './partials/UsersTableCard';

export default function UsersIndex() {
    const { props } = usePage<{
        props: UsersPageProps;
        auth?: { user?: SharedAuthUser };
    }>();
    const pageProps = props as unknown as UsersPageProps;
    const authUserId = props.auth?.user?.id ?? null;
    const users = pageProps.users ?? [];

    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createForm = useForm<UserForm>(initialUserForm);
    const updateForm = useForm<UserForm>(initialUserForm);

    const editingUser = useMemo(
        () => users.find((user) => user.id === editingUserId) ?? null,
        [users, editingUserId],
    );

    const submitCreate = () => {
        const payload = buildCreatePayload(createForm.data);
        const validation = createUserSchema.safeParse(payload);

        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);
        router.post('/users', validation.data, {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat menambahkan user',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const submitUpdate = () => {
        if (!editingUserId) return;

        const payload: UserForm = {
            ...buildUpdatePayload(updateForm.data),
            roles: updateForm.data.roles,
        };

        const validation = updateUserSchema.safeParse(payload);
        if (!validation.success) {
            toast.error(getFirstValidationError(validation.error));
            return;
        }

        setIsSubmitting(true);
        router.put(`/users/${editingUserId}`, validation.data, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingUserId(null);
                updateForm.reset();
                createForm.reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat memperbarui user',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        handlePrimaryAction();
    };

    const handlePrimaryAction = () => {
        if (editingUserId !== null) {
            submitUpdate();
            return;
        }

        submitCreate();
    };

    const startEdit = (user: UserRow) => {
        if (user.is_super_admin && authUserId !== user.id) {
            toast.error('Super Admin tidak dapat diedit.');
            return;
        }

        setEditingUserId(user.id);
        updateForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            roles: user.roles,
        });
    };

    const canEditUser = (user: UserRow) => {
        if (!user.is_super_admin) {
            return true;
        }

        return authUserId === user.id;
    };

    const removeUser = (id: number, name: string) => {
        setDeleteTarget(
            users.find((user) => user.id === id) ?? {
                id,
                name,
                email: '',
                roles: [],
                is_super_admin: false,
                created_at: null,
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/users/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleteTarget(null);
            },
        });
    };

    const cancelDelete = () => {
        setDeleteTarget(null);
    };

    return (
        <>
            <Head title="Users Management" />

            <section className="space-y-4">
                <UserFormCard
                    key={editingUserId ?? 'create'}
                    editingUser={editingUser}
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
                        setEditingUserId(null);
                        updateForm.reset();
                        createForm.reset();
                    }}
                    onChangeField={(field, value) => {
                        if (editingUser) {
                            updateForm.setData(field, value);
                            return;
                        }

                        createForm.setData(field, value);
                    }}
                />

                <UsersTableCard
                    users={users}
                    canEditUser={canEditUser}
                    onStartEdit={startEdit}
                    onRemoveUser={removeUser}
                />
            </section>

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Hapus User"
                description={
                    deleteTarget
                        ? `Apakah Anda yakin ingin menghapus user ${deleteTarget.name}? Tindakan ini tidak dapat dibatalkan.`
                        : ''
                }
                confirmText="Hapus"
                isLoading={false}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </>
    );
}

UsersIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Users Management">{page}</DashboardLayout>
);
