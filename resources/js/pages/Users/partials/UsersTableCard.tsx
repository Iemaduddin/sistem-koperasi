import { useMemo } from 'react';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { UserRow } from '../types';

type Props = {
    users: UserRow[];
    onStartEdit: (user: UserRow) => void;
    onRemoveUser: (id: number, name: string) => void;
    canEditUser: (user: UserRow) => boolean;
};

export default function UsersTableCard({
    users,
    onStartEdit,
    onRemoveUser,
    canEditUser,
}: Props) {
    const columns = useMemo<DataTableColumn<UserRow>[]>(
        () => [
            {
                id: 'is_active',
                header: 'Status',
                render: (user) => (
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                ),
                sortValue: (user) => (user.is_active ? 1 : 0),
            },
            {
                id: 'name',
                header: 'Nama',
                accessor: 'name',
                sortable: true,
                searchable: true,
            },
            {
                id: 'email',
                header: 'Email',
                accessor: 'email',
                sortable: true,
                searchable: true,
            },
            {
                id: 'roles',
                header: 'Role',
                render: (user) => (
                    <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                            <span
                                key={`${user.id}-${role}`}
                                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                            >
                                {role}
                            </span>
                        ))}
                    </div>
                ),
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (user) => (
                    <div className="flex gap-2">
                        {user.is_super_admin && !canEditUser(user) ? (
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                                Tidak punya akses
                            </span>
                        ) : user.is_super_admin ? (
                            <Button
                                size="sm"
                                variant="soft"
                                onClick={() => onStartEdit(user)}
                            >
                                Edit
                            </Button>
                        ) : (
                            <>
                                <Button
                                    size="sm"
                                    variant="soft"
                                    onClick={() => onStartEdit(user)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() =>
                                        onRemoveUser(user.id, user.name)
                                    }
                                >
                                    Hapus
                                </Button>
                            </>
                        )}
                    </div>
                ),
            },
        ],
        [canEditUser, onRemoveUser, onStartEdit],
    );

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
                Daftar User
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Kelola akun pengguna. Semua user baru otomatis diberikan role
                Admin.
            </p>

            <div className="mt-4">
                <DataTable
                    data={users}
                    columns={columns}
                    getRowId={(row) => String(row.id)}
                    selectable={false}
                    searchPlaceholder="Cari nama atau email..."
                    emptyMessage="Tidak ada user ditemukan"
                />
            </div>
        </article>
    );
}
