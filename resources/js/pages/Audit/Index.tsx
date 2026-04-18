import { Head } from '@inertiajs/react';
import { useMemo, useState, type ReactElement } from 'react';
import type { DataTableColumn } from '@/components/data-table';
import Button from '@/components/button';
import DataTable from '@/components/data-table';
import Modal from '@/components/modal';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { LuEye } from 'react-icons/lu';

type AuditChange = {
    field: string;
    old_value: string;
    new_value: string;
};

type AuditRow = {
    id: string;
    waktu: string | null;
    event: string;
    event_label: string;
    model: string;
    model_fqcn: string;
    record_id: string;
    user: string;
    ip_address: string | null;
    url: string | null;
    ringkasan: string;
    changes: AuditChange[];
};

type AuditPageProps = {
    audits: AuditRow[];
};

type AuditGroupRow = {
    id: string;
    waktu: string | null;
    items: AuditRow[];
    event_labels: string[];
    model_labels: string[];
    user_labels: string[];
    total_changes: number;
};

const eventBadgeClass: Record<string, string> = {
    created: 'bg-emerald-50 text-emerald-700',
    updated: 'bg-blue-50 text-blue-700',
    deleted: 'bg-red-50 text-red-700',
    restored: 'bg-amber-50 text-amber-700',
};

