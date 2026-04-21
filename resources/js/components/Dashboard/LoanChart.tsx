import { ResponsiveBar } from '@nivo/bar';

interface LoanData {
    month: string;
    total: number;
}

export default function LoanChart({ data }: { data: LoanData[] }) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="h-[300px] w-full">
            <ResponsiveBar
                data={data}
                keys={['total']}
                indexBy="month"
                margin={{ top: 20, right: 30, bottom: 50, left: 80 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'nivo' }}
                borderRadius={4}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Bulan',
                    legendPosition: 'middle',
                    legendOffset: 40,
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Total Pinjaman',
                    legendPosition: 'middle',
                    legendOffset: -70,
                    format: (value) => {
                        if (value >= 1000000) return `${(Number(value) / 1000000).toFixed(1)}jt`;
                        if (value >= 1000) return `${(Number(value) / 1000).toFixed(0)}rb`;
                        return value;
                    },
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                label={ (d) => `${(Number(d.value) / 1000000).toFixed(1)}jt` }
                tooltip={({ value, indexValue }) => (
                    <div className="rounded border border-slate-200 bg-white p-2 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500">{indexValue}</p>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(Number(value))}</p>
                    </div>
                )}
                role="application"
                ariaLabel="Grafik Pinjaman Bulanan"
            />
        </div>
    );
}
