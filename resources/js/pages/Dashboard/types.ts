export interface Stats {
    anggota: {
        total: number;
        aktif: number;
        nonaktif: number;
        keluar: number;
    };
    arus_kas: {
        masuk: number;
        keluar: number;
        aset_mengendap: number;
    };
    aset: {
        total: number;
    };
    pinjaman_aktif: {
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
        group_by: 'day' | 'week' | 'month' | 'year' | 'all';
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
