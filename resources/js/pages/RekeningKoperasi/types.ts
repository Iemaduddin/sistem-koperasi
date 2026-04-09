export type RekeningKoperasiRow = {
    id: string;
    nama: string;
    jenis: string;
    nomor_rekening: string | null;
    saldo: number | null;
    created_at: string | null;
    updated_at: string | null;
};

export type RekeningKoperasiForm = {
    nama: string;
    jenis: string;
    nomor_rekening: string;
    saldo: string;
};

export type RekeningKoperasiPageProps = {
    rekening_koperasi: RekeningKoperasiRow[];
    flash?: {
        success?: string;
        error?: string;
    };
};

export const initialRekeningKoperasiForm: RekeningKoperasiForm = {
    nama: '',
    jenis: 'bank',
    nomor_rekening: '',
    saldo: '',
};
