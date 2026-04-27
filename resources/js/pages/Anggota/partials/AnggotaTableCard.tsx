import { useMemo } from 'react';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { AnggotaRow } from '../types';
import Tooltip from '@/components/tooltip';
import { LuLogOut, LuPen, LuTrash } from 'react-icons/lu';

type Props = {
    anggota: AnggotaRow[];
    onSetKeluar: (item: AnggotaRow) => void;
    onStartEdit: (item: AnggotaRow) => void;
    onRemove: (id: string, nama: string) => void;
};

const statusClassMap: Record<AnggotaRow['status'], string> = {
    aktif: 'bg-emerald-50 text-emerald-700',
    nonaktif: 'bg-amber-50 text-amber-700',
    keluar: 'bg-slate-100 text-slate-700',
};

const statusLabelMap: Record<AnggotaRow['status'], string> = {
    aktif: 'Aktif',
    nonaktif: 'Nonaktif',
    keluar: 'Keluar',
};

export default function AnggotaTableCard({
    anggota,
    onSetKeluar,
    onStartEdit,
    onRemove,
}: Props) {
    const columns = useMemo<DataTableColumn<AnggotaRow>[]>(
        () => [
            {
                id: 'no_anggota',
                header: 'No. Anggota',
                accessor: 'no_anggota',
                sortable: true,
                searchable: true,
            },
            // {
            //     id: 'nik',
            //     header: 'NIK',
            //     accessor: 'nik',
            //     sortable: true,
            //     searchable: true,
            // },
            {
                id: 'nama',
                header: 'Nama',
                accessor: 'nama',
                sortable: true,
                searchable: true,
                render: (row) => (
                    <div>
                        <span className="font-medium text-slate-900">
                            {row.nama}
                        </span>
                        <br />
                        {/* <span className="text-xs text-slate-500">
                            {row.alamat}
                        </span> */}
                    </div>
                ),
            },
            // {
            //     id: 'no_hp',
            //     header: 'No. HP',
            //     accessor: 'no_hp',
            //     searchable: true,
            //     render: (row) => (
            //         <span>
            //             {row.no_hp} <br />
            //             {row.no_hp_cadangan && (
            //                 <span className="text-xs text-slate-500">
            //                     (Cadangan: {row.no_hp_cadangan})
            //                 </span>
            //             )}
            //         </span>
            //     ),
            // },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => row.status,
                searchable: true,
                searchValue: (row) => statusLabelMap[row.status],
                render: (row) => {
                    const statusBadge = (
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClassMap[row.status]}`}
                        >
                            {statusLabelMap[row.status]}
                        </span>
                    );

                    if (row.status === 'keluar') {
                        const riwayat = row.riwayat_keluar;

                        return (
                            <Tooltip
                                contentClassName="w-56"
                                content={
                                    <div className="space-y-1">
                                        <p className="font-semibold">
                                            Detail Riwayat Keluar
                                        </p>
                                        <p>
                                            Tanggal Keluar:{' '}
                                            {riwayat?.tanggal_pengajuan ??
                                                row.tanggal_keluar ??
                                                '-'}
                                        </p>
                                        <p>
                                            Alasan:{' '}
                                            {riwayat?.alasan_keluar ??
                                                'Tidak ada keterangan'}
                                        </p>
                                        <p>
                                            Disetujui Oleh:{' '}
                                            {riwayat?.disetujui_oleh ?? '-'}
                                        </p>
                                    </div>
                                }
                            >
                                {statusBadge}
                            </Tooltip>
                        );
                    }

                    return statusBadge;
                },
            },
            {
                id: 'tanggal_bergabung',
                header: 'Tgl Bergabung',
                accessor: 'tanggal_bergabung',
                sortable: true,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <div className="flex gap-2">
                        <Tooltip
                            contentClassName="w-24"
                            content={
                                row.status === 'keluar'
                                    ? 'Anggota sudah keluar'
                                    : 'Set anggota keluar'
                            }
                        >
                            <span>
                                <Button
                                    size="sm"
                                    variant="warning"
                                    onClick={() => onSetKeluar(row)}
                                    disabled={row.status === 'keluar'}
                                >
                                    <LuLogOut className="h-4 w-4" />
                                </Button>
                            </span>
                        </Tooltip>
                        <Button
                            size="sm"
                            variant="soft"
                            onClick={() => onStartEdit(row)}
                        >
                            <LuPen className="h-4 w-4" />
                        </Button>
                        {/* <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onRemove(row.id, row.nama)}
                        >
                            <LuTrash className="h-4 w-4" />
                        </Button> */}
                    </div>
                ),
            },
        ],
        [onRemove, onSetKeluar, onStartEdit],
    );

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
                Daftar Anggota
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Kelola data anggota koperasi untuk kebutuhan simpanan, pinjaman,
                dan transaksi lainnya.
            </p>

            <div className="mt-4">
                <DataTable
                    data={anggota}
                    columns={columns}
                    getRowId={(row) => row.id}
                    selectable={false}
                    searchPlaceholder="Cari NIK atau Nama Anggota"
                    emptyMessage="Tidak ada data anggota ditemukan"
                />
            </div>
        </article>
    );
}
