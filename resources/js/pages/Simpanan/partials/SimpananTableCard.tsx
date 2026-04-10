import { useMemo, useState } from 'react';
import { LuEye, LuTrash, LuX } from 'react-icons/lu';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import { formatCurrency } from '@/lib/utils';
import type { SimpananRow, TipeTransaksiOption } from '../types';

type Props = {
    rows: SimpananRow[];
    onRemove: (row: SimpananRow) => void;
};

type AnggotaNominalRow = {
    id: string;
    anggota_key: string;
    no_anggota: string;
    nama: string;
    pokok: number;
    wajib: number;
    sukarela: number;
    total: number;
};

const tipeTransaksiLabel: Record<TipeTransaksiOption, string> = {
    setor: 'Setor',
    tarik: 'Tarik',
};

function formatDateTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}

function buildRekeningSummary(row: SimpananRow): string {
    const namaAnggota = row.rekening_simpanan?.anggota?.nama ?? 'Tanpa nama';
    const jenisSimpanan = row.rekening_simpanan?.jenis_simpanan?.nama ?? '-';

    return `${namaAnggota} · ${jenisSimpanan}`;
}

function buildAmountLabel(value: number): string {
    return `Rp ${formatCurrency(value)}`;
}

function getAnggotaKey(row: SimpananRow): string {
    return (
        row.rekening_simpanan?.anggota?.id ??
        row.rekening_simpanan?.anggota?.no_anggota ??
        row.rekening_simpanan?.anggota?.nama ??
        'tanpa-anggota'
    );
}

function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) {
        return 0;
    }

    const parsed = Number(value);

    return Number.isNaN(parsed) ? 0 : parsed;
}

function isPengalihanDanaDariWajib(keterangan: string | null): boolean {
    if (!keterangan) {
        return false;
    }

    return keterangan
        .toLowerCase()
        .startsWith('pengalihan dana dari simpanan wajib');
}

