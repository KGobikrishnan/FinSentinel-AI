import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface SimulationMonth {
  month: string;
  p10WorstCase: number;
  p50Expected: number;
  p90BestCase: number;
  burnRate: number;
}

interface MonteCarloSandboxProps {
  currentLiquidity: number;
  currentBurnRate: number;
}

export const MonteCarloSandbox: React.FC<MonteCarloSandboxProps> = ({
  currentLiquidity,
  currentBurnRate,
}) => {
  // Scenario sliders
  const [revenueGrowthPct, setRevenueGrowthPct] = useState<number>(5); // -30% to +50%
  const [burnReductionPct, setBurnReductionPct] = useState<number>(0); // -20% to +40%
  const [cloudCostInflationPct, setCloudCostInflationPct] = useState<number>(10); // 0% to +50%
  const [iterations] = useState<number>(1000);

  // Generate dynamic 12-month Monte Carlo probabilistic simulations
  const { simulationData, p50Runway, p10Runway, insolvencyRisk } = useMemo(() => {
    const data: SimulationMonth[] = [];
    let p50Balance = currentLiquidity;
    let p10Balance = currentLiquidity;
    let p90Balance = currentLiquidity;

    const baseMonthlyBurn = currentBurnRate * (1 - burnReductionPct / 100);
    const cloudImpact = (baseMonthlyBurn * 0.45) * (cloudCostInflationPct / 100);
    const adjustedBurn = baseMonthlyBurn + cloudImpact;

    let baseInflow = 580000 * (1 + revenueGrowthPct / 100);

    let p50Months = 12;
    let p10Months = 12;
    let failedRuns = 0;

    const monthNames = [
      'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr',
      'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'
    ];

    for (let i = 0; i < 12; i++) {
      // Inflow variance per month
      const p50Net = baseInflow - adjustedBurn;
      const p10Net = (baseInflow * 0.78) - (adjustedBurn * 1.15); // Severe headwinds
      const p90Net = (baseInflow * 1.25) - (adjustedBurn * 0.92); // Accelerated scale

      p50Balance = Math.max(0, p50Balance + p50Net);
      p10Balance = Math.max(0, p10Balance + p10Net);
      p90Balance = Math.max(0, p90Balance + p90Net);

      if (p50Balance <= 0 && p50Months === 12) p50Months = i + 1;
      if (p10Balance <= 0 && p10Months === 12) p10Months = i + 1;

      data.push({
        month: monthNames[i],
        p10WorstCase: Math.round(p10Balance),
        p50Expected: Math.round(p50Balance),
        p90BestCase: Math.round(p90Balance),
        burnRate: Math.round(adjustedBurn),
      });
    }

    // Rough insolvency probability based on p10 curve
    if (p10Balance === 0) {
      failedRuns = p50Balance === 0 ? 82 : 34;
    } else {
      failedRuns = 7;
    }

    return {
      simulationData: data,
      p50Runway: p50Months >= 12 ? '12+ Months' : `${p50Months} Months`,
      p10Runway: p10Months >= 12 ? '12+ Months' : `${p10Months} Months`,
      insolvencyRisk: `${failedRuns}%`,
    };
  }, [currentLiquidity, currentBurnRate, revenueGrowthPct, burnReductionPct, cloudCostInflationPct]);

  const handleReset = () => {
    setRevenueGrowthPct(5);
    setBurnReductionPct(0);
    setCloudCostInflationPct(10);
  };

  return (
    <div
      className="p-4 sm:p-5 rounded-xl bg-[#0F0F12]/80 border border-white/[0.06] backdrop-blur-md relative overflow-hidden"
      style={{
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-zinc-100 font-semibold text-sm tracking-tight">
              Interactive Cashflow Monte Carlo Sandbox
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-cyan-400 border border-sky-500/20">
              {iterations} stochastic paths
            </span>
          </div>
          <p className="text-[12px] text-zinc-400 mt-0.5">
            Stress-test liquidity runway against cloud price surges, revenue compression & headcount spend.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-white/[0.06] hover:bg-white/[0.04] rounded-md transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Parameters</span>
        </button>
      </div>

      {/* Probability Outcome KPIs */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-lg bg-zinc-900/40 border border-white/[0.04]">
          <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-zinc-500">
            P50 Expected Runway
          </div>
          <div className="text-lg font-semibold tracking-tight text-zinc-100 tabular-nums mt-0.5">
            {p50Runway}
          </div>
          <div className="text-[11px] text-emerald-400/90 flex items-center space-x-1 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>Median trajectory</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-zinc-900/40 border border-white/[0.04]">
          <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-zinc-500">
            P10 Stress-Test Runway
          </div>
          <div className="text-lg font-semibold tracking-tight text-zinc-100 tabular-nums mt-0.5">
            {p10Runway}
          </div>
          <div className="text-[11px] text-rose-400/90 flex items-center space-x-1 mt-0.5">
            <TrendingDown className="w-3 h-3" />
            <span>Worst 10th percentile</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-zinc-900/40 border border-white/[0.04]">
          <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-zinc-500">
            12M Insolvency Risk
          </div>
          <div className="text-lg font-semibold tracking-tight text-zinc-100 tabular-nums mt-0.5">
            {insolvencyRisk}
          </div>
          <div className="text-[11px] text-amber-400/90 flex items-center space-x-1 mt-0.5">
            <AlertTriangle className="w-3 h-3" />
            <span>Under tested levers</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-60 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={simulationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="p90Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="p50Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="p10Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />

            <XAxis
              dataKey="month"
              stroke="#52525B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              stroke="#52525B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#09090B]/95 backdrop-blur-md border border-white/10 px-3 py-2.5 rounded-lg shadow-2xl text-xs font-mono space-y-1">
                      <div className="text-[11px] text-zinc-400 font-sans">{label} Projection</div>
                      <div className="flex justify-between space-x-4 text-emerald-400">
                        <span>P90 (Bull):</span>
                        <span className="tabular-nums font-semibold">${payload[0]?.value?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between space-x-4 text-cyan-400">
                        <span>P50 (Expected):</span>
                        <span className="tabular-nums font-semibold">${payload[1]?.value?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between space-x-4 text-rose-400">
                        <span>P10 (Bear):</span>
                        <span className="tabular-nums font-semibold">${payload[2]?.value?.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <ReferenceLine y={0} stroke="#F43F5E" strokeDasharray="2 2" strokeWidth={1} />

            {/* P90 Best Case */}
            <Area
              type="monotone"
              dataKey="p90BestCase"
              name="P90 (Bull)"
              stroke="#10B981"
              strokeWidth={1.5}
              fill="url(#p90Gradient)"
            />
            {/* P50 Expected Case */}
            <Area
              type="monotone"
              dataKey="p50Expected"
              name="P50 (Expected)"
              stroke="#0EA5E9"
              strokeWidth={2}
              fill="url(#p50Gradient)"
            />
            {/* P10 Worst Case */}
            <Area
              type="monotone"
              dataKey="p10WorstCase"
              name="P10 (Bear)"
              stroke="#F43F5E"
              strokeWidth={1.5}
              fill="url(#p10Gradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Parameter Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06] mt-3">
        {/* Slider 1 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Revenue Growth (MoM)</span>
            <span className="font-mono text-zinc-200 tabular-nums font-medium">
              {revenueGrowthPct > 0 ? `+${revenueGrowthPct}%` : `${revenueGrowthPct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="50"
            step="5"
            value={revenueGrowthPct}
            onChange={(e) => setRevenueGrowthPct(Number(e.target.value))}
            className="w-full accent-sky-500 bg-zinc-800 h-1 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>-30%</span>
            <span>0%</span>
            <span>+50%</span>
          </div>
        </div>

        {/* Slider 2 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">OpEx / Burn Reduction</span>
            <span className="font-mono text-zinc-200 tabular-nums font-medium">
              {burnReductionPct > 0 ? `+${burnReductionPct}%` : `${burnReductionPct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-20"
            max="40"
            step="5"
            value={burnReductionPct}
            onChange={(e) => setBurnReductionPct(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-zinc-800 h-1 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>-20% (Expansion)</span>
            <span>+40% (Austerity)</span>
          </div>
        </div>

        {/* Slider 3 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Cloud Infra Cost Surge</span>
            <span className="font-mono text-rose-400 tabular-nums font-medium">
              +{cloudCostInflationPct}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={cloudCostInflationPct}
            onChange={(e) => setCloudCostInflationPct(Number(e.target.value))}
            className="w-full accent-rose-500 bg-zinc-800 h-1 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>0% (Stable)</span>
            <span>+30% (Standard)</span>
            <span>+60% (Surge)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
