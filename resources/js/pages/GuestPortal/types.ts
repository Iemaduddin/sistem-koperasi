export type AnggotaInfo = {
    id: string;
    no_anggota: string;
    nik: string;
    nama: string;
    alamat: string;
    no_hp: string;
    status: string;
    tanggal_bergabung: string | null;
};

export type SimpananItem = {
    id: string;
    jenis: string;
    kategori: string | null;
    jumlah: number;
    keterangan: string | null;
    tanggal: string | null;
};

export type PinjamanItem = {
    id: string;
    jumlah_pinjaman: number;
    bunga_persen: number;
    tenor_bulan: number;
    jumlah_angsuran: number;
    tanggal_mulai: string | null;
    status: string;
};

export type TransaksiPinjamanItem = {
    id: string;
    pinjaman_id: string;
    jumlah_bayar: number;
    denda_dibayar: number;
    tanggal_bayar: string | null;
};

export type DepositoLog = {
    id: number;
    nominal_bagi_hasil: number;
    tanggal_perhitungan: string | null;
    status_pengambilan: string;
    tanggal_pengambilan: string | null;
};

export type DepositoItem = {
    id: string;
    saldo: number;
    persen_bagi_hasil: number;
    tenor_bulan: number;
    status: string;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    rekening_koperasi: {
        nama: string;
        jenis: string;
    } | null;
    logs: DepositoLog[];
};

export type Summary = {
    total_simpanan: number;
    total_pinjaman: number;
    total_pembayaran_pinjaman: number;
    total_deposito: number;
};

export type HistoryPageProps = {
    anggota: AnggotaInfo;
    summary: Summary;
    simpanan: SimpananItem[];
    pinjaman: PinjamanItem[];
    transaksi_pinjaman: TransaksiPinjamanItem[];
    deposito: DepositoItem[];
};

export const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

export const formatDateTime = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

export const formatDateOnly = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
    }).format(date);
};

export const toDateOnly = (value: string | null) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
};

export const isWithinRange = (
    dateValue: string | null,
    from: string,
    to: string,
) => {
    const dateOnly = toDateOnly(dateValue);
    if (dateOnly === '') {
        return false;
    }

    if (from && dateOnly < from) {
        return false;
    }

    if (to && dateOnly > to) {
        return false;
    }

    return true;
};
