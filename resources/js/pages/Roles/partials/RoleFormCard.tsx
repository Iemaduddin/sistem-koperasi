import type { FormEvent } from 'react';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';
import type { RoleForm, RoleRow } from '../types';

type Props = {
    editingRole: RoleRow | null;
    formData: RoleForm;
    errors: Partial<Record<keyof RoleForm, string>>;
    isSubmitting: boolean;
    availablePermissions: string[];
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancelEdit: () => void;
    onChangeField: (field: keyof RoleForm, value: any) => void;
};

export default function RoleFormCard({
    editingRole,
    formData,
    errors,
    isSubmitting,
    availablePermissions,
    onSubmit,
    onCancelEdit,
    onChangeField,
}: Props) {
    const handlePermissionToggle = (permission: string) => {
        const current = formData.permissions;
        const next = current.includes(permission)
            ? current.filter((p) => p !== permission)
            : [...current, permission];
        onChangeField('permissions', next);
    };

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
                {editingRole
                    ? `Edit Role: ${editingRole.name}`
                    : 'Tambah Role Baru'}
            </h3>
            
            <form onSubmit={onSubmit} className="mt-6 space-y-6">
                <div className="max-w-md">
                    <FloatingInput
                        label="Nama Role"
                        value={formData.name}
                        onChange={(event) =>
                            onChangeField('name', event.target.value)
                        }
                        errorText={errors.name}
                        required
                        disabled={editingRole?.is_system_role}
                    />
                    {editingRole?.is_system_role && (
                        <p className="mt-1 text-xs text-amber-600">
                            Nama role sistem tidak dapat diubah.
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">
                        Permissions
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {availablePermissions.map((permission) => (
                            <label
                                key={permission}
                                className={`flex cursor-pointer flex-col justify-between items-center rounded-lg border p-3 text-center transition-all hover:bg-blue-50 ${
                                    formData.permissions.includes(permission)
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-slate-200 bg-white'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={formData.permissions.includes(permission)}
                                    onChange={() => handlePermissionToggle(permission)}
                                />
                                <span className={`text-[11px] font-medium ${
                                    formData.permissions.includes(permission) ? 'text-blue-700' : 'text-slate-600'
                                }`}>
                                    {permission}
                                </span>
                            </label>
                        ))}
                    </div>
                    {errors.permissions && (
                        <p className="text-xs text-red-500">{errors.permissions}</p>
                    )}
                </div>

                <div className="flex gap-3 border-t border-slate-100 pt-6">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        variant="primary"
                    >
                        {editingRole ? 'Update Role' : 'Simpan Role'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancelEdit}
                        disabled={isSubmitting}
                    >
                        {editingRole ? 'Batal' : 'Reset'}
                    </Button>
                </div>
            </form>
        </article>
    );
}
