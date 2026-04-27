import type { AngsuranPinjaman, PinjamanRow } from './types';
import { formatDateTimeLong, formatDateOnly } from '@/utils/text';
import QRCode from 'qrcode';

// ─── Format angka ke Rupiah ───────────────────────────────────────────────────
export function formatRupiah(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);
    if (Number.isNaN(num)) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID', { minimumFractionDigits: 0 });
}

// ─── Format tanggal ───────────────────────────────────────────────────────────
export function formatTanggal(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// ─── Hitung sisa angsuran yang belum lunas ────────────────────────────────────
export function hitungSisaAngsuran(pinjaman: PinjamanRow): number {
    if (!pinjaman.angsuran) return pinjaman.tenor_bulan;
    return pinjaman.angsuran.filter((a) => a.status !== 'lunas').length;
}

// ─── Hitung total sudah dibayar ───────────────────────────────────────────────
export function hitungTotalDibayar(pinjaman: PinjamanRow): number {
    if (!pinjaman.angsuran) return 0;
    return pinjaman.angsuran.reduce((sum, a) => sum + Number(a.jumlah_dibayar ?? 0), 0);
}

// ─── Hitung sisa hutang pokok ─────────────────────────────────────────────────
export function hitungSisaHutang(pinjaman: PinjamanRow): number {
    const totalPinjaman = Number(pinjaman.jumlah_pinjaman ?? 0);
    const totalDibayarPokok = pinjaman.angsuran
        ? pinjaman.angsuran.reduce((sum, a) => sum + Number(a.pokok ?? 0) * (a.status === 'lunas' ? 1 : a.status === 'sebagian' ? Number(a.jumlah_dibayar) / Number(a.total_tagihan) : 0), 0)
        : 0;
    return Math.max(0, totalPinjaman - totalDibayarPokok);
}

// ─── Cek apakah angsuran sudah jatuh tempo ───────────────────────────────────
export function isTerlambat(angsuran: AngsuranPinjaman): boolean {
    if (angsuran.status === 'lunas') return false;
    const jatuhTempo = new Date(angsuran.tanggal_jatuh_tempo);
    jatuhTempo.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > jatuhTempo;
}

// ─── Hitung berapa hari keterlambatan ────────────────────────────────────────
export function hitungHariTerlambat(angsuran: AngsuranPinjaman): number {
    if (!isTerlambat(angsuran)) return 0;
    const jatuhTempo = new Date(angsuran.tanggal_jatuh_tempo);
    jatuhTempo.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - jatuhTempo.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Estimasi denda dari sisi frontend (0,1%/hari dari jumlah pokok PINJAMAN) ────
// Konsisten dengan konstanta backend: DENDA_PERSEN_PER_HARI = 0.001
// jumlahPinjaman = pinjaman.jumlah_pinjaman (bukan pokok per angsuran)
export function hitungEstimasiDenda(angsuran: AngsuranPinjaman, jumlahPinjaman: number | string): number {
    const dendaDB = Number(angsuran.denda ?? 0);
    // Jika backend sudah pernah menghitung (denda > 0), pakai nilai DB
    if (dendaDB > 0) return dendaDB;
    const hari = hitungHariTerlambat(angsuran);
    if (hari <= 0) return 0;
    return Math.floor(Number(jumlahPinjaman ?? 0) * 0.001 * hari);
}

// ─── Hitung progress pembayaran (persen) ─────────────────────────────────────
export function hitungProgressPersen(pinjaman: PinjamanRow): number {
    if (!pinjaman.angsuran || pinjaman.angsuran.length === 0) return 0;
    const lunas = pinjaman.angsuran.filter((a) => a.status === 'lunas').length;
    return Math.round((lunas / pinjaman.angsuran.length) * 100);
}

// ─── Badge status pinjaman ────────────────────────────────────────────────────
export function getLabelStatusPinjaman(status: string): string {
    const labels: Record<string, string> = {
        aktif: 'Aktif',
        lunas: 'Lunas',
    };
    return labels[status] ?? status;
}

// ─── Badge status angsuran ────────────────────────────────────────────────────
export function getLabelStatusAngsuran(status: string): string {
    const labels: Record<string, string> = {
        belum_bayar: 'Belum Bayar',
        sebagian: 'Sebagian',
        lunas: 'Lunas',
    };
    return labels[status] ?? status;
}

// ─── Warna badge angsuran ─────────────────────────────────────────────────────
export function getColorStatusAngsuran(
    status: string,
    terlambat: boolean,
): 'red' | 'yellow' | 'green' | 'gray' {
    if (status === 'lunas') return 'green';
    if (terlambat) return 'red';
    if (status === 'sebagian') return 'yellow';
    return 'gray';
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

export async function buildInvoiceHtml(
    pinjaman: PinjamanRow,
    angsuran: AngsuranPinjaman,
): Promise<string> {
    const logoPngUrl = `${window.location.origin}/logo-azzahwa.png`;
    const logoHorizontalUrl = `${window.location.origin}/logo-azzahwa-horizontal.png`;
    const logoIcoUrl = `${window.location.origin}/logo-azzahwa.ico`;
    const qrTargetUrl = `${window.location.origin}/portal-anggota`;
    const kotaTanggal = `Kota Batu, ${formatDateOnly(angsuran.updated_at || angsuran.tanggal_bayar || new Date().toISOString())}`;

    const qrCodeDataUrl = await QRCode.toDataURL(qrTargetUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 150,
        color: {
            dark: '#0f172a',
            light: '#ffffff',
        },
    });

    const rowsHtml = `
        <tr>
            <td>1</td>
            <td>ANGSURAN KE-${angsuran.angsuran_ke}</td>
            <td>${escapeHtml(formatRupiah(angsuran.pokok))}</td>
            <td>${escapeHtml(formatRupiah(angsuran.bunga))}</td>
            <td>${escapeHtml(formatRupiah(angsuran.denda))}</td>
            <td>${escapeHtml(formatRupiah(angsuran.jumlah_dibayar))}</td>
        </tr>
    `;

    return `
        <!doctype html>
        <html lang="id">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="${logoIcoUrl}" type="image/x-icon">
            <title>Invoice Angsuran Pinjaman - Mitra Koperasi Azzahwa</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
                .kop { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; }
                .kop .logo { width: 220px; max-height: 62px; object-fit: contain; }
                .detail-company { font-size: 12px; text-align: right; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding: 16px 0; border-bottom: 2px solid #e2e8f0; }
                h1 { font-size: 22px; margin: 0; }
                .muted { color: #64748b; font-size: 12px; }
                .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 20px; font-size: 13px; }
                .meta div { padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                th { background: #f8fafc; }
                .text-right { text-align: right; }
                .signature { margin-top: 28px; display: flex; justify-content: flex-end; }
                .barcode-card { border: 1px dashed #94a3b8; border-radius: 14px; padding: 10px; text-align: center; width: 220px; }
                #invoice-qr { width: 150px; height: 150px; }
                .barcode-wrap { position: relative; display: inline-block; }
                .barcode-logo { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 34px; height: 34px; background: white; border-radius: 8px; padding: 3px; }
                @media print { body { padding: 12px; } }
            </style>
        </head>
        <body>
            <div class="kop">
                <img class="logo" src="${logoHorizontalUrl}" alt="Logo" onerror="this.src='${logoPngUrl}'" />
                <div class="detail-company">
                    <h3>Koperasi Azzahwa</h3>
                    <p>Jl. Contoh Koperasi No. 1, Kota Contoh</p>
                    <p>Telp. (021) 000000 | Email: info@azzahwa.test</p>
                </div>
            </div>
            <div class="header">
                <div>
                    <h1>Invoice Angsuran Pinjaman</h1>
                    <p class="muted">Bukti pembayaran angsuran pinjaman</p>
                </div>
                <div style="text-align:right">
                    <p><strong>LNS-${angsuran.id.substring(0, 8).toUpperCase()}</strong></p>
                    <p class="muted">${formatDateTimeLong(angsuran.tanggal_bayar || new Date().toISOString())}</p>
                </div>
            </div>
            <div class="meta">
                <div><strong>Anggota</strong><br/>${escapeHtml(pinjaman.anggota?.no_anggota ?? '-')} - ${escapeHtml(pinjaman.anggota?.nama ?? '-')}</div>
                <div><strong>ID Pinjaman</strong><br/>${escapeHtml(pinjaman.id.substring(0, 8).toUpperCase())}</div>
                <div><strong>Tenor</strong><br/>${pinjaman.tenor_bulan} Bulan</div>
                <div><strong>Status Pinjaman</strong><br/>${getLabelStatusPinjaman(pinjaman.status)}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Deskripsi</th>
                        <th>Pokok</th>
                        <th>Bunga</th>
                        <th>Denda</th>
                        <th>Total Dibayar</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    <tr>
                        <td colspan="5" style="text-align:right; font-weight:700;">Total Keseluruhan</td>
                        <td style="font-weight:700;">${formatRupiah(angsuran.jumlah_dibayar)}</td>
                    </tr>
                </tbody>
            </table>
            <div class="signature">
                <div class="barcode-card">
                    <div style="font-size:12px; margin-bottom:8px;">${kotaTanggal}</div>
                    <div class="barcode-wrap">
                        <img id="invoice-qr" src="${qrCodeDataUrl}" />
                        <img class="barcode-logo" src="${logoPngUrl}" />
                    </div>
                    <div style="font-size:11px; margin-top:8px;">Scan untuk verifikasi keaslian bukti</div>
                </div>
            </div>
        </body>
        </html>
    `;
}
