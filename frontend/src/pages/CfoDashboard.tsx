import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  BookOpen,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { apiClient } from '../api/client';
import { CfoMetrics } from '../types';
import { useTelemetryStore } from '../store/telemetryStore';
import { MonteCarloSandbox } from '../components/MonteCarloSandbox';
import { AutonomousRebalancer } from '../components/AutonomousRebalancer';

interface CfoDashboardProps {
  onNavigate: (tab: string) => void;
}

const FALLBACK_METRICS: CfoMetrics = {
  netLiquidity: 1250000.0,
  accountsReceivable: 450000.0,
  accountsPayable: 180000.0,
  totalInvoiced: 485000.0,
  highRiskExposure: 96760.0,
  fraudAnomalyCount: 1,
  monthlyBurnRate: 360000.0,
  runwayMonths: 3.5,
  equityCapital: 1520000.0,
  cashflowTrends: [
    { month: 'Aug', inflow: 520000, outflow: 310000, netBalance: 1050000 },
    { month: 'Sep', inflow: 580000, outflow: 340000, netBalance: 1180000 },
    { month: 'Oct', inflow: 640000, outflow: 360000, netBalance: 1220000 },
    { month: 'Nov (Est)', inflow: 680000, outflow: 360000, netBalance: 1250000 },
  ],
  spendBreakdown: [
    { category: 'Cloud Infrastructure', amount: 245000, percentage: 58 },
    { category: 'Hardware Procurement', amount: 115000, percentage: 28 },
    { category: 'Statutory GST Tax', amount: 38000, percentage: 9 },
    { category: 'Operations & Facilities', amount: 21000, percentage: 5 },
  ],
  lastUpdated: new Date().toISOString(),
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#09090B]/95 backdrop-blur-md border border-white/10 px-3 py-2.5 rounded-lg shadow-2xl text-xs font-mono space-y-1.5">
        <div className="text-[11px] text-zinc-400 font-medium">{label} Period</div>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between space-x-4 text-zinc-200">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-zinc-400 font-sans">{entry.name}:</span>
            </span>
            <span className="font-semibold tabular-nums text-zinc-100">
              ${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const CfoDashboard: React.FC<CfoDashboardProps> = ({ onNavigate }) => {
  const { alerts, liveMetrics } = useTelemetryStore();

  const { data: metrics } = useQuery<CfoMetrics>({
    queryKey: ['cfo-metrics'],
    queryFn: async () => {
      const res = await apiClient.get<CfoMetrics>('/telemetry/cfo-metrics');
      return res.data;
    },
    refetchInterval: 15000,
    initialData: liveMetrics || FALLBACK_METRICS,
  });

  const displayData = liveMetrics || metrics || FALLBACK_METRICS;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Surgical Apple/Stripe-Grade KPI Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Net Liquidity */}
        <div className="hairline-card hairline-card-hover p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em]">
              Net Liquidity
            </span>
            <Wallet className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums">
            ${displayData.netLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center text-[11px] text-zinc-400 font-medium">
            <span className="text-emerald-400 flex items-center mr-1.5 font-mono tabular-nums">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +6.2%
            </span>
            <span>vs prior 30d</span>
          </div>
        </div>

        {/* KPI 2: Accounts Payable */}
        <div className="hairline-card hairline-card-hover p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em]">
              Accounts Payable
            </span>
            <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums">
            ${displayData.accountsPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center text-[11px] text-zinc-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            <span>ACID Balanced</span>
          </div>
        </div>

        {/* KPI 3: High Risk Exposure */}
        <div className="hairline-card hairline-card-hover p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em]">
              High Risk Exposure
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-rose-400 tabular-nums">
            ${displayData.highRiskExposure.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center text-[11px] text-zinc-400">
            <span className="text-rose-400 font-mono mr-1.5 tabular-nums">
              {displayData.fraudAnomalyCount} flagged
            </span>
            <span>intercepted</span>
          </div>
        </div>

        {/* KPI 4: Monthly Runway */}
        <div className="hairline-card hairline-card-hover p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em]">
              Reserve Runway
            </span>
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums">
            {displayData.runwayMonths} <span className="text-sm font-normal text-zinc-400">mo</span>
          </div>
          <div className="flex items-center text-[11px] text-zinc-400 font-mono">
            <span className="text-zinc-300 mr-1 tabular-nums">
              ${(displayData.monthlyBurnRate / 1000).toFixed(0)}k/mo
            </span>
            <span className="text-zinc-500">burn rate</span>
          </div>
        </div>
      </div>

      {/* 2. Visualizations Grid: Cashflow Velocity (Area) + Linear-style Allocation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Cashflow Velocity Area Chart (2 Cols) */}
        <div className="lg:col-span-2 hairline-card p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
                Cashflow Velocity & Reserve Trajectory
              </div>
              <div className="text-sm font-semibold text-zinc-100 tracking-tight mt-0.5">
                General Ledger Net Asset Reserves
              </div>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center space-x-1.5 text-zinc-400">
                <span className="w-2 h-0.5 bg-emerald-500" />
                <span>Net Reserve</span>
              </span>
              <span className="flex items-center space-x-1.5 text-zinc-500">
                <span className="w-2 h-0.5 bg-zinc-400" />
                <span>Revenue Inflow</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData.cashflowTrends} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="linearNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="linearInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FAFAFA" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#FAFAFA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  fontFamily="JetBrains Mono"
                />
                <YAxis
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  fontFamily="JetBrains Mono"
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="netBalance"
                  stroke="#10B981"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#linearNet)"
                  name="Net Treasury"
                />
                <Area
                  type="monotone"
                  dataKey="inflow"
                  stroke="#A1A1AA"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#linearInflow)"
                  name="Inflow"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Linear-Style Horizontal Segmented Allocation (1 Col) */}
        <div className="hairline-card p-5 rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
              Procurement Allocation
            </div>
            <div className="text-sm font-semibold text-zinc-100 tracking-tight mt-0.5">
              Operating Spend Distribution
            </div>

            {/* Segmented Bar */}
            <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden flex mt-4 border border-white/[0.06]">
              {displayData.spendBreakdown.map((item, idx) => {
                const shades = ['bg-zinc-200', 'bg-zinc-400', 'bg-zinc-600', 'bg-zinc-700'];
                return (
                  <div
                    key={item.category}
                    style={{ width: `${item.percentage}%` }}
                    className={`${shades[idx % shades.length]} h-full transition-all`}
                    title={`${item.category}: ${item.percentage}%`}
                  />
                );
              })}
            </div>

            {/* High-Density Allocation Table */}
            <div className="mt-4 divide-y divide-white/[0.04] text-xs">
              {displayData.spendBreakdown.map((item, idx) => {
                const indicators = ['bg-zinc-200', 'bg-zinc-400', 'bg-zinc-600', 'bg-zinc-700'];
                return (
                  <div key={item.category} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${indicators[idx % indicators.length]} shrink-0`} />
                      <span className="text-zinc-300 truncate text-[11px]">{item.category}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-right shrink-0 font-mono">
                      <span className="text-zinc-100 font-medium tabular-nums text-[11px]">
                        ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-zinc-500 text-[10px] tabular-nums w-7">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Aggregated Burn</span>
            <span className="text-zinc-300 font-medium tabular-nums">
              ${displayData.monthlyBurnRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Cashflow Monte Carlo Simulation Sandbox */}
      <MonteCarloSandbox
        currentLiquidity={displayData.netLiquidity}
        currentBurnRate={displayData.monthlyBurnRate}
      />

      {/* 4. Autonomous Treasury Rebalancer & Liquidity Optimizer */}
      <AutonomousRebalancer />

      {/* 5. Bloomberg / Stripe-Style High-Density Data Table for Anomaly Queue */}
      <div className="hairline-card rounded-xl overflow-hidden">
        <div className="h-11 px-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
              Live Intercepted Fraud Queue
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              STOMP Telemetry Feed
            </span>
          </div>

          <button
            onClick={() => onNavigate('smart-procurement')}
            className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/[0.02] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/[0.04]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Timestamp</th>
                <th className="py-2.5 px-4 font-medium">Invoice ID</th>
                <th className="py-2.5 px-4 font-medium font-sans">Vendor Name</th>
                <th className="py-2.5 px-4 font-medium font-sans">Forensic Reason</th>
                <th className="py-2.5 px-4 text-center font-medium">Risk Score</th>
                <th className="py-2.5 px-4 text-right font-medium">Amount</th>
                <th className="py-2.5 px-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-[11px]">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 inline mr-1.5 opacity-80" />
                    Zero active anomalies in the live forensic stream.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.invoiceId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-zinc-500 tabular-nums">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-zinc-200 font-semibold">
                      {alert.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-sans text-zinc-300">
                      {alert.vendorName}
                    </td>
                    <td className="py-3 px-4 font-sans text-zinc-400 max-w-xs truncate">
                      {alert.anomalyReasons?.[0] || 'Unverified invoice payload'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] tabular-nums font-semibold ${
                          alert.fraudRiskScore >= 75
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {alert.fraudRiskScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-zinc-100 tabular-nums">
                      ${alert.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate('smart-procurement')}
                        className="h-7 px-2.5 rounded text-[11px] font-sans font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] transition-all cursor-pointer shadow-specular inline-flex items-center space-x-1"
                      >
                        <span>Audit</span>
                        <span className="text-[9px] font-mono text-zinc-500">⌘↵</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
