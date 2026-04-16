import type { AngsuranPinjaman, PinjamanRow } from './types';

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
    return jatuhTempo < new Date();
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
