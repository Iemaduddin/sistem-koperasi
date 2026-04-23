export interface Stats {
    anggota: {
        total: number;
        aktif: number;
        nonaktif: number;
        keluar: number;
    };
    aset: {
        value: number;
        period: string;
    };
    pinjaman_aktif: {
        value: number;
        period: string;
    };
    tagihan_jatuh_tempo: {
        value: number;
        period: string;
    };
    saldo_keluar: {
        value: number;
        period: string;
    };
}

export interface ChartData {
    loans: {
        x: string;
        y: number;
    }[];
    cashflow: {
        id: string;
        color: string;
        data: {
            x: string;
            y: number;
        }[];
    }[];
    filters: {
        cash_period: string;
        loan_period: string;
    };
}

export const periodOptions = [
    { value: 'hari', label: 'Hari' },
    { value: 'minggu', label: 'Minggu' },
    { value: 'bulan', label: 'Bulan' },
    { value: 'tahun', label: 'Tahun' },
    { value: 'semua', label: 'Semua' },
];

export const anggotaOptions = [
    { value: 'total', label: 'Semua' },
    { value: 'aktif', label: 'Aktif' },
    { value: 'nonaktif', label: 'Non-aktif' },
    { value: 'keluar', label: 'Keluar' },
];
