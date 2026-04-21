import Button from '@/components/button';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { Head } from '@inertiajs/react';
import { ReactElement } from 'react';

export default function RiwayatTransaksiIndex() {
    return (
        <>
            <Head title="Riwayat Transaksi" />

            <section className="space-y-4">
                <Button variant="primary">Import Data</Button>
            </section>
        </>
    );
}

RiwayatTransaksiIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Riwayat Transaksi">{page}</DashboardLayout>
);
