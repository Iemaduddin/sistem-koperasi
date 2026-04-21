import Button from '@/components/button';
import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { ReactElement, useRef, useState } from 'react';
import { toast } from 'react-toastify';

type ImportSummary = {
    mode?: 'dry-run' | 'persist';
    start_row: number;
    total_rows: number;
    valid_rows: number;
    invalid_rows_count: number;
    entries_bulanan_count: number;
    skipped_sheets: string[];
    note: string;
    processed_sheets: Array<{
        sheet: string;
        rows_total: number;
        rows_valid: number;
        rows_invalid: number;
        entries_bulanan: number;
    }>;
    persist_summary?: {
        anggota_created: number;
        anggota_updated: number;
        pinjaman_created: number;
        angsuran_created: number;
        transaksi_pinjaman_created: number;
        rekening_simpanan_created: number;
        batch_simpanan_created: number;
        transaksi_simpanan_created: number;
    };
    invalid_rows: Array<{
        sheet: string;
        row: number;
        message: string;
    }>;
    table_rows: Array<{
        sheet: string;
        row: number;
        no_anggota: string;
        nama: string;
        tanggal_masuk: string;
        pinjaman: number | null;
        angsuran: number | null;
        tenor: number;
        bunga_persen_hasil: number | null;
        simpanan_awal: {
            pokok: number | null;
            wajib: number | null;
            sukarela: number | null;
        };
        entries_bulanan_terbaca: number;
        entry_bulanan_bulan_tahun: string[];
        entry_bulanan_detail: Array<{
            bulan_ke: number;
            kolom_range: string;
            bulan_tahun: string;
            angsuran_dibayar: number | null;
            simpanan_pokok_dibayar: number | null;
            simpanan_sukarela_dibayar: number | null;
        }>;
    }>;
    table_rows_truncated: boolean;
};

type PageProps = {
    import_summary?: ImportSummary;
};

