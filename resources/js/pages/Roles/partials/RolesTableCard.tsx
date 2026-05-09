import { useMemo } from 'react';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { RoleRow } from '../types';

type Props = {
    roles: RoleRow[];
    onStartEdit: (role: RoleRow) => void;
    onDeleteRole: (role: RoleRow) => void;
    canEditRole: (role: RoleRow) => boolean;
};

export default function RolesTableCard({
    roles,
    onStartEdit,
    onDeleteRole,
    canEditRole,
}: Props) {
    const columns = useMemo<DataTableColumn<RoleRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Nama Role',
                accessor: 'name',
                sortable: true,
                searchable: true,
            },
            {
                id: 'permissions',
                header: 'Permissions',
                render: (role) => (
                    <div className="flex flex-wrap gap-1 max-w-md">
                        {role.permissions.length > 0 ? (
                            role.permissions.map((perm) => (
                                <span
                                    key={`${role.uuid}-${perm}`}
                                    className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                                >
                                    {perm}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-400 italic">Tidak ada permission</span>
                        )}
                    </div>
                ),
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (role) => (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="soft"
                            onClick={() => onStartEdit(role)}
                        >
                            Edit
                        </Button>
                        {!role.is_system_role && (
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => onDeleteRole(role)}
                            >
                                Hapus
                            </Button>
                        )}
                        {role.is_system_role && (
                             <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                                System
                             </span>
                        )}
                    </div>
                ),
            },
        ],
        [onStartEdit, onDeleteRole],
    );

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
                Daftar Role
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Kelola role dan permission yang ada dalam sistem.
            </p>

            <div className="mt-4">
                <DataTable
                    data={roles}
                    columns={columns}
                    getRowId={(row) => row.uuid}
                    selectable={false}
                    searchPlaceholder="Cari nama role..."
                    emptyMessage="Tidak ada role ditemukan"
                />
            </div>
        </article>
    );
}
