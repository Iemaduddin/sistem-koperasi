export interface Stats {
    anggota: {
        total: number;
        aktif: number;
        nonaktif: number;
        keluar: number;
    };
    aset: {
        total: number;
        period_value: number;
    };
    pinjaman_aktif: {
        value: number;
    };
    tagihan_jatuh_tempo: {
        value: number;
    };
    saldo_keluar: {
        value: number;
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
        start_date: string;
        end_date: string;
        group_by: 'day' | 'week' | 'month' | 'year';
    };
}

export const groupByOptions = [
    { value: 'day', label: 'Harian' },
    { value: 'week', label: 'Mingguan' },
    { value: 'month', label: 'Bulanan' },
    { value: 'year', label: 'Tahunan' },
    { value: 'all', label: 'Tampil Semua' },
];

export const anggotaOptions = [
    { value: 'total', label: 'Semua' },
    { value: 'aktif', label: 'Aktif' },
    { value: 'nonaktif', label: 'Non-aktif' },
    { value: 'keluar', label: 'Keluar' },
];
