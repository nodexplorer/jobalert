import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
    date: string | number;
    jobs: number;
}

interface SimpleBarChartProps {
    data: ChartDataPoint[];
}

export function SimpleBarChart({ data }: SimpleBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar dataKey="jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
