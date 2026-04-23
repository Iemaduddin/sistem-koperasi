import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { ReactElement } from 'react';

export default function RiwayatTransaksiIndex() {
    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-bold text-neutral-800">
                Riwayat Transaksi
            </h1>
        </div>
    );
}

RiwayatTransaksiIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Riwayat Transaksi">{page}</DashboardLayout>
);