function formatDateTime(value: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function compactId(value: string): string {
    if (value.length <= 18) {
        return value;
    }

    return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function AuditIndex({ audits }: AuditPageProps) {
    const [selectedAuditGroup, setSelectedAuditGroup] =
        useState<AuditGroupRow | null>(null);

    const summary = useMemo(() => {
        const total = audits.length;
        const dibuat = audits.filter((item) => item.event === 'created').length;
        const diubah = audits.filter((item) => item.event === 'updated').length;
        const dihapus = audits.filter(
            (item) => item.event === 'deleted',
        ).length;

        return {
            total,
            dibuat,
            diubah,
            dihapus,
        };
    }, [audits]);

    const groupedAudits = useMemo<AuditGroupRow[]>(() => {
        const grouped = new Map<string, AuditRow[]>();

        for (const audit of audits) {
            const key = audit.waktu ?? '-';
            const current = grouped.get(key) ?? [];
            current.push(audit);
            grouped.set(key, current);
        }

        return Array.from(grouped.entries()).map(([waktu, items], index) => {
            const eventLabels = Array.from(
                new Set(items.map((item) => item.event_label)),
            );
            const modelLabels = Array.from(
                new Set(items.map((item) => item.model)),
            );
            const userLabels = Array.from(
                new Set(items.map((item) => item.user)),
            );
            const totalChanges = items.reduce(
                (sum, item) => sum + item.changes.length,
                0,
            );

            return {
                id: `${waktu}-${index}`,
                waktu: waktu === '-' ? null : waktu,
                items,
                event_labels: eventLabels,
                model_labels: modelLabels,
                user_labels: userLabels,
                total_changes: totalChanges,
            };
        });
    }, [audits]);

    const columns = useMemo<DataTableColumn<AuditGroupRow>[]>(
        () => [
            {
                id: 'waktu',
                header: 'Waktu',
                sortable: true,
                searchable: true,
                sortValue: (row) => row.waktu ?? '',
                searchValue: (row) => formatDateTime(row.waktu),
                render: (row) => (
                    <span className="font-medium text-slate-800">
                        {formatDateTime(row.waktu)}
                    </span>
                ),
            },
            {
                id: 'event',
                header: 'Aksi',
                sortable: true,
                searchable: true,
                sortValue: (row) => row.event_labels.join(', '),
                searchValue: (row) => row.event_labels.join(' '),
                render: (row) => (
                    <div className="flex flex-wrap gap-1">
                        {row.event_labels.map((label) => {
                            const eventKey = row.items.find(
                                (item) => item.event_label === label,
                            )?.event;

                            return (
                                <span
                                    key={`${row.id}-${label}`}
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${eventBadgeClass[eventKey ?? ''] ?? 'bg-slate-100 text-slate-700'}`}
                                >
                                    {label}
                                </span>
                            );
                        })}
                    </div>
                ),
            },
            {
                id: 'model',
                header: 'Data',
                sortable: true,
                searchable: true,
                sortValue: (row) => row.model_labels.join(', '),
                searchValue: (row) =>
                    `${row.model_labels.join(' ')} ${row.items.map((item) => item.record_id).join(' ')}`,
                render: (row) => (
                    <div className="space-y-0.5">
                        <p className="font-medium text-slate-900">
                            {row.model_labels.join(', ')}
                        </p>
                        <p className="text-xs text-slate-500">
                            {row.items.length} aktivitas pada waktu ini
                        </p>
                    </div>
                ),
            },
            {
                id: 'changes',
                header: 'Perubahan',
                searchable: true,
                searchValue: (row) =>
                    row.items
                        .flatMap((item) => item.changes)
                        .map(
                            (change) =>
                                `${change.field} ${change.old_value} ${change.new_value}`,
                        )
                        .join(' '),
                render: (row) => {
                    if (row.total_changes === 0) {
                        return (
                            <span className="text-xs text-slate-500">
                                Tidak ada detail perubahan.
                            </span>
                        );
                    }

                    const preview = row.items
                        .flatMap((item) => item.changes)
                        .slice(0, 2);

                    return (
                        <div className="space-y-1">
                            {preview.map((change) => (
                                <p
                                    key={`${row.id}-${change.field}-${change.old_value}-${change.new_value}`}
                                    className="text-xs text-slate-700"
                                >
                                    <span className="font-semibold text-slate-900">
                                        {change.field}
                                    </span>
                                    : {change.old_value} {'->'}{' '}
                                    {change.new_value}
                                </p>
                            ))}
                            {row.total_changes > preview.length && (
                                <p className="text-xs text-slate-500">
                                    +{row.total_changes - preview.length}{' '}
                                    perubahan lain
                                </p>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'aktor',
                header: 'Aktor',
                sortable: true,
                searchable: true,
                sortValue: (row) => row.user_labels.join(', '),
                searchValue: (row) =>
                    `${row.user_labels.join(' ')} ${row.items.map((item) => item.ip_address ?? '').join(' ')} ${row.items.map((item) => item.url ?? '').join(' ')}`,
                render: (row) => (
                    <div className="space-y-0.5 text-xs">
                        <p className="font-medium text-slate-800">
                            {row.user_labels.join(', ')}
                        </p>
                        <p className="text-slate-500">
                            {row.user_labels.length} aktor
                        </p>
                    </div>
                ),
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <Button
                        size="sm"
                        variant="soft"
                        leftIcon={<LuEye className="h-4 w-4" />}
                        onClick={() => setSelectedAuditGroup(row)}
                    >
                        Detail
                    </Button>
                ),
            },
        ],
        [],
    );

    return (
        <>
            <Head title="Riwayat Audit" />

            <section className="space-y-4">
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <h1 className="text-xl font-semibold text-slate-900">
                        Riwayat Aktivitas Sistem
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Halaman ini menampilkan jejak perubahan data agar mudah
                        dipantau oleh seluruh pengguna.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">
                                Total Aktivitas
                            </p>
                            <p className="mt-1 text-xl font-semibold text-slate-900">
                                {summary.total}
                            </p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                            <p className="text-xs text-emerald-700">
                                Data Dibuat
                            </p>
                            <p className="mt-1 text-xl font-semibold text-emerald-800">
                                {summary.dibuat}
                            </p>
                        </div>
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                            <p className="text-xs text-blue-700">Data Diubah</p>
                            <p className="mt-1 text-xl font-semibold text-blue-800">
                                {summary.diubah}
                            </p>
                        </div>
                        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                            <p className="text-xs text-red-700">Data Dihapus</p>
                            <p className="mt-1 text-xl font-semibold text-red-800">
                                {summary.dihapus}
                            </p>
                        </div>
                    </div>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Detail Audit
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Cari berdasarkan aksi, data, pelaku, atau nilai
                        perubahan.
                    </p>

                    <div className="mt-4">
                        <DataTable
                            data={groupedAudits}
                            columns={columns}
                            getRowId={(row) => row.id}
                            selectable={false}
                            initialPageSize={20}
                            searchPlaceholder="Cari aktivitas, data, atau pengguna..."
                            emptyMessage="Belum ada riwayat audit yang tersedia"
                        />
                    </div>
                </article>
            </section>

            <Modal
                open={selectedAuditGroup !== null}
                onClose={() => setSelectedAuditGroup(null)}
                title="Detail Riwayat Audit"
                description="Informasi lengkap aktivitas dan semua perubahan data."
                maxWidthClassName="max-w-4xl"
                footer={
                    <Button
                        variant="light"
                        onClick={() => setSelectedAuditGroup(null)}
                    >
                        Tutup
                    </Button>
                }
            >
                {selectedAuditGroup ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                            Menampilkan {selectedAuditGroup.items.length}{' '}
                            aktivitas audit pada waktu yang sama.
                        </div>

                        {selectedAuditGroup.items.map((selectedAudit) => (
                            <div
                                key={selectedAudit.id}
                                className="space-y-4 rounded-xl border border-slate-200 p-3"
                            >
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">
                                            Waktu
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">
                                            {formatDateTime(
                                                selectedAudit.waktu,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">
                                            Aksi
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">
                                            {selectedAudit.event_label}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">
                                            Aktor
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">
                                            {selectedAudit.user}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
                                        <p className="text-xs text-slate-500">
                                            Model
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">
                                            {selectedAudit.model}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {selectedAudit.model_fqcn}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                                        <p className="text-xs text-slate-500">
                                            Record ID
                                        </p>
                                        <p className="mt-1 font-mono text-xs break-all text-slate-800">
                                            {selectedAudit.record_id}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">
                                        <p className="text-xs text-slate-500">
                                            Request
                                        </p>
                                        <p className="mt-1 text-sm text-slate-900">
                                            URL: {selectedAudit.url ?? '-'}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-900">
                                            IP Address:{' '}
                                            {selectedAudit.ip_address ?? '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white">
                                    <div className="border-b border-slate-200 px-4 py-3">
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Detail Perubahan Field
                                        </h3>
                                    </div>

                                    {selectedAudit.changes.length === 0 ? (
                                        <p className="px-4 py-4 text-sm text-slate-500">
                                            Tidak ada detail perubahan field
                                            untuk aktivitas ini.
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                                        <th className="px-4 py-3">
                                                            Field
                                                        </th>
                                                        <th className="px-4 py-3">
                                                            Nilai Lama
                                                        </th>
                                                        <th className="px-4 py-3">
                                                            Nilai Baru
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedAudit.changes.map(
                                                        (change) => (
                                                            <tr
                                                                key={`${selectedAudit.id}-${change.field}`}
                                                                className="border-t border-slate-100"
                                                            >
                                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                                    {
                                                                        change.field
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-700">
                                                                    {
                                                                        change.old_value
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-700">
                                                                    {
                                                                        change.new_value
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </Modal>
        </>
    );
}

AuditIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Riwayat Audit">{page}</DashboardLayout>
);
