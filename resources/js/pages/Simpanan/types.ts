export type TipeTransaksiOption = 'setor' | 'tarik';

export type RekeningKoperasiOption = {
    id: string;
    nama: string;
    jenis: 'bank' | 'tunai';
    nomor_rekening: string | null;
    saldo: number | string | null;
};

export type AnggotaOption = {
    id: string;
    no_anggota: string;
    nama: string;
    alamat: string;
};

export type RekeningSimpananOption = {
    id: string;
    saldo: number | string;
    anggota?: {
        id?: string;
        no_anggota?: string | null;
        nama: string | null;
    };
    jenis_simpanan?: {
        nama: string | null;
        kode: string | null;
        jumlah_maksimum?: number | string | null;
    };
};

export type SimpananBatchTransaction = {
    id: string;
    rekening_simpanan_id: string;
    jenis_transaksi: TipeTransaksiOption;
    jumlah: number | string;
    keterangan: string | null;
    created_at: string;
    rekening_simpanan?: RekeningSimpananOption;
};

export type SimpananBatch = {
    id: string;
    kode_transaksi: string;
    tanggal_transaksi: string;
    total: number | string;
    anggota?: AnggotaOption;
    user?: {
        id: string;
        name: string;
        email: string;
    };
    transaksi_simpanan?: SimpananBatchTransaction[];
};

export type SimpananRow = {
    id: string;
    batch_id?: string | null;
    rekening_simpanan_id: string;
    jenis_transaksi: TipeTransaksiOption;
    jumlah: number;
    keterangan: string | null;
    created_at: string;
    rekening_simpanan?: RekeningSimpananOption;
    batch?: SimpananBatch | null;
};

export type SimpananPageProps = {
    simpanan: SimpananRow[];
    rekening_koperasi: RekeningKoperasiOption[];
    flash?: {
        success?: string;
        error?: string;
    };
};

export type SimpananForm = {
    rekening_koperasi_id: string;
    anggota_id: string;
    jenis_transaksi: 'setor';
    simpanan_pokok_jumlah: string;
    simpanan_pokok_keterangan: string;
    simpanan_wajib_jumlah: string;
    simpanan_wajib_keterangan: string;
    simpanan_sukarela_jumlah: string;
    simpanan_sukarela_keterangan: string;
    created_at: string;
};

export function toDatetimeLocalValue(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (input: number) => String(input).padStart(2, '0');

    return (
        [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate()),
        ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
}

export const initialSimpananForm: SimpananForm = {
    rekening_koperasi_id: '',
    anggota_id: '',
    jenis_transaksi: 'setor',
    simpanan_pokok_jumlah: '100000',
    simpanan_pokok_keterangan: '',
    simpanan_wajib_jumlah: '',
    simpanan_wajib_keterangan: '',
    simpanan_sukarela_jumlah: '',
    simpanan_sukarela_keterangan: '',
    created_at: toDatetimeLocalValue(new Date()),
};

export type AnggotaNominalRow = {
    id: string;
    anggota_key: string;
    anggota_id: string | null;
    no_anggota: string;
    nama: string;
    pokok: number;
    wajib: number;
    sukarela: number;
    total: number;
};

export type InvoiceSummary = {
    total: number;
};

export type BatchSummaryRow = {
    batch: SimpananBatch;
    kode_transaksi: string;
    tanggal_transaksi: string;
    total: number;
    jumlah_detail: number;
    details: SimpananRow[];
};
