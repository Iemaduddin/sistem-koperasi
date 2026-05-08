import QRCode from 'qrcode';
import { formatDateTimeLong, formatDateOnly } from '@/utils/text';
import { formatRupiah } from '../Pinjaman/utils';
import type { VisibleLogRow } from './partials/DepositoDetailBagiHasilSection';
import type { SimpananDepositoRow } from './types';

export async function buildDepositoInvoiceHtml(
    selectedRow: SimpananDepositoRow,
    selectedLog: VisibleLogRow,
): Promise<string> {
    const logoPngUrl = `${window.location.origin}/logo-azzahwa.png`;
    const logoHorizontalUrl = `${window.location.origin}/logo-azzahwa-horizontal.png`;
    const logoIcoUrl = `${window.location.origin}/logo-azzahwa.ico`;
    const qrTargetUrl = `${window.location.origin}/portal-anggota`;

    const nominal = Number(selectedLog.nominal_bagi_hasil) || 0;

    const qrCodeDataUrl = await QRCode.toDataURL(qrTargetUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 150,
        color: { dark: '#0f172a', light: '#ffffff' },
    });

    const kotaTanggal = `Pasuruan, ${formatDateOnly(
        selectedLog.tanggal_pengambilan || new Date().toISOString(),
    )}`;

    return `
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="${logoIcoUrl}" type="image/x-icon">
  <title>Invoice Bagi Hasil Deposito - Koperasi Azzahwa</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
    .kop { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #cbd5e1; padding-bottom:6px }
    .kop .logo { width:220px; max-height:62px; object-fit:contain }
    .detail-company { font-size:12px; text-align:right }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; padding:16px 0; border-bottom:2px solid #e2e8f0 }
    h1 { font-size:22px; margin:0 }
    .muted { color:#64748b; font-size:12px }
    .meta { display:grid; grid-template-columns:repeat(2,1fr); gap:24px; margin-bottom:20px; font-size:13px }
    .meta div { padding:8px 0; border-bottom:1px dashed #e2e8f0 }
    table { width:100%; border-collapse:collapse; font-size:12px; margin-top:10px }
    th, td { border:1px solid #cbd5e1; padding:8px; text-align:left }
    th { background:#f8fafc }
    .text-right { text-align:right }
    .signature { margin-top:28px; display:flex; justify-content:flex-end }
    .barcode-card { border:1px dashed #94a3b8; border-radius:14px; padding:10px; text-align:center; width:220px }
    #invoice-qr { width:150px; height:150px }
    .barcode-wrap { position:relative; display:inline-block }
    .barcode-logo { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:34px; height:34px; background:white; border-radius:8px; padding:3px }
    @media print { body { padding:12px } }
  </style>
</head>
<body>
  <div class="kop">
    <img class="logo" src="${logoHorizontalUrl}" alt="Logo" onerror="this.src='${logoPngUrl}'" />
    <div class="detail-company">
      <h3>Koperasi Azzahwa</h3>
      <p>Jl. Contoh Koperasi No. 1, Pasuruan</p>
      <p>Telp. (021) 000000 | Email: info@azzahwa.test</p>
    </div>
  </div>

  <div class="header">
    <div>
      <h1>Invoice Bagi Hasil Deposito</h1>
      <p class="muted">Bukti penarikan bagi hasil deposito</p>
    </div>
    <div style="text-align:right">
      <p><strong>LOG-${selectedLog.id ? String(selectedLog.id).substring(0, 8).toUpperCase() : 'N/A'}</strong></p>
      <p class="muted">${formatDateTimeLong(selectedLog.tanggal_pengambilan || new Date().toISOString())}</p>
    </div>
  </div>

  <div class="meta">
    <div><strong>Anggota</strong><br/>${selectedRow.anggota?.no_anggota ?? '-'} - ${selectedRow.anggota?.nama ?? '-'}</div>
    <div><strong>ID Deposito</strong><br/>${selectedRow.id ? String(selectedRow.id).substring(0, 8).toUpperCase() : '-'}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Deskripsi</th>
        <th class="text-right">Nominal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Bagi Hasil Deposito</td>
        <td class="text-right">${formatRupiah(nominal)}</td>
      </tr>
      <tr>
        <td colspan="2" style="text-align:right; font-weight:700">Total Keseluruhan</td>
        <td style="font-weight:700" class="text-right">${formatRupiah(nominal)}</td>
      </tr>
    </tbody>
  </table>

  <div class="signature">
    <div class="barcode-card">
      <div style="font-size:12px; margin-bottom:8px">${kotaTanggal}</div>
      <div class="barcode-wrap">
        <img id="invoice-qr" src="${qrCodeDataUrl}" />
        <img class="barcode-logo" src="${logoPngUrl}" />
      </div>
      <div style="font-size:11px; margin-top:8px">Scan untuk verifikasi keaslian bukti</div>
    </div>
  </div>
</body>
</html>
    `;
}
