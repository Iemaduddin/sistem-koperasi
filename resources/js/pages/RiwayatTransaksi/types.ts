export type TransactionRow = {
    id: string;
    created_at: string;
    jenis: 'masuk' | 'keluar';
    sumber_tipe:
        | 'simpanan'
        | 'pinjaman'
        | 'angsuran_pinjaman'
        | 'deposito'
        | string;
    source_label: string;
    member_name: string;
    keterangan?: string | null;
    jumlah: string | number;
};

export type FilterState = {
    jenis: string;
    sumber: string;
    startDate: string;
    endDate: string;
};
