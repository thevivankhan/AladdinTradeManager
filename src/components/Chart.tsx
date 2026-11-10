import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ChartProps {
  data: any[];
  mode?: string;
  currencySymbol?: string;
}

export const Chart: React.FC<ChartProps> = ({ data, mode = 'daily', currencySymbol = '$' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No growth data available
      </div>
    );
  }

  // Ensure balance is always populated regardless of whether source uses capital, balance, or equity
  const chartData = useMemo(() => {
    return data.map((item) => {
      const val = Number(item.capital ?? item.balance ?? item.equity ?? 0);
      return {
        ...item,
        balance: isNaN(val) ? 0 : val,
        capital: isNaN(val) ? 0 : val,
      };
    });
  }, [data]);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey={mode === 'daily' ? 'day' : 'step'}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(val) => {
              const num = Number(val);
              if (isNaN(num)) return '';
              if (num >= 1_000_000) return `${currencySymbol}${(num / 1_000_000).toFixed(1)}M`;
              if (num >= 1_000) return `${currencySymbol}${(num / 1_000).toFixed(1)}k`;
              return `${currencySymbol}${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
            formatter={(value: any) => [
              `${currencySymbol}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              'Balance',
            ]}
            labelFormatter={(label: any) => `${mode === 'daily' ? 'Day' : 'Step'} ${label}`}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#balanceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
