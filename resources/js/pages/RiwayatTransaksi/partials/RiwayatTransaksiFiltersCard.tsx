import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import { getFilterSummary } from '../helpers';
import type { FilterState } from '../types';

type Props = {
    filters: FilterState;
    onJenisChange: (value: string) => void;
    onSumberChange: (value: string) => void;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    onReset: () => void;
};
export default function RiwayatTransaksiFiltersCard({
    filters,
    onJenisChange,
    onSumberChange,
    onStartDateChange,
    onEndDateChange,
    onReset,
}: Props) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                    {getFilterSummary(filters)}
                </p>
                <button
                    type="button"
                    onClick={onReset}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                    Reset filter
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                    <FloatingSelect
                        label="Jenis Transaksi"
                        value={filters.jenis}
                        onChange={(event) => onJenisChange(event.target.value)}
                        options={[
                            { value: 'all', label: 'Semua Jenis' },
                            { value: 'masuk', label: 'Masuk' },
                            { value: 'keluar', label: 'Keluar' },
                        ]}
                    />
                </div>
                <div>
                    <FloatingSelect
                        label="Sumber Dana"
                        value={filters.sumber}
                        onChange={(event) => onSumberChange(event.target.value)}
                        options={[
                            { value: 'all', label: 'Semua Sumber' },
                            {
                                value: 'simpanan_lainnya',
                                label: 'Simpanan',
                            },
                            { value: 'tabungan', label: 'Tabungan' },
                            { value: 'pinjaman', label: 'Pinjaman' },
                            {
                                value: 'angsuran_pinjaman',
                                label: 'Angsuran Pinjaman',
                            },
                            {
                                value: 'deposito',
                                label: 'Tabungan Berjangka',
                            },
                        ]}
                    />
                </div>
                <div>
                    <FloatingInput
                        label="Dari Tanggal"
                        type="date"
                        value={filters.startDate}
                        onChange={(
                            event: React.ChangeEvent<HTMLInputElement>,
                        ) => onStartDateChange(event.target.value)}
                    />
                </div>
                <div>
                    <FloatingInput
                        label="Sampai Tanggal"
                        type="date"
                        value={filters.endDate}
                        onChange={(
                            event: React.ChangeEvent<HTMLInputElement>,
                        ) => onEndDateChange(event.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
