import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { formatDateOnly } from '@/utils/text';
import Button from '@/components/button';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import {
    formatRupiah,
    normalizeDateOnly,
    type SimpananDepositoRow,
} from '../types';
import DepositoDetailBagiHasilSection, {
    type VisibleLogRow,
} from '@/pages/Deposito/partials/DepositoDetailBagiHasilSection';

type Props = {
    rows: SimpananDepositoRow[];
};

export default function DepositoTableCard({ rows }: Props) {
    const [selectedRow, setSelectedRow] = useState<SimpananDepositoRow | null>(
        null,
    );
    const [isTarikSingleSubmittingId, setIsTarikSingleSubmittingId] = useState<
        number | null
    >(null);
    const [isTarikKumulatifSubmitting, setIsTarikKumulatifSubmitting] =
        useState(false);
    const detailSectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!selectedRow) {
            return;
        }

        const refreshedRow = rows.find((row) => row.id === selectedRow.id);
        if (!refreshedRow) {
            return;
        }

        if (refreshedRow === selectedRow) {
            return;
        }

        setSelectedRow(refreshedRow);
    }, [rows, selectedRow]);

    useEffect(() => {
        if (!selectedRow || !detailSectionRef.current) {
            return;
        }

        detailSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }, [selectedRow]);

    const columns = useMemo<DataTableColumn<SimpananDepositoRow>[]>(
        () => [
            {
                id: 'anggota',
                header: 'Anggota',
                searchable: true,
                searchValue: (row) =>
                    `${row.anggota?.no_anggota ?? ''} ${row.anggota?.nama ?? ''}`,
                render: (row) =>
                    `${row.anggota?.no_anggota ?? '-'} - ${row.anggota?.nama ?? 'Tanpa nama'}`,
            },
            {
                id: 'saldo',
                header: 'Saldo',
                sortable: true,
                sortValue: (row) => Number(row.saldo ?? 0),
                cellClassName: 'text-right',
                render: (row) => {
                    const saldo = Number(row.saldo ?? 0);
                    return formatRupiah(Number.isNaN(saldo) ? 0 : saldo);
                },
            },
            {
                id: 'tenor',
                header: 'Tenor',
                sortable: true,
                sortValue: (row) => row.tenor_bulan,
                render: (row) =>
                    `${row.tenor_bulan} bulan (${Number(
                        row.persen_bagi_hasil,
                    ).toLocaleString('id-ID', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                    })}%)`,
            },
            {
                id: 'periode',
                header: 'Periode',
                sortable: true,
                sortValue: (row) => normalizeDateOnly(row.tanggal_mulai),
                render: (row) => {
                    const tanggalMulai = normalizeDateOnly(row.tanggal_mulai);
                    const tanggalSelesai = normalizeDateOnly(
                        row.tanggal_selesai,
                    );

                    return `${tanggalMulai ? formatDateOnly(`${tanggalMulai}T00:00:00`) : '-'} s.d. ${tanggalSelesai ? formatDateOnly(`${tanggalSelesai}T00:00:00`) : '-'}`;
                },
            },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => row.status,
                cellClassName: 'text-center',
                render: (row) => (
                    <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            row.status === 'aktif'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-700'
                        }`}
                    >
                        {row.status}
                    </span>
                ),
            },
            {
                id: 'aksi',
                header: 'Aksi',
                cellClassName: 'text-center',
                render: (row) => (
                    <Button
                        size="sm"
                        variant="info"
                        onClick={() => setSelectedRow(row)}
                    >
                        Lihat Detail Deposito
                    </Button>
                ),
            },
        ],
        [],
    );

    const maxVisibleLogDate = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 2, 0);
    }, []);

    const visibleLogs = useMemo<VisibleLogRow[]>(() => {
        if (!selectedRow?.log_bagi_hasil) {
            return [];
        }

        return selectedRow.log_bagi_hasil
            .map((log) => {
                const normalizedDate = normalizeDateOnly(
                    log.tanggal_perhitungan,
                );
                const parsedDate = normalizedDate
                    ? new Date(`${normalizedDate}T00:00:00`)
                    : new Date(Number.NaN);

                return {
                    ...log,
                    tanggal_perhitungan: normalizedDate,
                    parsedDate,
                };
            })
            .filter(
                (log) =>
                    !Number.isNaN(log.parsedDate.getTime()) &&
                    log.parsedDate <= maxVisibleLogDate,
            )
            .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
    }, [maxVisibleLogDate, selectedRow]);

    const eligibleLogs = useMemo(() => {
        const now = new Date();

        return visibleLogs.filter((log) => {
            const status = log.status_pengambilan ?? 'belum';
            return (
                status === 'belum' &&
                !Number.isNaN(log.parsedDate.getTime()) &&
                log.parsedDate <= now
            );
        });
    }, [visibleLogs]);

    const handleTarikSingle = (logId: number) => {
        if (!selectedRow) {
            return;
        }

        setIsTarikSingleSubmittingId(logId);

        router.post(
            `/deposito/log-bagi-hasil/${logId}/tarik`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedRow(null);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        firstError
                            ? String(firstError)
                            : 'Gagal memproses penarikan bagi hasil.',
                    );
                },
                onFinish: () => {
                    setIsTarikSingleSubmittingId(null);
                },
            },
        );
    };

    const handleTarikKumulatif = () => {
        if (!selectedRow || eligibleLogs.length === 0) {
            return;
        }

        const eligibleIds = eligibleLogs
            .map((log) => Number(log.id ?? 0))
            .filter((id) => id > 0);

        if (eligibleIds.length === 0) {
            toast.error('Tidak ada log valid untuk ditarik secara kumulatif.');
            return;
        }

        setIsTarikKumulatifSubmitting(true);

        router.post(
            `/deposito/${selectedRow.id}/tarik-bagi-hasil-kumulatif`,
            {
                log_ids: eligibleIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Penarikan kumulatif berhasil diproses.');
                    setSelectedRow(null);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        firstError
                            ? String(firstError)
                            : 'Gagal memproses penarikan kumulatif.',
                    );
                },
                onFinish: () => {
                    setIsTarikKumulatifSubmitting(false);
                },
            },
        );
    };

    return (
        <>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-base font-semibold text-slate-900">
                    Daftar Simpanan Deposito
                </h2>

                <div className="mt-4">
                    <DataTable
                        data={rows}
                        columns={columns}
                        getRowId={(row) => row.id}
                        selectable={false}
                        searchPlaceholder="Cari no. anggota atau nama..."
                        emptyMessage="Belum ada data simpanan deposito."
                    />
                </div>
            </article>

            {selectedRow ? (
                <DepositoDetailBagiHasilSection
                    ref={detailSectionRef}
                    selectedRow={selectedRow}
                    visibleLogs={visibleLogs}
                    eligibleLogsCount={eligibleLogs.length}
                    isTarikSingleSubmittingId={isTarikSingleSubmittingId}
                    isTarikKumulatifSubmitting={isTarikKumulatifSubmitting}
                    onTarikSingle={handleTarikSingle}
                    onTarikKumulatif={handleTarikKumulatif}
                    onClose={() => setSelectedRow(null)}
                />
            ) : null}
        </>
    );
}
