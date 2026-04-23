import { ResponsiveLine } from '@nivo/line';

interface CashFlowData {
    id: string;
    color: string;
    data: {
        x: string;
        y: number;
    }[];
}

export default function CashChart({ data }: { data: CashFlowData[] }) {
    const hasData = data.some((series) =>
        series.data.some((point) => Number(point.y) > 0),
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    if (!hasData) {
        return (
            <div className="flex h-75 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500">
                Belum ada data kas untuk periode ini
            </div>
        );
    }

    return (
        <div className="h-75 w-full">
            <ResponsiveLine
                data={data}
                margin={{ top: 20, right: 110, bottom: 50, left: 80 }}
                xScale={{ type: 'point' }}
                yScale={{
                    type: 'linear',
                    min: 'auto',
                    max: 'auto',
                    stacked: false,
                    reverse: false,
                }}
                yFormat=" >-.2f"
                curve="catmullRom"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: data[0]?.data?.length > 12 ? -45 : 0,
                    legend: '',
                    legendOffset: 36,
                    legendPosition: 'middle',
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Total Kas',
                    legendOffset: -70,
                    legendPosition: 'middle',
                    format: (value) => {
                        if (value >= 1000000)
                            return `${(Number(value) / 1000000).toFixed(1)}jt`;
                        if (value >= 1000)
                            return `${(Number(value) / 1000).toFixed(0)}rb`;
                        return value;
                    },
                }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                colors={{ datum: 'color' }}
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                    itemOpacity: 1,
                                },
                            },
                        ],
                    },
                ]}
                tooltip={({ point }) => (
                    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black/5">
                        <div className="flex items-center gap-2">
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: point.seriesColor }}
                            ></div>
                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                {point.seriesId}
                            </p>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            {point.data.xFormatted}
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                            {formatCurrency(Number(point.data.y))}
                        </p>
                    </div>
                )}
            />
        </div>
    );
}
