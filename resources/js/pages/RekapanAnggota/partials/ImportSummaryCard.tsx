import { ImportSummary } from '../type';

type Props = {
    summary: ImportSummary;
};

export default function ImportSummaryCard({ summary }: Props) {
    const maxEntryMonths = Math.max(
        0,
        ...summary.table_rows.map((item) => item.entry_bulanan_detail.length),
    );

    return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <h3 className="font-semibold">Ringkasan Import</h3>
            <p className="mt-1">
                Start row: {summary.start_row} | Total baris:{' '}
                {summary.total_rows} | Valid: {summary.valid_rows} | Invalid:{' '}
                {summary.invalid_rows_count}
            </p>
            <p className="mt-1">
                Entries bulanan terbaca: {summary.entries_bulanan_count}
            </p>
            <p className="mt-1">{summary.note}</p>

            {summary.persist_summary && (
                <div className="mt-3 rounded-lg border border-emerald-300 bg-white p-3 text-xs text-slate-700">
                    <p className="font-semibold text-emerald-900">
                        Ringkasan Persist
                    </p>
                    <p className="mt-1">
                        Anggota baru: {summary.persist_summary.anggota_created}{' '}
                        | Anggota update:{' '}
                        {summary.persist_summary.anggota_updated}
                    </p>
                    <p className="mt-1">
                        Pinjaman baru:{' '}
                        {summary.persist_summary.pinjaman_created} | Angsuran
                        baru: {summary.persist_summary.angsuran_created}
                    </p>
                    <p className="mt-1">
                        Transaksi pinjaman:{' '}
                        {summary.persist_summary.transaksi_pinjaman_created}
                    </p>
                    <p className="mt-1">
                        Rekening simpanan baru:{' '}
                        {summary.persist_summary.rekening_simpanan_created} |
                        Batch simpanan baru:{' '}
                        {summary.persist_summary.batch_simpanan_created}
                    </p>
                    <p className="mt-1">
                        Transaksi simpanan:{' '}
                        {summary.persist_summary.transaksi_simpanan_created}
                    </p>
                </div>
            )}

            {summary.skipped_sheets.length > 0 && (
                <p className="mt-2">
                    Sheet di-skip: {summary.skipped_sheets.join(', ')}
                </p>
            )}

            {summary.header_warnings && summary.header_warnings.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-amber-200 bg-amber-50/60">
                    <table className="min-w-full text-left text-xs text-amber-900">
                        <thead className="bg-amber-100/80 text-amber-800">
                            <tr>
                                <th className="px-3 py-2">Sheet</th>
                                <th className="px-3 py-2">Kolom</th>
                                <th className="px-3 py-2">Expected</th>
                                <th className="px-3 py-2">Actual</th>
                                <th className="px-3 py-2">Catatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.header_warnings.map((item) => (
                                <tr
                                    key={`header-warning-${item.sheet}-${item.column}-${item.row}`}
                                    className="border-t border-amber-200/80"
                                >
                                    <td className="px-3 py-2">{item.sheet}</td>
                                    <td className="px-3 py-2">{item.column}</td>
                                    <td className="px-3 py-2">
                                        {item.expected}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.actual ?? '-'}
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

            {summary.processed_sheets.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-emerald-200 bg-white">
                    <table className="min-w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-100 text-slate-600">
                            <tr>
                                <th className="px-3 py-2">Sheet</th>
                                <th className="px-3 py-2">Total</th>
                                <th className="px-3 py-2">Valid</th>
                                <th className="px-3 py-2">Invalid</th>
                                <th className="px-3 py-2">Entry Bulanan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.processed_sheets.map((item) => (
                                <tr
                                    key={item.sheet}
                                    className="border-t border-slate-100"
                                >
                                    <td className="px-3 py-2">{item.sheet}</td>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {summary.table_rows_truncated && (
                <p className="mt-3 text-xs text-amber-700">
                    Tabel detail dibatasi maksimal 300 baris agar halaman tetap
                    ringan.
                </p>
            )}

            {summary.table_rows.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-emerald-200 bg-white">
                    <table className="min-w-300 text-left text-xs text-slate-700">
                        <thead className="bg-slate-100 text-slate-600">
                            <tr>
                                <th className="px-3 py-2">Sheet</th>
                                <th className="px-3 py-2">Row</th>
                                <th className="px-3 py-2">No Anggota</th>
                                <th className="px-3 py-2">Nama</th>
                                <th className="px-3 py-2">Tanggal Masuk</th>
                                <th className="px-3 py-2">Pinjaman</th>
                                <th className="px-3 py-2">Angsuran</th>
                                <th className="px-3 py-2">Tenor</th>
                                <th className="px-3 py-2">Bagi Hasil %</th>
                                <th className="px-3 py-2">Simp. Pokok</th>
                                <th className="px-3 py-2">Simp. Wajib</th>
                                <th className="px-3 py-2">Simp. Sukarela</th>
                                {Array.from(
                                    { length: maxEntryMonths },
                                    (_, index) => {
                                        const monthNumber = index + 1;

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
                                    <td className="px-3 py-2">{item.sheet}</td>
                                    <td className="px-3 py-2">{item.row}</td>
                                    <td className="px-3 py-2">
                                        {item.no_anggota}
                                    </td>
                                    <td className="px-3 py-2">{item.nama}</td>
                                    <td className="px-3 py-2">
                                        {item.tanggal_masuk}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.pinjaman ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.angsuran ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">{item.tenor}</td>
                                    <td className="px-3 py-2">
                                        {item.bunga_persen_hasil ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.simpanan_awal.pokok ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.simpanan_awal.wajib ?? '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.simpanan_awal.sukarela ?? '-'}
                                    </td>
                                    {Array.from(
                                        { length: maxEntryMonths },
                                        (_, index) => {
                                            const monthNumber = index + 1;
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
                                                                {`Wajib: ${monthDetail.simpanan_wajib_dibayar ?? '-'}`}
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
                                    <td className="px-3 py-2">{item.sheet}</td>
                                    <td className="px-3 py-2">{item.row}</td>
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
    );
}