export default function SimpananTableCard({ rows, onRemove }: Props) {
    const [selectedAnggota, setSelectedAnggota] =
        useState<AnggotaNominalRow | null>(null);

    const nominalPerAnggota = useMemo<AnggotaNominalRow[]>(() => {
        const uniqueRekening = new Map<
            string,
            SimpananRow['rekening_simpanan']
        >();

        for (const row of rows) {
            const rekeningId =
                row.rekening_simpanan?.id ?? row.rekening_simpanan_id;

            if (!rekeningId || uniqueRekening.has(rekeningId)) {
                continue;
            }

            uniqueRekening.set(rekeningId, row.rekening_simpanan);
        }

        const grouped = new Map<string, AnggotaNominalRow>();

        for (const rekening of uniqueRekening.values()) {
            if (!rekening) {
                continue;
            }

            const anggotaId =
                rekening.anggota?.id ??
                rekening.anggota?.nama ??
                'tanpa-anggota';
            const anggotaNama = rekening.anggota?.nama ?? 'Tanpa nama';
            const noAnggota = rekening.anggota?.no_anggota ?? '-';
            const jenisKode = (
                rekening.jenis_simpanan?.kode ?? ''
            ).toUpperCase();
            const saldo = toNumber(rekening.saldo);

            const current = grouped.get(anggotaId) ?? {
                id: anggotaId,
                anggota_key: anggotaId,
                no_anggota: noAnggota,
                nama: anggotaNama,
                pokok: 0,
                wajib: 0,
                sukarela: 0,
                total: 0,
            };

            if (jenisKode === 'POKOK') {
                current.pokok += saldo;
            } else if (jenisKode === 'WAJIB') {
                current.wajib += saldo;
            } else if (jenisKode === 'SUKARELA') {
                current.sukarela += saldo;
            }

            current.total = current.pokok + current.wajib + current.sukarela;
            grouped.set(anggotaId, current);
        }

        return Array.from(grouped.values()).sort((a, b) =>
            a.nama.localeCompare(b.nama, 'id-ID'),
        );
    }, [rows]);

    const transaksiAnggotaTerpilih = useMemo(() => {
        if (!selectedAnggota) {
            return [];
        }

        return rows.filter(
            (row) => getAnggotaKey(row) === selectedAnggota.anggota_key,
        );
    }, [rows, selectedAnggota]);

    const nominalColumns = useMemo<DataTableColumn<AnggotaNominalRow>[]>(
        () => [
            {
                id: 'no_anggota',
                header: 'No. Anggota',
                accessor: 'no_anggota',
                searchable: true,
                sortable: true,
            },
            {
                id: 'nama',
                header: 'Nama Anggota',
                accessor: 'nama',
                searchable: true,
                sortable: true,
            },
            {
                id: 'pokok',
                header: 'Nominal Pokok',
                sortable: true,
                render: (row) => buildAmountLabel(row.pokok),
                sortValue: (row) => row.pokok,
            },
            {
                id: 'wajib',
                header: 'Nominal Wajib',
                sortable: true,
                render: (row) => buildAmountLabel(row.wajib),
                sortValue: (row) => row.wajib,
            },
            {
                id: 'sukarela',
                header: 'Nominal Sukarela',
                sortable: true,
                render: (row) => buildAmountLabel(row.sukarela),
                sortValue: (row) => row.sukarela,
            },
            {
                id: 'total',
                header: 'Total Simpanan',
                sortable: true,
                render: (row) => (
                    <span className="font-semibold text-slate-900">
                        {buildAmountLabel(row.total)}
                    </span>
                ),
                sortValue: (row) => row.total,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <Button
                        size="sm"
                        variant="info"
                        onClick={() => setSelectedAnggota(row)}
                    >
                        <LuEye className="h-4 w-4" />
                        Lihat Transaksi
                    </Button>
                ),
            },
        ],
        [],
    );

    const columns = useMemo<DataTableColumn<SimpananRow>[]>(
        () => [
            {
                id: 'id',
                header: 'No. Transaksi',
                accessor: 'id',
                searchable: true,
                sortable: true,
            },
            {
                id: 'created_at',
                header: 'Tanggal',
                accessor: 'created_at',
                sortable: true,
                render: (row) => formatDateTime(row.created_at),
                sortValue: (row) => new Date(row.created_at),
                searchValue: (row) => formatDateTime(row.created_at),
            },
            {
                id: 'rekening_simpanan',
                header: 'Rekening',
                searchable: true,
                sortable: true,
                render: (row) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-slate-900">
                            {buildRekeningSummary(row)}
                        </div>
                        <div className="text-xs text-slate-500">
                            {row.rekening_simpanan?.id ??
                                row.rekening_simpanan_id}
                        </div>
                    </div>
                ),
                searchValue: (row) =>
                    `${row.rekening_simpanan?.anggota?.nama ?? ''} ${row.rekening_simpanan?.jenis_simpanan?.nama ?? ''} ${row.rekening_simpanan_id}`.toLowerCase(),
                sortValue: (row) => row.rekening_simpanan?.anggota?.nama ?? '',
            },
            {
                id: 'jenis_transaksi',
                header: 'Tipe',
                accessor: 'jenis_transaksi',
                searchable: true,
                render: (row) => tipeTransaksiLabel[row.jenis_transaksi],
            },
            {
                id: 'jumlah',
                header: 'Jumlah',
                accessor: 'jumlah',
                sortable: true,
                render: (row) => buildAmountLabel(row.jumlah),
            },
            {
                id: 'saldo_rekening',
                header: 'Saldo Rekening',
                sortable: true,
                responsiveHidden: true,
                sortValue: (row) => Number(row.rekening_simpanan?.saldo ?? 0),
                render: (row) =>
                    `Rp ${formatCurrency(Number(row.rekening_simpanan?.saldo ?? 0))}`,
            },
            {
                id: 'keterangan',
                header: 'Keterangan',
                accessor: 'keterangan',
                searchable: true,
                responsiveHidden: true,
                render: (row) => {
                    const keterangan = row.keterangan || '-';
                    const isPengalihan = isPengalihanDanaDariWajib(
                        row.keterangan,
                    );

                    return (
                        <div className="space-y-1">
                            {isPengalihan ? (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                    Pengalihan
                                </span>
                            ) : null}
                            <p>{keterangan}</p>
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onRemove(row)}
                        >
                            <LuTrash className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [onRemove],
    );

    return (
        <>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-slate-900">
                    Ringkasan Simpanan Per Anggota
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                    Menampilkan posisi nominal simpanan pokok, wajib, sukarela,
                    dan total per anggota.
                </p>

                <div className="mt-4">
                    <DataTable
                        data={nominalPerAnggota}
                        columns={nominalColumns}
                        getRowId={(row) => row.id}
                        selectable={false}
                        searchPlaceholder="Cari no anggota atau nama anggota..."
                        emptyMessage="Belum ada nominal simpanan per anggota"
                    />
                </div>
            </article>

            {selectedAnggota ? (
                <article className="rounded-xl border-2 border-purple-800 bg-white p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Transaksi Simpanan Per Anggota
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                {selectedAnggota.no_anggota} -{' '}
                                {selectedAnggota.nama}
                            </p>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAnggota(null)}
                        >
                            <LuX className="h-4 w-4" />
                            Tutup
                        </Button>
                    </div>

                    <div className="mt-4">
                        <DataTable
                            data={transaksiAnggotaTerpilih}
                            columns={columns}
                            getRowId={(row) => row.id}
                            selectable={false}
                            searchPlaceholder="Cari no transaksi, jenis transaksi, keterangan..."
                            emptyMessage="Belum ada transaksi untuk anggota ini"
                        />
                    </div>
                </article>
            ) : null}

            <article className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-slate-900">
                    Daftar Transaksi Simpanan
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                    Riwayat transaksi lengkap seluruh anggota untuk kebutuhan
                    audit.
                </p>

                <div className="mt-4">
                    <DataTable
                        data={rows}
                        columns={columns}
                        getRowId={(row) => row.id}
                        selectable={false}
                        searchPlaceholder="Cari no transaksi, rekening, jenis transaksi, keterangan..."
                        emptyMessage="Belum ada transaksi simpanan"
                    />
                </div>
            </article>
        </>
    );
}
