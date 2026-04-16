import { Head, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import Button from '@/components/button';
import Tabs, { type TabsItem } from '@/components/tabs';
import DepositoTab from './partials/DepositoTab';
import PinjamanTab from './partials/PinjamanTab';
import SimpananTab from './partials/SimpananTab';
import type { HistoryPageProps } from './types';

export default function GuestPortalHistory() {
    const { props } = usePage<{ props: HistoryPageProps }>();
    const pageProps = props as unknown as HistoryPageProps;

    const tabs = useMemo<TabsItem[]>(
        () => [
            {
                id: 'simpanan',
                label: 'Simpanan',
                badge: pageProps.summary.total_simpanan,
                content: <SimpananTab items={pageProps.simpanan} />,
            },
            {
                id: 'pinjaman',
                label: 'Pinjaman',
                badge: pageProps.summary.total_pembayaran_pinjaman,
                content: <PinjamanTab items={pageProps.transaksi_pinjaman} />,
            },
            {
                id: 'deposito',
                label: 'Deposito',
                badge: pageProps.summary.total_deposito,
                content: <DepositoTab items={pageProps.deposito} />,
            },
        ],
        [
            pageProps.deposito,
            pageProps.simpanan,
            pageProps.summary.total_deposito,
            pageProps.summary.total_pembayaran_pinjaman,
            pageProps.summary.total_simpanan,
            pageProps.transaksi_pinjaman,
        ],
    );

    return (
        <>
            <Head title="Riwayat Anggota" />

            <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
                <main className="mx-auto w-full max-w-6xl space-y-5">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">
                                    Portal Anggota
                                </p>
                                <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                                    Riwayat Transaksi
                                </h1>
                                <p className="mt-2 text-sm text-slate-600">
                                    {pageProps.anggota.no_anggota} -{' '}
                                    {pageProps.anggota.nama}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.post('/portal-anggota/reset')
                                }
                            >
                                Verifikasi Ulang
                            </Button>
                        </div>

                        <div className="mt-4 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                            <p>
                                <span className="font-medium text-slate-900">
                                    NIK:
                                </span>{' '}
                                {pageProps.anggota.nik}
                            </p>
                            <p>
                                <span className="font-medium text-slate-900">
                                    No. HP:
                                </span>{' '}
                                {pageProps.anggota.no_hp}
                            </p>
                            <p>
                                <span className="font-medium text-slate-900">
                                    Status:
                                </span>{' '}
                                <span className="capitalize">
                                    {pageProps.anggota.status}
                                </span>
                            </p>
                            <p>
                                <span className="font-medium text-slate-900">
                                    Bergabung:
                                </span>{' '}
                                {pageProps.anggota.tanggal_bergabung ?? '-'}
                            </p>
                        </div>
                    </section>

                    <Tabs items={tabs} defaultValue="simpanan" />
                </main>
            </div>
        </>
    );
}
