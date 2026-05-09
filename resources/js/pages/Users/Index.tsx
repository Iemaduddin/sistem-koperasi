import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { LuLock } from 'react-icons/lu';
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
    const [blockTarget, setBlockTarget] = useState<UserRow | null>(null);
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
            is_active: user.is_active ? 'true' : 'false',
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

    const blockUser = (id: number, name: string, isActive: boolean) => {
        if (isActive && id === authUserId) {
            toast.error('Anda tidak dapat memblokir diri sendiri.');
            return;
        }

        setBlockTarget(
            users.find((user) => user.id === id) ?? {
                id,
                name,
                email: '',
                roles: [],
                is_super_admin: false,
                is_active: true,
                created_at: null,
            },
        );
    };

    const confirmBlock = () => {
        if (!blockTarget) {
            return;
        }

        const endpoint = blockTarget.is_active
            ? `/users/${blockTarget.id}/block`
            : `/users/${blockTarget.id}/unblock`;

        router.put(
            endpoint,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setBlockTarget(null);
                },
            },
        );
    };

    const cancelBlock = () => {
        setBlockTarget(null);
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
                    onBlockUser={blockUser}
                />
            </section>

            <ConfirmDialog
                open={blockTarget !== null}
                title={
                    blockTarget?.is_active
                        ? 'Blokir User'
                        : 'Aktifkan kembali User'
                }
                description={
                    blockTarget
                        ? blockTarget.is_active
                            ? `Apakah Anda yakin ingin memblokir user ${blockTarget.name}? User ini tidak akan dapat login dan mengakses sistem.`
                            : `Apakah Anda yakin ingin membuka blokir user ${blockTarget.name}? User ini akan dapat login dan mengakses sistem kembali.`
                        : ''
                }
                tone={blockTarget?.is_active ? 'danger' : 'success'}
                icon={<LuLock className="h-7 w-7" />}
                confirmText={blockTarget?.is_active ? 'Blokir' : 'Aktifkan'}
                isLoading={false}
                onConfirm={confirmBlock}
                onCancel={cancelBlock}
            />
        </>
    );
}

UsersIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Users Management">{page}</DashboardLayout>
);
