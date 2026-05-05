export type AnggotaOption = {
    id: string;
    no_anggota: string;
    nama: string;
};

export type RekeningKoperasiOption = {
    id: string;
    nama: string;
    jenis: string;
    nomor_rekening: string | null;
    saldo: string | number;
};

export type TabunganForm = {
    rekening_koperasi_id: string;
    anggota_id: string;
    jumlah: string;
    keterangan: string;
    created_at: string;
};

export type TabunganNominalRow = {
    id: string;
    anggota_id: string | null;
    no_anggota: string;
    nama: string;
    nominal: number;
};

export type TarikTabunganTarget = {
    anggotaId: string;
    anggotaLabel: string;
    maxTarikTabungan: number;
};

export type TarikTabunganForm = {
    rekening_koperasi_id: string;
    jumlah: string;
    keterangan: string;
    created_at: string;
};

export type TabunganPageProps = {
    tabungan: any;
    rekening_koperasi: RekeningKoperasiOption[];
};

export const initialTabunganForm = (): TabunganForm => ({
    rekening_koperasi_id: '',
    anggota_id: '',
    jumlah: '',
    keterangan: '',
    created_at: toDatetimeLocalValue(new Date()),
});

export const initialTarikTabunganForm = (): TarikTabunganForm => ({
    rekening_koperasi_id: '',
    jumlah: '',
    keterangan: '',
    created_at: toDatetimeLocalValue(new Date()),
});

export function toDatetimeLocalValue(value: Date): string {
    const pad = (input: number) => String(input).padStart(2, '0');

    return (
        [
            value.getFullYear(),
            pad(value.getMonth() + 1),
            pad(value.getDate()),
        ].join('-') + `T${pad(value.getHours())}:${pad(value.getMinutes())}`
    );
}
