import type { FormEvent } from 'react';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import type { UserForm, UserRow } from '../types';

type InputField =
    | 'name'
    | 'email'
    | 'is_active'
    | 'password'
    | 'password_confirmation';

type ErrorBag = Partial<Record<InputField, string>>;

type Props = {
    editingUser: UserRow | null;
    createData: UserForm;
    updateData: UserForm;
    createErrors: ErrorBag;
    updateErrors: ErrorBag;
    createProcessing: boolean;
    updateProcessing: boolean;
    isSubmitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onPrimaryAction: () => void;
    onCancelEdit: () => void;
    onChangeField: (field: InputField, value: string) => void;
};

export default function UserFormCard({
    editingUser,
    createData,
    updateData,
    createErrors,
    updateErrors,
    createProcessing,
    updateProcessing,
    isSubmitting,
    onSubmit,
    onPrimaryAction,
    onCancelEdit,
    onChangeField,
}: Props) {
    const formData = editingUser ? updateData : createData;
    const errors = editingUser ? updateErrors : createErrors;
    const isProcessing = editingUser ? updateProcessing : createProcessing;

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
                {editingUser
                    ? `Edit User: ${editingUser.name}`
                    : 'Tambah Admin Baru'}
            </h3>
            <form
                onSubmit={onSubmit}
                className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4"
            >
                <FloatingInput
                    label="Nama"
                    value={formData.name}
                    onChange={(event) =>
                        onChangeField('name', event.target.value)
                    }
                    errorText={errors.name}
                />
                <FloatingInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                        onChangeField('email', event.target.value)
                    }
                    errorText={errors.email}
                />
                <FloatingSelect
                    label="Status Akun"
                    value={formData.is_active}
                    options={[
                        { value: 'true', label: 'Aktif' },
                        { value: 'false', label: 'Nonaktif' },
                    ]}
                    onValueChange={(value) => onChangeField('is_active', value)}
                    searchable={false}
                />
                <FloatingInput
                    label={
                        editingUser ? 'Password Baru (opsional)' : 'Password'
                    }
                    type="password"
                    value={formData.password}
                    onChange={(event) =>
                        onChangeField('password', event.target.value)
                    }
                    errorText={errors.password}
                />
                <FloatingInput
                    label="Konfirmasi Password"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(event) =>
                        onChangeField(
                            'password_confirmation',
                            event.target.value,
                        )
                    }
                    errorText={errors.password_confirmation}
                />

                <div className="flex gap-2 md:col-span-2 lg:col-span-4">
                    <Button
                        type="button"
                        disabled={isSubmitting || isProcessing}
                        loading={isSubmitting || isProcessing}
                        onClick={onPrimaryAction}
                    >
                        {editingUser ? 'Update User' : 'Simpan User'}
                    </Button>
                    {editingUser && (
                        <Button
                            type="button"
                            key="cancel"
                            variant="outline"
                            disabled={updateProcessing}
                            onClick={onCancelEdit}
                        >
                            Batal
                        </Button>
                    )}
                </div>
            </form>
        </article>
    );
}
