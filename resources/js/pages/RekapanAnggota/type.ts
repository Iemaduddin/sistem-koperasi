export type ImportSummary = {
    mode?: 'dry-run' | 'persist';
    start_row: number;
    total_rows: number;
    valid_rows: number;
    invalid_rows_count: number;
    entries_bulanan_count: number;
    skipped_sheets: string[];
    note: string;
    processed_sheets: Array<{
        sheet: string;
        rows_total: number;
        rows_valid: number;
        rows_invalid: number;
        entries_bulanan: number;
    }>;
    persist_summary?: {
        anggota_created: number;
        anggota_updated: number;
        pinjaman_created: number;
        angsuran_created: number;
        transaksi_pinjaman_created: number;
        rekening_simpanan_created: number;
        batch_simpanan_created: number;
        transaksi_simpanan_created: number;
    };
    invalid_rows: Array<{
        sheet: string;
        row: number;
        message: string;
    }>;
    table_rows: Array<{
        sheet: string;
        row: number;
        no_anggota: string;
        nama: string;
        tanggal_masuk: string;
        pinjaman: number | null;
        angsuran: number | null;
        tenor: number;
        bunga_persen_hasil: number | null;
        simpanan_awal: {
            pokok: number | null;
            wajib: number | null;
            sukarela: number | null;
        };
        entries_bulanan_terbaca: number;
        entry_bulanan_bulan_tahun: string[];
        entry_bulanan_detail: Array<{
            bulan_ke: number;
            kolom_range: string;
            bulan_tahun: string;
            angsuran_dibayar: number | null;
            simpanan_pokok_dibayar: number | null;
            simpanan_sukarela_dibayar: number | null;
        }>;
    }>;
    table_rows_truncated: boolean;
};

export type PageProps = {
    anggota_list?: Array<{
        id: string;
        no_anggota: string;
        nama: string;
        tanggal_masuk: string;
        simpanan_pokok: number;
        simpanan_wajib: number;
        simpanan_sukarela: number;
        pinjaman_pokok: number;
        pinjaman_total: number;
        angsuran_terbayar: number;
        sisa_pinjaman: number;
        status: 'AKTIF' | 'LUNAS';
    }>;
    anggota_detail_rows?: Array<{
        id: string;
        no_anggota: string;
        nama: string;
        tanggal_masuk: string;
        pinjaman: number;
        angsuran: number;
        tenor: number;
        simpanan_awal: {
            anggota: number;
            wajib: number;
            sukarela: number;
        };
        entries_bulanan: Array<{
            month_key: string;
            angsuran: number;
            wajib: number;
            sukarela: number;
        }>;
    }>;
    month_columns?: Array<{
        key: string;
        label: string;
    }>;
    rekening_koperasi?: Array<{
        id: string;
        nama: string;
        jenis: string;
        nomor_rekening: string;
        saldo: number | string;
    }>;
    import_summary?: ImportSummary;
};
