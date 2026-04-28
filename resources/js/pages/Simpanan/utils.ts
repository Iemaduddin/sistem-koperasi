import { formatCurrency, toNumber } from '@/utils/number';
import type { SimpananBatch, SimpananRow, TipeTransaksiOption } from './types';
import type { InvoiceSummary } from './types';
import { formatDateOnly, formatDateTimeLong } from '@/utils/text';
import QRCode from 'qrcode';

export const tipeTransaksiLabel: Record<TipeTransaksiOption, string> = {
    setor: 'Setor',
    tarik: 'Tarik',
};

export function buildRekeningDetail(row: SimpananRow): string {
    const anggota = row.rekening_simpanan?.anggota;
    const noAnggota = anggota?.no_anggota ?? '-';
    const nama = anggota?.nama ?? 'Tanpa nama';
    const jenisSimpanan = row.rekening_simpanan?.jenis_simpanan?.nama ?? '-';

    return `${noAnggota} - ${nama} · ${jenisSimpanan}`;
}

export function buildAmountLabel(value: number): string {
    return `Rp ${formatCurrency(value)}`;
}

export function getAnggotaKey(row: SimpananRow): string {
    return (
        row.rekening_simpanan?.anggota?.id ??
        row.rekening_simpanan?.anggota?.no_anggota ??
        row.rekening_simpanan?.anggota?.nama ??
        'tanpa-anggota'
    );
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"]|'/g, (character) => {
        switch (character) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            case "'":
                return '&#39;';
            default:
                return character;
        }
    });
}

export function getBatchTransactions(
    batch: SimpananBatch | null,
): SimpananRow[] {
    if (!batch?.transaksi_simpanan) {
        return [];
    }

    return batch.transaksi_simpanan as SimpananRow[];
}

export function summarizeInvoice(batch: SimpananBatch | null): InvoiceSummary {
    const transactions = getBatchTransactions(batch);

    return transactions.reduce<InvoiceSummary>(
        (summary, transaction) => {
            const amount = toNumber(transaction.jumlah);
            summary.total += amount;
            return summary;
        },
        { total: 0 },
    );
}

