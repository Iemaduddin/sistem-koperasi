export type JenisSimpananRow = {
    id: string;
    nama: string;
    kode: string;
    terkunci: boolean;
    jumlah_minimal: number | null;
    jumlah_maksimal: number | null;
    created_at: string | null;
    updated_at: string | null;
};

export type JenisSimpananForm = {
    nama: string;
    kode: string;
    terkunci: boolean;
    jumlah_minimal: string;
    jumlah_maksimal: string;
};

export type JenisSimpananPageProps = {
    jenis_simpanan: JenisSimpananRow[];
    flash?: {
        success?: string;
        error?: string;
    };
};

export const initialJenisSimpananForm: JenisSimpananForm = {
    nama: '',
    kode: '',
    terkunci: false,
    jumlah_minimal: '',
    jumlah_maksimal: '',
};