export default function RiwayatTransaksiIndex() {
    const { props } = usePage<{ props: PageProps }>();
    const pageProps = props as unknown as PageProps;
    const summary = pageProps.import_summary;
    const maxEntryMonths = summary
        ? Math.max(
              0,
              ...summary.table_rows.map(
                  (item) => item.entry_bulanan_detail.length,
              ),
          )
        : 0;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importMode, setImportMode] = useState<'dry-run' | 'persist'>(
        'persist',
    );
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleImport = () => {
        if (!selectedFile) {
            toast.error('Silakan pilih file Excel terlebih dahulu.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('mode', importMode);

        setIsSubmitting(true);

        router.post('/riwayat-transaksi/import', formData, {
            preserveScroll: true,
            forceFormData: true,
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat membaca file.',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Riwayat Transaksi" />

            <section className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-800">
                        Import Data Excel
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Parser membaca semua sheet kecuali nama sheet dengan
                        awalan rekap, mulai dari baris ke-4.
                    </p>

                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                            onChange={(event) => {
                                setSelectedFile(
                                    event.target.files?.[0] ?? null,
                                );
                            }}
                        />

                        <select
                            value={importMode}
                            onChange={(event) =>
                                setImportMode(
                                    event.target.value as 'dry-run' | 'persist',
                                )
                            }
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                        >
                            <option value="persist">
                                Persist (simpan ke DB)
                            </option>
                            <option value="dry-run">
                                Dry-run (preview saja)
                            </option>
                        </select>

                        <Button
                            variant="primary"
                            loading={isSubmitting}
                            loadingText="Memproses..."
                            onClick={handleImport}
                        >
                            Import Data
                        </Button>
                    </div>
                </div>

                {summary && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        <h3 className="font-semibold">Ringkasan Parsing</h3>
                        <p className="mt-1">
                            Start row: {summary.start_row} | Total baris:{' '}
                            {summary.total_rows} | Valid: {summary.valid_rows} |
                            Invalid: {summary.invalid_rows_count}
                        </p>
                        <p className="mt-1">
                            Entries bulanan terbaca:{' '}
                            {summary.entries_bulanan_count}
                        </p>
                        <p className="mt-1">{summary.note}</p>
                        <p className="mt-1 text-xs font-medium text-emerald-800">
                            Mode: {summary.mode ?? 'persist'}
                        </p>

                        {summary.persist_summary && (
                            <div className="mt-3 rounded-lg border border-emerald-300 bg-white p-3 text-xs text-slate-700">
                                <p className="font-semibold text-emerald-900">
                                    Ringkasan Persist
                                </p>
                                <p className="mt-1">
                                    Anggota baru:{' '}
                                    {summary.persist_summary.anggota_created} |
                                    Anggota update:{' '}
                                    {summary.persist_summary.anggota_updated}
                                </p>
                                <p className="mt-1">
                                    Pinjaman baru:{' '}
                                    {summary.persist_summary.pinjaman_created} |
                                    Angsuran baru:{' '}
                                    {summary.persist_summary.angsuran_created}
                                </p>
                                <p className="mt-1">
                                    Transaksi pinjaman:{' '}
                                    {
                                        summary.persist_summary
                                            .transaksi_pinjaman_created
                                    }
                                </p>
                                <p className="mt-1">
                                    Rekening simpanan baru:{' '}
                                    {
                                        summary.persist_summary
                                            .rekening_simpanan_created
                                    }{' '}
                                    | Batch simpanan baru:{' '}
                                    {
                                        summary.persist_summary
                                            .batch_simpanan_created
                                    }
                                </p>
                                <p className="mt-1">
                                    Transaksi simpanan:{' '}
                                    {
                                        summary.persist_summary
                                            .transaksi_simpanan_created
                                    }
                                </p>
                            </div>
                        )}

                        {summary.skipped_sheets.length > 0 && (
                            <p className="mt-2">
                                Sheet di-skip:{' '}
                                {summary.skipped_sheets.join(', ')}
                            </p>
                        )}

                        {summary.processed_sheets.length > 0 && (
                            <div className="mt-3 overflow-x-auto rounded-lg border border-emerald-200 bg-white">
                                <table className="min-w-full text-left text-xs text-slate-700">
                                    <thead className="bg-slate-100 text-slate-600">
                                        <tr>
                                            <th className="px-3 py-2">Sheet</th>
                                            <th className="px-3 py-2">Total</th>
                                            <th className="px-3 py-2">Valid</th>
                                            <th className="px-3 py-2">
                                                Invalid
                                            </th>
                                            <th className="px-3 py-2">
                                                Entry Bulanan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.processed_sheets.map(
                                            (item) => (
                                                <tr
                                                    key={item.sheet}
                                                    className="border-t border-slate-100"
                                                >
                                                    <td className="px-3 py-2">
                                                        {item.sheet}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {item.rows_total}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {item.rows_valid}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {item.rows_invalid}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {item.entries_bulanan}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {summary.table_rows_truncated && (
                            <p className="mt-3 text-xs text-amber-700">
                                Tabel detail dibatasi maksimal 300 baris agar
                                halaman tetap ringan.
                            </p>
                        )}

                        {summary.table_rows.length > 0 && (
                            <div className="mt-3 overflow-x-auto rounded-lg border border-emerald-200 bg-white">
                                <table className="min-w-300 text-left text-xs text-slate-700">
                                    <thead className="bg-slate-100 text-slate-600">
                                        <tr>
                                            <th className="px-3 py-2">Sheet</th>
                                            <th className="px-3 py-2">Row</th>
                                            <th className="px-3 py-2">
                                                No Anggota
                                            </th>
                                            <th className="px-3 py-2">Nama</th>
                                            <th className="px-3 py-2">
                                                Tanggal Masuk
                                            </th>
                                            <th className="px-3 py-2">
                                                Pinjaman
                                            </th>
                                            <th className="px-3 py-2">
                                                Angsuran
                                            </th>
                                            <th className="px-3 py-2">Tenor</th>
                                            <th className="px-3 py-2">
                                                Bunga %
                                            </th>
                                            <th className="px-3 py-2">
                                                Simp. Pokok
                                            </th>
                                            <th className="px-3 py-2">
                                                Simp. Wajib
                                            </th>
                                            <th className="px-3 py-2">
                                                Simp. Sukarela
                                            </th>
                                            {Array.from(
                                                { length: maxEntryMonths },
                                                (_, index) => {
                                                    const monthNumber =
                                                        index + 1;
                                                    return (
                                                        <th
                                                            key={`month-head-${monthNumber}`}
                                                            className="px-3 py-2"
                                                        >
                                                            {`Bulan ${monthNumber}`}
                                                        </th>
                                                    );
                                                },
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.table_rows.map((item) => (
                                            <tr
                                                key={`${item.sheet}-${item.row}-${item.no_anggota}`}
                                                className="border-t border-slate-100"
                                            >
                                                <td className="px-3 py-2">
                                                    {item.sheet}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.row}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.no_anggota}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.nama}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.tanggal_masuk}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.pinjaman ?? '-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.angsuran ?? '-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.tenor}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.bunga_persen_hasil ??
                                                        '-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.simpanan_awal.pokok ??
                                                        '-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.simpanan_awal.wajib ??
                                                        '-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.simpanan_awal
                                                        .sukarela ?? '-'}
                                                </td>
                                                {Array.from(
                                                    { length: maxEntryMonths },
                                                    (_, index) => {
                                                        const monthNumber =
                                                            index + 1;
                                                        const monthDetail =
                                                            item.entry_bulanan_detail.find(
                                                                (detail) =>
                                                                    detail.bulan_ke ===
                                                                    monthNumber,
                                                            ) ?? null;

                                                        return (
                                                            <td
                                                                key={`${item.sheet}-${item.row}-month-${monthNumber}`}
                                                                className="px-3 py-2 align-top"
                                                            >
                                                                {monthDetail ? (
                                                                    <div className="space-y-0.5">
                                                                        <div className="font-medium text-slate-900">
                                                                            {`${monthDetail.kolom_range} ${monthDetail.bulan_tahun}`}
                                                                        </div>
                                                                        <div>
                                                                            {`Angsuran: ${monthDetail.angsuran_dibayar ?? '-'} `}
                                                                        </div>
                                                                        <div>
                                                                            {`Pokok: ${monthDetail.simpanan_pokok_dibayar ?? '-'}`}
                                                                        </div>
                                                                        <div>
                                                                            {`Sukarela: ${monthDetail.simpanan_sukarela_dibayar ?? '-'}`}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400">
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>
                                                        );
                                                    },
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {summary.invalid_rows.length > 0 && (
                            <div className="mt-3 overflow-x-auto rounded-lg border border-rose-200 bg-white">
                                <table className="min-w-full text-left text-xs text-slate-700">
                                    <thead className="bg-rose-50 text-rose-700">
                                        <tr>
                                            <th className="px-3 py-2">Sheet</th>
                                            <th className="px-3 py-2">Row</th>
                                            <th className="px-3 py-2">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.invalid_rows.map((item) => (
                                            <tr
                                                key={`invalid-${item.sheet}-${item.row}`}
                                                className="border-t border-rose-100"
                                            >
                                                <td className="px-3 py-2">
                                                    {item.sheet}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.row}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.message}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </>
    );
}

RiwayatTransaksiIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Riwayat Transaksi">{page}</DashboardLayout>
);
