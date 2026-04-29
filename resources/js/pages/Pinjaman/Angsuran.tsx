import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import Button from '@/components/button';
import Tabs, { type TabsItem } from '@/components/tabs';
import { formatRupiah, formatTanggal } from './utils';
import type { AngsuranPinjaman } from './types';

type Props = {
    overdue_angsuran: (AngsuranPinjaman & {
        hari_terlambat: number;
        denda_estimasi: number;
    })[];
    upcoming_angsuran: (AngsuranPinjaman & { hari_tersisa: number })[];
};

type GroupedAngsuranRow = {
    anggota_nama: string;
    anggota_no: string;
    total_angsuran: number;
    total_tagihan: number;
    total_denda_estimasi: number;
    max_hari_terlambat: number;
    pinjaman_ids: string[];
    tanggal_jatuh_tempo_terlama: string;
};

export default function PinjamanTerlambat({
    overdue_angsuran,
    upcoming_angsuran,
}: Props) {
    const groupedAngsuran = useMemo<GroupedAngsuranRow[]>(() => {
        const map = new Map<string, GroupedAngsuranRow>();

        for (const item of overdue_angsuran) {
            const anggotaNama = item.pinjaman?.anggota?.nama ?? '-';
            const anggotaNo = item.pinjaman?.anggota?.no_anggota ?? '-';
            const key = `${anggotaNo}::${anggotaNama}`;
            const pinjamanId = String(item.pinjaman_id ?? '');
            const tagihan = Number(item.total_tagihan ?? 0) || 0;
            const denda = Number(item.denda_estimasi ?? 0) || 0;
            const hari = Number(item.hari_terlambat ?? 0) || 0;
            const tanggalJatuhTempo = String(item.tanggal_jatuh_tempo ?? '');

            // Group overdue payments
            if (!map.has(key)) {
                map.set(key, {
                    anggota_nama: anggotaNama,
                    anggota_no: anggotaNo,
                    total_angsuran: 0,
                    total_tagihan: 0,
                    total_denda_estimasi: 0,
                    max_hari_terlambat: 0,
                    pinjaman_ids: [],
                    tanggal_jatuh_tempo_terlama: tanggalJatuhTempo,
                });
            }

            const row = map.get(key)!;
            row.total_angsuran += 1;
            row.total_tagihan += tagihan;
            row.total_denda_estimasi += denda;
            row.max_hari_terlambat = Math.max(row.max_hari_terlambat, hari);

            if (pinjamanId && !row.pinjaman_ids.includes(pinjamanId)) {
                row.pinjaman_ids.push(pinjamanId);
            }

            if (
                !row.tanggal_jatuh_tempo_terlama ||
                new Date(tanggalJatuhTempo).getTime() <
                    new Date(row.tanggal_jatuh_tempo_terlama).getTime()
            ) {
                row.tanggal_jatuh_tempo_terlama = tanggalJatuhTempo;
            }
        }

        return Array.from(map.values()).sort(
            (a, b) => b.max_hari_terlambat - a.max_hari_terlambat,
        );
    }, [overdue_angsuran]);

    const angsuranColumns = useMemo<DataTableColumn<GroupedAngsuranRow>[]>(
        () => [
            {
                id: 'anggota',
                header: 'Anggota',
                render: (row) => (
                    <div>
                        <p className="font-medium text-neutral-800">
                            {row.anggota_nama}
                        </p>
                        <p className="text-xs text-neutral-400">
                            {row.anggota_no}
                        </p>
                    </div>
                ),
                searchable: true,
                searchValue: (row) => `${row.anggota_nama} ${row.anggota_no}`,
                sortable: true,
                sortValue: (row) => row.anggota_nama,
            },
            {
                id: 'total_angsuran',
                header: 'Total Angsuran',
                sortable: true,
                render: (row) => `${row.total_angsuran} Angsuran`,
                sortValue: (row) => row.total_angsuran,
            },
            {
                id: 'tanggal_jatuh_tempo',
                header: 'Jatuh Tempo Terlama',
                sortable: true,
                render: (row) => (
                    <span className="font-medium text-red-600">
                        {formatTanggal(row.tanggal_jatuh_tempo_terlama)}
                    </span>
                ),
                sortValue: (row) => row.tanggal_jatuh_tempo_terlama,
            },
            {
                id: 'hari_terlambat',
                header: 'Maks. Keterlambatan',
                sortable: true,
                render: (row) => (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        {row.max_hari_terlambat} Hari
                    </span>
                ),
                sortValue: (row) => row.max_hari_terlambat,
            },
            {
                id: 'tagihan',
                header: 'Total Tagihan (P+BH)',
                sortable: true,
                render: (row) => formatRupiah(row.total_tagihan),
                sortValue: (row) => row.total_tagihan,
            },
            {
                id: 'denda',
                header: 'Total Denda (Estimasi)',
                sortable: true,
                render: (row) => (
                    <span className="font-semibold text-red-600">
                        {formatRupiah(row.total_denda_estimasi)}
                    </span>
                ),
                sortValue: (row) => row.total_denda_estimasi,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (row.pinjaman_ids.length === 1) {
                                router.visit(
                                    `/pinjaman/${row.pinjaman_ids[0]}`,
                                );
                                return;
                            }

                            router.visit('/pinjaman');
                        }}
                    >
                        {row.pinjaman_ids.length === 1
                            ? 'Detail Pinjaman'
                            : 'Lihat Daftar Pinjaman'}
                    </Button>
                ),
                sortable: false,
            },
        ],
        [],
    );

    const totalAngsuranTerlambat = useMemo(
        () =>
            groupedAngsuran.reduce(
                (total, row) => total + row.total_angsuran,
                0,
            ),
        [groupedAngsuran],
    );

    const groupedUpcomingAngsuran = useMemo<
        Array<{
            anggota_nama: string;
            anggota_no: string;
            total_tagihan: number;
            min_hari_tersisa: number;
            pinjaman_ids: string[];
            tanggal_jatuh_tempo_terdekat: string;
        }>
    >(() => {
        const map = new Map<
            string,
            {
                anggota_nama: string;
                anggota_no: string;
                total_tagihan: number;
                min_hari_tersisa: number;
                pinjaman_ids: string[];
                tanggal_jatuh_tempo_terdekat: string;
            }
        >();

        for (const item of upcoming_angsuran) {
            const anggotaNama = item.pinjaman?.anggota?.nama ?? '-';
            const anggotaNo = item.pinjaman?.anggota?.no_anggota ?? '-';
            const key = `${anggotaNo}::${anggotaNama}`;
            const pinjamanId = String(item.pinjaman_id ?? '');
            const tagihan = Number(item.total_tagihan ?? 0) || 0;
            const hari = Number(item.hari_tersisa ?? 0) || 0;
            const tanggalJatuhTempo = String(item.tanggal_jatuh_tempo ?? '');

            if (!map.has(key)) {
                map.set(key, {
                    anggota_nama: anggotaNama,
                    anggota_no: anggotaNo,
                    total_tagihan: 0,
                    min_hari_tersisa: hari,
                    pinjaman_ids: [],
                    tanggal_jatuh_tempo_terdekat: tanggalJatuhTempo,
                });
            }

            const row = map.get(key)!;
            row.total_tagihan += tagihan;
            row.min_hari_tersisa = Math.min(row.min_hari_tersisa, hari);

            if (pinjamanId && !row.pinjaman_ids.includes(pinjamanId)) {
                row.pinjaman_ids.push(pinjamanId);
            }

            if (
                !row.tanggal_jatuh_tempo_terdekat ||
                new Date(tanggalJatuhTempo).getTime() <
                    new Date(row.tanggal_jatuh_tempo_terdekat).getTime()
            ) {
                row.tanggal_jatuh_tempo_terdekat = tanggalJatuhTempo;
            }
        }

        return Array.from(map.values()).sort(
            (a, b) => a.min_hari_tersisa - b.min_hari_tersisa,
        );
    }, [upcoming_angsuran]);

    const upcomingColumns = useMemo<
        DataTableColumn<{
            anggota_nama: string;
            anggota_no: string;
            total_tagihan: number;
            min_hari_tersisa: number;
            pinjaman_ids: string[];
            tanggal_jatuh_tempo_terdekat: string;
        }>[]
    >(
        () => [
            {
                id: 'anggota',
                header: 'Anggota',
                render: (row) => (
                    <div>
                        <p className="font-medium text-neutral-800">
                            {row.anggota_nama}
                        </p>
                        <p className="text-xs text-neutral-400">
                            {row.anggota_no}
                        </p>
                    </div>
                ),
                searchable: true,
                searchValue: (row) => `${row.anggota_nama} ${row.anggota_no}`,
                sortable: true,
                sortValue: (row) => row.anggota_nama,
            },
            {
                id: 'tanggal_jatuh_tempo',
                header: 'Jatuh Tempo Terdekat',
                sortable: true,
                render: (row) => (
                    <span className="font-medium text-amber-700">
                        {formatTanggal(row.tanggal_jatuh_tempo_terdekat)}
                    </span>
                ),
                sortValue: (row) => row.tanggal_jatuh_tempo_terdekat,
            },
            {
                id: 'hari_tersisa',
                header: 'Sisa Hari',
                sortable: true,
                render: (row) => (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {row.min_hari_tersisa} Hari
                    </span>
                ),
                sortValue: (row) => row.min_hari_tersisa,
            },
            {
                id: 'tagihan',
                header: 'Total Tagihan (P+BH)',
                sortable: true,
                render: (row) => formatRupiah(row.total_tagihan),
                sortValue: (row) => row.total_tagihan,
            },
            {
                id: 'actions',
                header: 'Aksi',
                render: (row) => (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (row.pinjaman_ids.length === 1) {
                                router.visit(
                                    `/pinjaman/${row.pinjaman_ids[0]}`,
                                );
                                return;
                            }

                            router.visit('/pinjaman');
                        }}
                    >
                        {row.pinjaman_ids.length === 1
                            ? 'Detail Pinjaman'
                            : 'Lihat Daftar Pinjaman'}
                    </Button>
                ),
                sortable: false,
            },
        ],
        [],
    );

    const tabs = useMemo<TabsItem[]>(
        () => [
            {
                id: 'terlambat',
                label: 'Angsuran Terlambat',
                badge: totalAngsuranTerlambat,
                content: (
                    <DataTable
                        data={groupedAngsuran}
                        columns={angsuranColumns}
                        getRowId={(row) =>
                            `anggota-${row.anggota_no}-${row.anggota_nama}`
                        }
                        selectable={false}
                        searchPlaceholder="Cari nama/no anggota..."
                        emptyMessage="Tidak ada angsuran yang terlambat saat ini."
                    />
                ),
            },
            {
                id: 'bulan-ini',
                label: 'Jatuh Tempo Bulan Ini',
                badge: groupedUpcomingAngsuran.length,
                content: (
                    <DataTable
                        data={groupedUpcomingAngsuran}
                        columns={upcomingColumns}
                        getRowId={(row) =>
                            `anggota-${row.anggota_no}-${row.anggota_nama}`
                        }
                        selectable={false}
                        searchPlaceholder="Cari nama/no anggota..."
                        emptyMessage="Tidak ada angsuran yang harus dibayar pada bulan ini."
                    />
                ),
            },
        ],
        [
            angsuranColumns,
            groupedAngsuran,
            groupedUpcomingAngsuran,
            totalAngsuranTerlambat,
            upcomingColumns,
        ],
    );

    return (
        <>
            <Head title="Angsuran Pinjaman" />

            <div className="space-y-4">
                <header className="flex flex-col gap-2 rounded-lg bg-white p-6 shadow">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Angsuran Pinjaman
                    </h1>
                    <p className="text-slate-500">
                        Menampilkan angsuran yang terlambat dan angsuran yang
                        akan jatuh tempo pada bulan ini.
                    </p>
                </header>

                <Tabs items={tabs} defaultValue="terlambat" />
            </div>
        </>
    );
}

PinjamanTerlambat.layout = (page: ReactElement) => (
    <DashboardLayout title="Angsuran Pinjaman">{page}</DashboardLayout>
);
