export type AnggotaStatus = 'aktif' | 'nonaktif' | 'keluar';

export type AnggotaKeluarHistory = {
    alasan_keluar: string;
    tanggal_pengajuan: string | null;
    tanggal_disetujui: string | null;
    disetujui_oleh: string | null;
};

export type AnggotaRow = {
    id: string;
    no_anggota: string;
    nik: string;
    nama: string;
    alamat: string;
    no_hp: string;
    no_hp_cadangan: string | null;
    status: AnggotaStatus;
    tanggal_bergabung: string;
    tanggal_keluar?: string | null;
    riwayat_keluar?: AnggotaKeluarHistory | null;
    created_at: string | null;
};

export type AnggotaForm = {
    nik: string;
    nama: string;
    alamat: string;
    no_hp: string;
    no_hp_cadangan: string;
    status: AnggotaStatus;
    tanggal_bergabung: string;
};

export type AnggotaPageProps = {
    anggota: AnggotaRow[];
    statusOptions: AnggotaStatus[];
    flash?: {
        success?: string;
        error?: string;
    };
};

export const initialAnggotaForm: AnggotaForm = {
    nik: '',
    nama: '',
    alamat: '',
    no_hp: '',
    no_hp_cadangan: '',
    status: 'aktif',
    tanggal_bergabung: new Date().toISOString().split('T')[0],
};
