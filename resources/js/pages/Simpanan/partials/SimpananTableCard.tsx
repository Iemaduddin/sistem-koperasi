import { useMemo, useState } from 'react';
import type {
    SimpananBatch,
    SimpananRow,
    AnggotaNominalRow,
    BatchSummaryRow,
    RekeningSimpananOption,
} from '../types';
import { buildInvoiceHtml, getAnggotaKey, summarizeInvoice } from '../utils';
import { toNumber } from '@/utils/number';
import SimpananInvoicePreviewModal from './SimpananInvoicePreviewModal';
import SimpananTableBatchSection from './SimpananTableBatchSection';
import SimpananTableNominalSection from './SimpananTableNominalSection';

type Props = {
    rows: SimpananRow[];
    rekeningSimpananData: RekeningSimpananOption[];
    onRequestTarik: (payload: {
        anggotaId: string;
        anggotaLabel: string;
        maxTarikSukarela: number;
    }) => void;
};

export default function SimpananTableCard({
    rows,
    rekeningSimpananData,
    onRequestTarik,
}: Props) {
    const [selectedAnggota, setSelectedAnggota] =
        useState<AnggotaNominalRow | null>(null);
    const [selectedInvoiceBatch, setSelectedInvoiceBatch] =
        useState<SimpananBatch | null>(null);
    const [selectedBatchRows, setSelectedBatchRows] = useState<SimpananRow[]>(
        [],
    );

    const nominalPerAnggota = useMemo<AnggotaNominalRow[]>(() => {
        const grouped = new Map<string, AnggotaNominalRow>();

        // Build summary from rekeningSimpananData (has all rekening, not just recent transactions)
        for (const rekening of rekeningSimpananData) {
            if (!rekening) {
                continue;
            }

            // Use consistent key generation with getAnggotaKey
            const anggotaId =
                rekening.anggota?.id ??
                rekening.anggota?.no_anggota ??
                rekening.anggota?.nama ??
                'tanpa-anggota';
            const anggotaNama = rekening.anggota?.nama ?? 'Tanpa nama';
            const noAnggota = rekening.anggota?.no_anggota ?? '-';
            const jenisKode = (
                rekening.jenis_simpanan?.kode ?? ''
            ).toUpperCase();
            // Skip Tabungan - it has its own page
            if (jenisKode === 'TABUNGAN') {
                continue;
            }

            const saldo = toNumber(rekening.saldo);

            const current = grouped.get(anggotaId) ?? {
                id: anggotaId,
                anggota_key: anggotaId,
                anggota_id: rekening.anggota?.id ?? null,
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

        // Filter out rows where all nominal are 0
        return Array.from(grouped.values())
            .filter((row) => row.total > 0)
            .sort((a, b) => a.nama.localeCompare(b.nama, 'id-ID'));
    }, [rekeningSimpananData]);

    const transaksiAnggotaTerpilih = useMemo(() => {
        if (!selectedAnggota) {
            return [];
        }

        // Prefer stable anggota_id match to avoid key mismatches from fallback fields.
        if (selectedAnggota.anggota_id) {
            return rows.filter((row) => {
                const rowAnggotaId =
                    row.batch?.anggota?.id ??
                    row.rekening_simpanan?.anggota?.id;

                return rowAnggotaId === selectedAnggota.anggota_id;
            });
        }

        return rows.filter(
            (row) => getAnggotaKey(row) === selectedAnggota.anggota_key,
        );
    }, [rows, selectedAnggota]);

    const batchRowsAnggotaTerpilih = useMemo<BatchSummaryRow[]>(() => {
        if (!selectedAnggota) {
            return [];
        }

        const rowsByBatch = new Map<string, SimpananRow[]>();

        for (const row of transaksiAnggotaTerpilih) {
            if (!row.batch) {
                continue;
            }

            const batchId = row.batch.id;
            const existingRows = rowsByBatch.get(batchId) ?? [];
            existingRows.push(row);
            rowsByBatch.set(batchId, existingRows);
        }

        return Array.from(rowsByBatch.entries())
            .map(([_, batchRows]) => {
                const firstRow = batchRows[0];
                const batch = firstRow.batch as SimpananBatch;

                // Calculate total from batchRows instead of batch object
                const total = batchRows.reduce((sum, row) => {
                    return sum + toNumber(row.jumlah);
                }, 0);

                return {
                    batch,
                    kode_transaksi: batch.kode_transaksi,
                    tanggal_transaksi: batch.tanggal_transaksi,
                    total,
                    jumlah_detail: batchRows.length,
                    details: batchRows,
                };
            })
            .sort(
                (a, b) =>
                    new Date(b.tanggal_transaksi).getTime() -
                    new Date(a.tanggal_transaksi).getTime(),
            );
    }, [selectedAnggota, transaksiAnggotaTerpilih]);

    const exportInvoiceToPdf = async () => {
        if (!selectedInvoiceBatch) {
            return;
        }

        const previewWindow = window.open(
            'about:blank',
            '_blank',
            'width=1200,height=900',
        );

        if (!previewWindow) {
            return;
        }

        const invoiceHtml = await buildInvoiceHtml(
            selectedInvoiceBatch,
            selectedBatchRows,
        );

        previewWindow.document.open();
        previewWindow.document.write(invoiceHtml);
        previewWindow.document.close();
        previewWindow.focus();

        setTimeout(() => {
            previewWindow.print();
        }, 300);
    };

    const handlePreviewInvoice = (
        batch: SimpananBatch,
        batchRows: SimpananRow[],
    ) => {
        setSelectedInvoiceBatch(batch);
        setSelectedBatchRows(batchRows);
    };

    return (
        <>
            <SimpananTableNominalSection
                data={nominalPerAnggota}
                onSelectAnggota={setSelectedAnggota}
                onRequestTarik={onRequestTarik}
            />

            <SimpananTableBatchSection
                selectedAnggota={selectedAnggota}
                data={batchRowsAnggotaTerpilih}
                onClose={() => setSelectedAnggota(null)}
                onPreviewInvoice={handlePreviewInvoice}
            />

            <SimpananInvoicePreviewModal
                selectedInvoiceBatch={selectedInvoiceBatch}
                selectedBatchRows={selectedBatchRows}
                onClose={() => {
                    setSelectedInvoiceBatch(null);
                    setSelectedBatchRows([]);
                }}
                onExportPdf={exportInvoiceToPdf}
            />
        </>
    );
}
