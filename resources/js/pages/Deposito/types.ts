export type RekeningKoperasiOption = {
    id: string;
    nama: string;
    jenis: 'bank' | 'tunai';
    nomor_rekening: string | null;
};

export type AnggotaOption = {
    id: string;
    no_anggota: string;
    nama: string;
    alamat: string;
};

export type JenisSimpananRequirement = {
    id: number;
    kode: string;
    nama: string;
    jumlah_minimum: number | string | null;
};

export type RekeningSimpananSaldoRow = {
    id: string;
    anggota_id?: string | null;
    saldo: number | string;
    jenis_simpanan?: {
        id?: number;
        kode?: string | null;
        nama?: string | null;
        jumlah_minimum?: number | string | null;
    };
};

export type LogBagiHasilRow = {
    id?: number;
    tanggal_perhitungan: string;
    nominal_bagi_hasil: number;
    status_pengambilan?: 'belum' | 'sudah';
    tanggal_pengambilan?: string | null;
};

export type SimpananDepositoRow = {
    id: string;
    saldo: number | string;
    persen_bagi_hasil: number | string;
    tenor_bulan: number;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: 'aktif' | 'selesai';
    anggota?: {
        no_anggota?: string | null;
        nama?: string | null;
    };
    log_bagi_hasil?: Array<{
        id?: number;
        nominal_bagi_hasil: number | string;
        tanggal_perhitungan: string;
        status_pengambilan?: 'belum' | 'sudah';
        tanggal_pengambilan?: string | null;
    }>;
};

export type DepositoPageProps = {
    rekening_koperasi?: RekeningKoperasiOption[];
    anggota?: AnggotaOption[];
    simpanan_deposito?: SimpananDepositoRow[];
    rekening_simpanan?: RekeningSimpananSaldoRow[];
    jenis_simpanan?: JenisSimpananRequirement[];
    flash?: {
        success?: string;
        error?: string;
    };
};

export type DepositoForm = {
    rekening_koperasi_id: string;
    anggota_id: string;
    saldo: string;
    tenor_bulan: '6' | '12';
    persen_bagi_hasil: number;
    tanggal_mulai: string;
    tanggal_selesai: string;
};

export function toDateValue(value: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(value);

    const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
    const month = parts.find((part) => part.type === 'month')?.value ?? '00';
    const day = parts.find((part) => part.type === 'day')?.value ?? '00';

    return `${year}-${month}-${day}`;
}

export function normalizeDateOnly(value: string | Date): string {
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return '';
        }

        return toDateValue(value);
    }

    const text = String(value ?? '').trim();
    if (!text) {
        return '';
    }

    const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
        const year = Number(dateOnlyMatch[1]);
        const month = Number(dateOnlyMatch[2]);
        const day = Number(dateOnlyMatch[3]);
        const parsed = new Date(year, month - 1, day);

        if (
            !Number.isNaN(parsed.getTime()) &&
            parsed.getFullYear() === year &&
            parsed.getMonth() + 1 === month &&
            parsed.getDate() === day
        ) {
            return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
        }
    }

    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return toDateValue(parsed);
}

export function addMonths(dateString: string, monthToAdd: number): string {
    const normalizedDate = normalizeDateOnly(dateString);
    const base = normalizedDate
        ? new Date(`${normalizedDate}T00:00:00`)
        : new Date(Number.NaN);

    if (Number.isNaN(base.getTime())) {
        return '';
    }

    const next = new Date(base);
    next.setMonth(next.getMonth() + monthToAdd);

    return toDateValue(next);
}

export function getPersenBagiHasil(tenorBulan: '6' | '12'): number {
    return tenorBulan === '12' ? 0.8 : 0.6;
}

export function formatRupiah(value: number): string {
    return `Rp ${value.toLocaleString('id-ID')}`;
}

export function createInitialDepositoForm(now = new Date()): DepositoForm {
    const tanggalMulai = normalizeDateOnly(now);

    return {
        rekening_koperasi_id: '',
        anggota_id: '',
        saldo: '',
        tenor_bulan: '6',
        persen_bagi_hasil: 0.6,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: addMonths(tanggalMulai, 6),
    };
}
