import { Head } from '@inertiajs/react';
import type { ReactElement } from 'react';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">Total Anggota</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        128
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">Simpanan Bulan Ini</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        Rp 24.500.000
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">Pinjaman Aktif</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        37
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">
                        Tagihan Jatuh Tempo
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        12
                    </p>
                </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-900">
                    Aktivitas Terbaru
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Area ini siap diisi dengan daftar transaksi, notifikasi,
                    atau ringkasan operasional harian koperasi.
                </p>
            </section>
        </>
    );
}

Dashboard.layout = (page: ReactElement) => (
    <DashboardLayout title="Dashboard">{page}</DashboardLayout>
);
