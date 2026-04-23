import { Dispatch, SetStateAction } from 'react';
import RekapanDetailedTable from './RekapanDetailedTable';
import RekapanSummaryTable from './RekapanSummaryTable';
import { PageProps } from '../type';

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
                    Table Lengkap (Per Bulan)
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

            {activeTab === 'detailed' && (
                <RekapanDetailedTable
                    anggotaDetailRows={anggotaDetailRows}
                    monthColumns={monthColumns}
                    formatCurrency={formatCurrency}
                />
            )}

            {activeTab === 'summary' && (
                <RekapanSummaryTable
                    anggotaList={anggotaList}
                    formatCurrency={formatCurrency}
                />
            )}
        </div>
    );
}
