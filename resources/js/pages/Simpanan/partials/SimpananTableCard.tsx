import { useMemo, useState } from 'react';
import type {
    SimpananBatch,
    SimpananRow,
    AnggotaNominalRow,
    BatchSummaryRow,
} from '../types';
import { buildInvoiceHtml, getAnggotaKey, summarizeInvoice } from '../utils';
import { toNumber } from '@/utils/number';
import SimpananInvoicePreviewModal from './SimpananInvoicePreviewModal';
import SimpananTableBatchSection from './SimpananTableBatchSection';
import SimpananTableNominalSection from './SimpananTableNominalSection';

type Props = {
    rows: SimpananRow[];
    onRequestTarik: (payload: {
        anggotaId: string;
        anggotaLabel: string;
        maxTarikSukarela: number;
    }) => void;
};

export default function SimpananTableCard({ rows, onRequestTarik }: Props) {
    const [selectedAnggota, setSelectedAnggota] =
        useState<AnggotaNominalRow | null>(null);
    const [selectedInvoiceBatch, setSelectedInvoiceBatch] =
        useState<SimpananBatch | null>(null);

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
                const summary = summarizeInvoice(batch);

                return {
                    batch,
                    kode_transaksi: batch.kode_transaksi,
                    tanggal_transaksi: batch.tanggal_transaksi,
                    total: summary.total,
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
            `${window.location.origin}/example-link`,
            '_blank',
            'width=1200,height=900',
        );

        if (!previewWindow) {
            return;
        }

        const invoiceHtml = await buildInvoiceHtml(selectedInvoiceBatch);

        previewWindow.document.open();
        previewWindow.document.write(invoiceHtml);
        previewWindow.document.close();
        previewWindow.focus();

        setTimeout(() => {
            previewWindow.print();
        }, 300);
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
                onPreviewInvoice={setSelectedInvoiceBatch}
            />

            <SimpananInvoicePreviewModal
                selectedInvoiceBatch={selectedInvoiceBatch}
                onClose={() => setSelectedInvoiceBatch(null)}
                onExportPdf={exportInvoiceToPdf}
            />
        </>
    );
}
