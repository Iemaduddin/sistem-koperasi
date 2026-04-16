// ─── Tipe data Anggota ───────────────────────────────────────────────────────
export type AnggotaOption = {
    id: string;
    no_anggota: string;
    nama: string;
    alamat: string;
};

// ─── Status pinjaman & angsuran ──────────────────────────────────────────────
export type StatusPinjaman = 'aktif' | 'lunas';
export type StatusAngsuran = 'belum_bayar' | 'sebagian' | 'lunas';

// ─── Transaksi pembayaran angsuran ───────────────────────────────────────────
export type TransaksiPinjaman = {
    id: string;
    pinjaman_id: string;
    angsuran_id: string;
    jumlah_bayar: number | string;
    denda_dibayar: number | string;
    tanggal_bayar: string;
    created_at: string;
};

// ─── Satu baris angsuran (jadwal cicilan) ────────────────────────────────────
export type AngsuranPinjaman = {
    id: string;
    pinjaman_id: string;
    angsuran_ke: number;
    tanggal_jatuh_tempo: string;
    pokok: number | string;
    bunga: number | string;
    denda: number | string;
    total_tagihan: number | string;
    jumlah_dibayar: number | string;
    status: StatusAngsuran;
    transaksi?: TransaksiPinjaman[];
};

// ─── Satu baris pinjaman ─────────────────────────────────────────────────────
export type PinjamanRow = {
    id: string;
    anggota_id: string;
    jumlah_pinjaman: number | string;
    bunga_persen: number | string;
    tenor_bulan: number;
    jumlah_angsuran: number | string;
    tanggal_mulai: string;
    status: StatusPinjaman;
    created_at: string;
    anggota?: AnggotaOption;
    angsuran?: AngsuranPinjaman[];
};

// ─── Props halaman index ──────────────────────────────────────────────────────
export type PinjamanPageProps = {
    pinjaman: PinjamanRow[];
    anggota: AnggotaOption[];
    flash?: {
        success?: string;
        error?: string;
    };
};

// ─── Props halaman show/detail ────────────────────────────────────────────────
export type PinjamanShowProps = {
    pinjaman: PinjamanRow & { angsuran: AngsuranPinjaman[] };
    flash?: {
        success?: string;
        error?: string;
    };
};

// ─── Form tambah pinjaman ─────────────────────────────────────────────────────
export type PinjamanForm = {
    anggota_id: string;
    jumlah_pinjaman: string;
    bunga_persen: string;
    tenor_bulan: string;
    tanggal_mulai: string;
};

export const initialPinjamanForm: PinjamanForm = {
    anggota_id: '',
    jumlah_pinjaman: '',
    bunga_persen: '25',
    tenor_bulan: '12',
    tanggal_mulai: new Date().toISOString().substring(0, 10),
};

// ─── Form bayar angsuran ──────────────────────────────────────────────────────
export type BayarAngsuranForm = {
    angsuran_id: string;
    jumlah_bayar: string;
    denda_dibayar: string;
    tanggal_bayar: string;
};

export const initialBayarAngsuranForm = (): BayarAngsuranForm => ({
    angsuran_id: '',
    jumlah_bayar: '',
    denda_dibayar: '0',
    tanggal_bayar: new Date().toISOString().substring(0, 10),
});
