import { Head, router } from '@inertiajs/react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';

type SystemUpdateProps = {
    version?: string | null;
};

export default function SystemUpdate({ version }: SystemUpdateProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdate = () => {
        if (isSubmitting) {
            return;
        }

        const confirmed = window.confirm(
            'Yakin ingin menjalankan update sistem? Proses akan berjalan di latar belakang.',
        );

        if (!confirmed) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/system-update',
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <>
            <Head title="Tentang Sistem" />

            <section className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                                Tentang Sistem 
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Update Versi Sistem COBA COBA
                            </h1>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            {version ? `Versi saat ini: ${version}` : 'Versi saat ini tidak tersedia'}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Jalankan Pembaruan Sistem
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Tombol di bawah ini akan memicu skrip pembaruan sistem di server.
                                Pastikan Anda memiliki izin Super Admin atau Master Admin untuk
                                menjalankan proses ini.
                            </p>

                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handleUpdate}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                                >
                                    <LuRefreshCw className="mr-2 h-4 w-4" />
                                    {isSubmitting ? 'Updating...' : 'Update Versi'}
                                </button>
                            </div>

                            <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                                <p className="font-medium text-slate-800">Catatan:</p>
                                <ul className="mt-2 list-disc space-y-2 pl-5">
                                    <li>Pastikan data sudah dibackup sebelum menjalankan pembaruan.</li>
                                    <li>Proses update akan berjalan di background dan tidak memblokir browser.</li>
                                    <li>Notifikasi sukses akan muncul setelah permintaan dikirim.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Informasi Sistem</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Jika Anda ingin memperbarui versi sistem, gunakan tombol di atas.
                                Pastikan hanya Super Admin atau Master Admin yang memiliki akses tombol ini.
                            </p>

                            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="font-medium text-slate-900">Akses</span>
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                        Super Admin / Master Admin
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="font-medium text-slate-900">Method</span>
                                    <span className="text-slate-600">POST + CSRF</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

SystemUpdate.layout = (page: ReactElement) => (
    <DashboardLayout title="Tentang Sistem">{page}</DashboardLayout>
);