export async function buildInvoiceHtml(
    batch: SimpananBatch,
    rows: SimpananRow[] = [],
): Promise<string> {
    // Use provided rows if available, otherwise try to get from batch
    const transactions = rows.length > 0 ? rows : getBatchTransactions(batch);
    const summary = {
        total: transactions.reduce((sum, row) => {
            return sum + toNumber(row.jumlah);
        }, 0),
    };
    const logoPngUrl = `${window.location.origin}/logo-azzahwa.png`;
    const logoHorizontalUrl = `${window.location.origin}/logo-azzahwa-horizontal.png`;
    const qrTargetUrl = `${window.location.origin}/example-link`;
    const kotaTanggal = `Pasuruan, ${formatDateOnly(batch.tanggal_transaksi)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrTargetUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 150,
        color: {
            dark: '#0f172a',
            light: '#ffffff',
        },
    });

    const rowsHtml = transactions
        .map((transaction, index) => {
            const rekening = transaction.rekening_simpanan;
            const anggota = rekening?.anggota;
            const jenisSimpanan = rekening?.jenis_simpanan?.nama ?? '-';

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(transaction.jenis_transaksi.toUpperCase())}</td>
                    <td>${escapeHtml(anggota?.no_anggota ?? '-')}</td>
                    <td>${escapeHtml(anggota?.nama ?? '-')}</td>
                    <td>${escapeHtml(jenisSimpanan)}</td>
                    <td>${escapeHtml(transaction.keterangan ?? '-')}</td>
                    <td>${escapeHtml(formatCurrency(Number(transaction.jumlah ?? 0)))}</td>
                </tr>
            `;
        })
        .join('');

    return `
        <!doctype html>
        <html lang="id">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Invoice Transaksi Simpanan - Mitra Koperasi Azzahwa</title>
            <style>
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    margin: 0;
                    padding: 24px;
                    color: #0f172a;
                }
                .kop {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    border-bottom: 2px solid #cbd5e1;
                    padding-bottom: 6px;
                    text-align: right;
                }
                .kop .logo {
                    width: 220px;
                    max-height: 62px;
                    object-fit: contain;
                    object-position: left center;
                }
                .desc-kop {
                    margin-left:-16px;
                    font-size: 12px;
                    text-align: right;
                }
                .detail-company {
                    font-size: 12px;
                    text-align: right;
                    flex: 1;
                    min-width: 0;
                }             
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 16px;
                    margin-bottom: 20px;
                    padding-top: 16px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #e2e8f0;
                }
                h1, h2, h3, p { margin: 0; }
                h1 { font-size: 22px; }
                .muted { color: #64748b; font-size: 12px; }
                .meta {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px 24px;
                    margin-bottom: 20px;
                    font-size: 13px;
                }
                .meta div { padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }
                th, td {
                    border: 1px solid #cbd5e1;
                    padding: 8px;
                    vertical-align: top;
                }
                th {
                    background: #f8fafc;
                    text-align: left;
                }
                .summary {
                    margin-top: 16px;
                }
                .card {
                    border: 1px solid #cbd5e1;
                    border-radius: 12px;
                    padding: 12px;
                }
                .card .label { color: #64748b; font-size: 12px; }
                .card .value { margin-top: 6px; font-size: 16px; font-weight: 700; }
                .signature {
                    margin-top: 28px;
                    display: flex;
                    justify-content: flex-end;
                }
                .barcode-card {
                    border: 1px dashed #94a3b8;
                    border-radius: 14px;
                    padding: 10px;
                    text-align: center;
                    background: #ffffff;
                    width: 220px;
                }
                .total-card {
                    border: 1px solid #cbd5e1;
                    border-radius: 12px;
                    padding: 14px;
                    background: #ffffff;
                }
                .total-card .label {
                    color: #64748b;
                    font-size: 12px;
                }
                .total-card .value {
                    margin-top: 6px;
                    font-size: 20px;
                    font-weight: 700;
                }
                .barcode-wrap {
                    position: relative;
                    display: inline-block;
                    line-height: 0;
                }
                #invoice-qr {
                    display: block;
                    width: 150px;
                    height: 150px;
                    background: #ffffff;
                }
                .barcode-logo {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 34px;
                    height: 34px;
                    object-fit: contain;
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 3px;
                    box-shadow: 0 0 0 2px #ffffff;
                }
                .barcode-date {
                    margin-bottom: 8px;
                    font-size: 12px;
                    color: #334155;
                }
                .barcode-text {
                    margin-top: 8px;
                    font-size: 11px;
                    color: #334155;
                    word-break: break-all;
                }
                @media print {
                    body { padding: 12px; }
                }
            </style>
        </head>
        <body>
            <div class="kop">
                <img class="logo" src="${escapeHtml(logoHorizontalUrl)}" alt="Logo Koperasi" decoding="async" />
                <div class="detail-company">
                    <h3>Koperasi Azzahwa</h3>
                    <p class="desc-kop">Jl. Contoh Koperasi No. 1, Kota Contoh</p>
                    <p class="desc-kop">Telp. (021) 000000 | Email: info@azzahwa.test</p>
                </div>
            </div>

            <div class="header">
                <div>
                    <h1>Invoice Transaksi Simpanan</h1>
                    <p class="muted">Bukti transaksi sesi simpanan koperasi</p>
                </div>
                <div style="text-align:right">
                    <p><strong>${escapeHtml(batch.kode_transaksi)}</strong></p>
                    <p class="muted">${escapeHtml(formatDateTimeLong(batch.tanggal_transaksi))}</p>
                </div>
            </div>

            <div class="meta">
                <div><strong>Anggota</strong><br/>${escapeHtml(batch.anggota?.no_anggota ?? '-')} - ${escapeHtml(batch.anggota?.nama ?? '-')}</div>
                <div><strong>Petugas</strong><br/>${escapeHtml(batch.user?.name ?? '-')}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Tipe</th>
                        <th>No Anggota</th>
                        <th>Nama</th>
                        <th>Jenis Simpanan</th>
                        <th>Keterangan</th>
                        <th>Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    <tr>
                        <td colspan="6" style="text-align:right; font-weight:700; background:#f8fafc;">Total Keseluruhan</td>
                        <td style="font-weight:700; background:#f8fafc;">Rp ${escapeHtml(formatCurrency(summary.total))}</td>
                    </tr>
                </tbody>
            </table>
            <div class="signature">
                <div class="barcode-card">
                    <div class="barcode-date">${escapeHtml(kotaTanggal)}</div>
                    <div class="barcode-wrap">
                        <img id="invoice-qr" alt="QR / Barcode" src="${escapeHtml(qrCodeDataUrl)}" />
                        <img class="barcode-logo" alt="Logo" src="${escapeHtml(logoPngUrl)}" decoding="async" />
                    </div>
                    <div class="barcode-text">Scan untuk melihat detail dan keaslian invoice</div>
                </div>
            </div>
        </body>
        </html>
    `;
}
