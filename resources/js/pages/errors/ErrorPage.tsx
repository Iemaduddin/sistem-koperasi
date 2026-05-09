import { Head, Link } from '@inertiajs/react';
import { LuArrowLeft, LuHouse, LuLogIn, LuLock } from 'react-icons/lu';

type ErrorPageProps = {
    status?: 401 | 403 | 404 | 500;
};

const errorConfigs = {
    401: {
        title: '401',
        heading: 'Tidak Terautentikasi',
        message:
            'Anda harus login terlebih dahulu untuk mengakses halaman ini.',
        icon: LuLogIn,
        buttons: [
            {
                href: '/login',
                label: 'Login',
                variant: 'primary' as const,
            },
        ],
    },
    403: {
        title: '403',
        heading: 'Akses Ditolak',
        message:
            'Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator jika Anda merasa ini adalah kesalahan.',
        icon: LuLock,
        buttons: [
            {
                href: '/',
                label: 'Beranda',
                variant: 'primary' as const,
            },
        ],
    },
    404: {
        title: '404',
        heading: 'Halaman Tidak Ditemukan',
        message: 'Maaf, halaman yang Anda cari tidak ada atau sudah dihapus.',
        icon: LuHouse,
        buttons: [
            {
                href: '/',
                label: 'Beranda',
                variant: 'primary' as const,
            },
        ],
    },
    500: {
        title: '500',
        heading: 'Kesalahan Server',
        message:
            'Terjadi kesalahan pada server. Tim kami telah diberitahu dan sedang menangani masalah ini.',
        icon: LuHouse,
        buttons: [
            {
                href: '/',
                label: 'Beranda',
                variant: 'primary' as const,
            },
        ],
    },
};

export default function ErrorPage({ status = 500 }: ErrorPageProps) {
    const config = errorConfigs[status] ?? errorConfigs[500];
    const Icon = config.icon;

    return (
        <>
            <Head title={`${config.title} - ${config.heading}`} />
            <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
                <div className="max-w-md text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="rounded-full bg-slate-100 p-6">
                            <Icon className="h-16 w-16 text-slate-400" />
                        </div>
                    </div>

                    <h1 className="text-6xl font-bold text-slate-900">
                        {config.title}
                    </h1>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">
                        {config.heading}
                    </p>

                    <p className="mt-4 mb-8 text-slate-600">{config.message}</p>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        {config.buttons.map((btn, idx) => (
                            <Link
                                key={idx}
                                href={btn.href}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-700"
                            >
                                <Icon className="h-5 w-5" />
                                {btn.label}
                            </Link>
                        ))}

                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <LuArrowLeft className="h-5 w-5" />
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
