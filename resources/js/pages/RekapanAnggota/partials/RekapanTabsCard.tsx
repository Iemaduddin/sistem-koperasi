import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import RekapanDetailedTable from './RekapanDetailedTable';
import RekapanSummaryTable from './RekapanSummaryTable';
import { PageProps } from '../type';
import FloatingSelect from '@/components/floating-input/select';

type AnggotaListItem = NonNullable<PageProps['anggota_list']>[number];
type AnggotaDetailRow = NonNullable<PageProps['anggota_detail_rows']>[number];
type MonthColumn = NonNullable<PageProps['month_columns']>[number];

type Props = {
    anggotaList: AnggotaListItem[];
    anggotaDetailRows: AnggotaDetailRow[];
    monthColumns: MonthColumn[];
    activeTab: 'detailed' | 'summary';
    setActiveTab: Dispatch<SetStateAction<'detailed' | 'summary'>>;
};

type FilterMode = 'month-year' | 'year';

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
        return '-';
    }

    return value.toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

export default function RekapanTabsCard({
    anggotaList,
    anggotaDetailRows,
    monthColumns,
    activeTab,
    setActiveTab,
}: Props) {
    const [filterMode, setFilterMode] = useState<FilterMode>('month-year');
    const [selectedMonthYear, setSelectedMonthYear] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    const parseDateParts = (value: string | null | undefined) => {
        if (!value) {
            return null;
        }

        const parts = value.split('-');
        if (parts.length !== 3) {
            return null;
        }

        const day = Number(parts[0]);
        const month = Number(parts[1]);
        const year = Number(parts[2]);

        if (
            Number.isNaN(day) ||
            Number.isNaN(month) ||
            Number.isNaN(year) ||
            month < 1 ||
            month > 12
        ) {
            return null;
        }

        return {
            year,
            month,
            monthYearKey: `${year}-${String(month).padStart(2, '0')}`,
        };
    };

    const filterSources = useMemo(
        () => [...anggotaList, ...anggotaDetailRows],
        [anggotaDetailRows, anggotaList],
    );

    const yearOptions = useMemo(() => {
        const years = new Set<number>();

        filterSources.forEach((row) => {
            const parsed = parseDateParts(row.tanggal_masuk);
            if (parsed) {
                years.add(parsed.year);
            }
        });

        return Array.from(years).sort((a, b) => b - a);
    }, [filterSources]);

    const monthYearOptions = useMemo(() => {
        const months = new Set<string>();

        filterSources.forEach((row) => {
            const parsed = parseDateParts(row.tanggal_masuk);
            if (parsed) {
                months.add(parsed.monthYearKey);
            }
        });

        return Array.from(months).sort((a, b) => b.localeCompare(a));
    }, [filterSources]);

    const formatMonthYearLabel = (value: string) => {
        const [yearRaw, monthRaw] = value.split('-');
        const year = Number(yearRaw);
        const month = Number(monthRaw);

        if (Number.isNaN(year) || Number.isNaN(month)) {
            return value;
        }

        return new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
    };

    const passesFilter = (tanggalMasuk: string | null | undefined) => {
        const parsed = parseDateParts(tanggalMasuk);
        if (!parsed) {
            return false;
        }

        if (filterMode === 'month-year') {
            if (!selectedMonthYear) {
                return true;
            }

            return parsed.monthYearKey === selectedMonthYear;
        }

        if (!selectedYear) {
            return true;
        }

        return String(parsed.year) === selectedYear;
    };

    const filteredAnggotaList = useMemo(
        () => anggotaList.filter((row) => passesFilter(row.tanggal_masuk)),
        [anggotaList, filterMode, selectedMonthYear, selectedYear],
    );

    const filteredAnggotaDetailRows = useMemo(
        () =>
            anggotaDetailRows.filter((row) => passesFilter(row.tanggal_masuk)),
        [anggotaDetailRows, filterMode, selectedMonthYear, selectedYear],
    );

    if (anggotaList.length === 0 && anggotaDetailRows.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('detailed')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'detailed'
                            ? 'border-b-2 border-emerald-600 text-emerald-700'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Rincian Per Anggota
                </button>
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'summary'
                            ? 'border-b-2 border-emerald-600 text-emerald-700'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Rekapan Keseluruhan
                </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
                <div className="min-w-52">
                    <FloatingSelect
                        label="Jenis Filter"
                        value={filterMode}
                        onChange={(event) => {
                            const mode = event.target.value as FilterMode;
                            setFilterMode(mode);
                            setSelectedMonthYear('');
                            setSelectedYear('');
                        }}
                        options={[
                            { value: 'month-year', label: 'Bulan & Tahun' },
                            { value: 'year', label: 'Tahun Saja' },
                        ]}
                        searchable={false}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                </div>

                {filterMode === 'month-year' && (
                    <div className="min-w-52">
                        <FloatingSelect
                            label="Bulan & Tahun Masuk"
                            value={selectedMonthYear}
                            onChange={(event) =>
                                setSelectedMonthYear(event.target.value)
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                            options={[
                                ...monthYearOptions.map((value) => ({
                                    value,
                                    label: formatMonthYearLabel(value),
                                })),
                            ]}
                            searchable={false}
                        />
                    </div>
                )}

                {filterMode === 'year' && (
                    <div className="min-w-52">
                        <FloatingSelect
                            label="Tahun Masuk"
                            value={selectedYear}
                            onChange={(event) =>
                                setSelectedYear(event.target.value)
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                            searchable={false}
                            options={[
                                ...yearOptions.map((year) => ({
                                    value: String(year),
                                    label: String(year),
                                })),
                            ]}
                        />
                    </div>
                )}
            </div>

            {activeTab === 'detailed' && (
                <RekapanDetailedTable
                    anggotaDetailRows={filteredAnggotaDetailRows}
                    monthColumns={monthColumns}
                    formatCurrency={formatCurrency}
                />
            )}

            {activeTab === 'summary' && (
                <RekapanSummaryTable
                    anggotaList={filteredAnggotaList}
                    formatCurrency={formatCurrency}
                />
            )}
        </div>
    );
}
