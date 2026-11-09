import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  SlidersHorizontal,
  Plus,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

export const CfoDashboard: React.FC<CfoDashboardProps> = ({ onNavigate }) => {
  const { liveMetrics } = useTelemetryStore();
  const [selectedDockTab, setSelectedDockTab] = useState<'all' | 'flagged' | 'unpaid'>('unpaid');
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(0);

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

  // Mock Finnova Master-Detail Queue Data representing live ledger invariants
  const queueItems = [
    {
      id: '# INV-NV-2026-9901',
      vendor: 'Nova Cyberware Solutions',
      avatarInitial: 'NC',
      daysAgo: 'In 2 days',
      status: 'Flagged',
      statusType: 'danger',
      amount: 96760.0,
      unitPrice: 16400.0,
      benchmark: 8000.0,
      variance: '105% Variance',
      tax: 14760.0,
      subtotal: 82000.0,
      riskScore: 78,
      auditor: 'Alexandra Chen, CFO',
      reason: 'POL-001 Price inflation surge: Unit price $16,400 deviates 105% against historical $8,000 baseline.',
    },
    {
      id: '# INV-CS-2026-8802',
      vendor: 'CloudScale Networks Inc.',
      avatarInitial: 'CS',
      daysAgo: 'In 4 days',
      status: 'Balanced',
      statusType: 'success',
      amount: 44840.0,
      unitPrice: 1200.0,
      benchmark: 1180.0,
      variance: '1.7% Normal',
      tax: 6840.0,
      subtotal: 38000.0,
      riskScore: 12,
      auditor: 'Marcus Vance, Auditor',
      reason: 'Compliant statutory 18% GST match. All line items within pre-authorized budget limits.',
    },
    {
      id: '# INV-QX-2026-7703',
      vendor: 'QuantumX Compute Hub',
      avatarInitial: 'QX',
      daysAgo: 'In 5 days',
      status: 'Flagged',
      statusType: 'warning',
      amount: 47980.0,
      unitPrice: 2200.0,
      benchmark: 1800.0,
      variance: '22% Surge',
      tax: 7320.0,
      subtotal: 40660.0,
      riskScore: 42,
      auditor: 'Sarah Jenkins, Head',
      reason: 'POL-001 GPU cluster rate exceeds quarterly procurement governance threshold.',
    },
    {
      id: '# INV-AT-2026-6604',
      vendor: 'Apex Telecom Gateway',
      avatarInitial: 'AT',
      daysAgo: 'In 16 days',
      status: 'Balanced',
      statusType: 'success',
      amount: 55230.0,
      unitPrice: 850.0,
      benchmark: 850.0,
      variance: '0.0% Exact',
      tax: 8425.0,
      subtotal: 46805.0,
      riskScore: 8,
      auditor: 'System Auto-Disburse',
      reason: 'Automated 3-way PO match confirmed. Disbursed directly to General Ledger 5010.',
    },
    {
      id: '# INV-SL-2026-5505',
      vendor: 'Sentinel Logistics Corp',
      avatarInitial: 'SL',
      daysAgo: 'In 19 days',
      status: 'Balanced',
      statusType: 'success',
      amount: 6880.0,
      unitPrice: 320.0,
      benchmark: 310.0,
      variance: '3.2% Normal',
      tax: 1049.0,
      subtotal: 5831.0,
      riskScore: 5,
      auditor: 'System Auto-Disburse',
      reason: 'Statutory GST validated. Invariant check passed.',
    },
  ];

  const activeEntry = queueItems[selectedEntryIndex] || queueItems[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header (Finnova Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => onNavigate('smart-procurement')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-700 hover:text-sky-600 hover:border-sky-200 transition-all cursor-pointer"
            title="Go to Invoices"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900 leading-tight">
              Executive Telemetry
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Autonomous FinOps, continuous treasury reconciliation & intercepted anomalies.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('smart-procurement')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-sky-600 hover:border-sky-200 transition-all cursor-pointer"
            title="Adjust Filter Parameters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('ledger-explorer')}
            className="h-10 px-5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Atomic Entry</span>
          </button>
        </div>
      </div>

      {/* 2. Row 1: 4-Column White Bento KPI Cards (h-[240px] finnova-bento-card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: High Risk Exposure / Overdue */}
        <div className="finnova-bento-card p-6 h-[240px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-500">
                High Risk Exposure
              </span>
              <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[28px] font-bold tracking-tight text-slate-900 tabular-nums mt-3 font-sans">
              <span className="text-slate-400 font-medium mr-1">$</span>
              {displayData.highRiskExposure.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-[11px] text-rose-500 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>↑ 12.5% vs historical</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between text-[11px]">
            <span className="text-rose-700 font-medium">{displayData.fraudAnomalyCount} Intercepted Anomaly</span>
            <span className="font-mono text-rose-600 bg-white px-2 py-0.5 rounded-md border border-rose-200">
              Escrow Locked
            </span>
          </div>
        </div>

        {/* KPI 2: Net Liquidity with Vertical Pill Bar Chart */}
        <div className="finnova-bento-card p-6 h-[240px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-500">
                Net Operating Liquidity
              </span>
              <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[28px] font-bold tracking-tight text-slate-900 tabular-nums mt-3 font-sans">
              <span className="text-slate-400 font-medium mr-1">$</span>
              {displayData.netLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-[11px] text-sky-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>↑ 6.2% from last month</span>
            </div>
          </div>

          {/* 7 Vertical Pill Bars for Jul-Dec */}
          <div className="flex items-end justify-between h-10 gap-1.5 pt-1">
            {[
              { label: 'Jul', height: 45 },
              { label: 'Aug', height: 58 },
              { label: 'Sep', height: 75 },
              { label: 'Oct', height: 60 },
              { label: 'Nov', height: 90 },
              { label: 'Dec', height: 100 },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-slate-100 rounded-full h-8 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-[#0284C7] to-[#00D4FF] rounded-full transition-all"
                    style={{ height: `${bar.height}%` }}
                  />
                </div>
                <span className="text-[9px] font-medium text-slate-400">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KPI 3: Reserve Runway with Smooth Bezier Mini Curve */}
        <div className="finnova-bento-card p-6 h-[240px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-500">
                Reserve Runway
              </span>
              <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[28px] font-bold tracking-tight text-slate-900 tabular-nums mt-3 font-sans">
              {displayData.runwayMonths} <span className="text-lg font-normal text-slate-400">months</span>
            </div>
            <div className="flex items-center text-[11px] text-emerald-600 font-semibold mt-1">
              <span>↓ ${(displayData.monthlyBurnRate / 1000).toFixed(0)}k/mo burn rate</span>
            </div>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="h-10 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData.cashflowTrends}>
                <defs>
                  <linearGradient id="finnovaSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="netBalance"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  fill="url(#finnovaSpark)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 4: Accounts Payable / Instant Settlement Rails */}
        <div className="finnova-bento-card p-6 h-[240px] flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-500">
                Accounts Payable (ACID)
              </span>
              <button
                onClick={() => onNavigate('ledger-explorer')}
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
                title="View Ledger"
              >
                <ArrowRight className="w-3.5 h-3.5 -rotate-45" />
              </button>
            </div>
            <div className="text-[28px] font-bold tracking-tight text-slate-900 tabular-nums mt-3 font-sans">
              <span className="text-slate-400 font-medium mr-1">$</span>
              {displayData.accountsPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* 3 Mini Payment/Ledger Engine Cards */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[9px] font-mono text-slate-400">•••• 4242</div>
              <div className="text-[10px] font-semibold text-slate-700 mt-0.5">PostgreSQL</div>
            </div>
            <div className="p-1.5 rounded-xl bg-[#0284C7] text-white text-center shadow-sm">
              <div className="text-[9px] font-mono text-sky-200">•••• 6789</div>
              <div className="text-[10px] font-semibold text-white mt-0.5">Redisson</div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[9px] font-mono text-slate-400">•••• 1234</div>
              <div className="text-[10px] font-semibold text-slate-700 mt-0.5">pgvector</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Row 2: Pill Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
        <div className="flex items-center space-x-2.5 w-full sm:w-auto overflow-x-auto">
          {/* Active filters badge */}
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-sm shrink-0">
            <span>Active filters</span>
            <span className="w-4 h-4 rounded-full bg-white text-slate-900 text-[10px] flex items-center justify-center font-bold">
              2
            </span>
          </div>

          {/* Filter Chips */}
          <button className="px-4 py-2 rounded-full bg-white border border-slate-200/80 text-xs font-medium text-slate-700 shadow-sm flex items-center space-x-2 hover:border-cyan-300 transition shrink-0">
            <span>All Vendors</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button className="px-4 py-2 rounded-full bg-white border border-slate-200/80 text-xs font-medium text-slate-700 shadow-sm flex items-center space-x-2 hover:border-cyan-300 transition shrink-0">
            <span>All Invariant Statuses</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button className="px-4 py-2 rounded-full bg-white border border-slate-200/80 text-xs font-medium text-slate-700 shadow-sm flex items-center space-x-2 hover:border-cyan-300 transition shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>October 2026</span>
          </button>

          <button className="px-4 py-2 rounded-full bg-white border border-slate-200/80 text-xs font-medium text-slate-700 shadow-sm flex items-center space-x-2 hover:border-cyan-300 transition shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>November 2026</span>
          </button>
        </div>

        {/* Right Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <input
            type="text"
            placeholder="Enter Invoice # or Account..."
            className="w-full bg-white border border-slate-200/80 rounded-full pl-4 pr-9 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
        </div>
      </div>

      {/* 4. Row 3: Signature Dark & Royal Indigo Master-Detail Split Dock */}
      <div className="finnova-dock-shell p-7 relative">
        {/* Top Center Floating Tab Switcher */}
        <div className="flex justify-center -mt-10 mb-4">
          <div className="bg-[#F4F5FA] p-1.5 rounded-full shadow-lg border border-slate-200/60 flex items-center gap-1.5">
            <button
              onClick={() => setSelectedDockTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedDockTab === 'all'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Entries
            </button>
            <button
              onClick={() => setSelectedDockTab('flagged')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                selectedDockTab === 'flagged'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Flagged</span>
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                1
              </span>
            </button>
            <button
              onClick={() => setSelectedDockTab('unpaid')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                selectedDockTab === 'unpaid'
                  ? 'bg-[#0284C7] text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Unpaid / Triage</span>
              <span className="w-4 h-4 rounded-full bg-white text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                5
              </span>
            </button>
          </div>
        </div>

        {/* Master-Detail Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (40% width): Interactive Queue List */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Live Intercepted Fraud & Invoice Queue
                </h3>
                <span className="text-[10px] font-mono text-zinc-400">STOMP 1.8ms</span>
              </div>

              <div className="space-y-2 mt-4">
                {queueItems.map((item, index) => {
                  const isSelected = selectedEntryIndex === index;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedEntryIndex(index)}
                      className={`p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0284C7] text-white shadow-lg shadow-sky-600/30 ring-1 ring-cyan-400/50'
                          : 'bg-[#222232] hover:bg-[#2A2A3D] text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-white text-[#0284C7]'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {item.avatarInitial}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs tracking-tight text-white truncate">
                            {item.id}
                          </div>
                          <div className={`text-[11px] truncate ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                            {item.daysAgo} • {item.vendor.split(' ')[0]}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-mono text-white tabular-nums">
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : item.statusType === 'danger'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Ledger Isolation</span>
              <span className="text-emerald-400">SERIALIZABLE Invariant</span>
            </div>
          </div>

          {/* Right Column (60% width): Signature Royal Indigo Inspector Card */}
          <div className="lg:col-span-7">
            <div className="finnova-indigo-gradient rounded-[26px] p-6 text-white h-full flex flex-col justify-between space-y-6">
              {/* Header: Invoice Details, Company, Auditor */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/20 pb-5">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-sky-200">
                    Invoice details
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl font-black font-mono tracking-tight text-white">
                      {activeEntry.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                      Risk: {activeEntry.riskScore}/100
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-sky-200">
                    Company
                  </div>
                  <div className="text-sm font-bold text-white mt-1 flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-sky-200" />
                    <span>{activeEntry.vendor}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-sky-200">
                    Auditor / CFO
                  </div>
                  <div className="text-xs font-semibold text-white mt-1">
                    {activeEntry.auditor}
                  </div>
                </div>
              </div>

              {/* Middle Row: 3 Translucent Glass Cards + 1 Dashed Action Card */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 space-y-1">
                  <div className="text-base font-bold font-mono text-white tabular-nums">
                    ${activeEntry.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-sky-200 leading-tight">
                    Unit Price ({activeEntry.variance})
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 space-y-1">
                  <div className="text-base font-bold font-mono text-white tabular-nums">
                    ${activeEntry.benchmark.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-sky-200 leading-tight">
                    pgvector Historical Benchmark
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 space-y-1">
                  <div className="text-base font-bold font-mono text-white tabular-nums">
                    ${activeEntry.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-sky-200 leading-tight">
                    GST Statutory Tax (18%)
                  </div>
                </div>

                <div
                  onClick={() => onNavigate('smart-procurement')}
                  className="border-2 border-dashed border-white/30 rounded-2xl p-3.5 flex flex-col items-center justify-center hover:bg-white/10 transition cursor-pointer text-center"
                >
                  <Plus className="w-4 h-4 text-white mb-0.5" />
                  <span className="text-[10px] font-bold text-white">Override Note</span>
                </div>
              </div>

              {/* Rationale Notice */}
              <div className="p-3.5 rounded-xl bg-black/25 border border-white/15 text-xs font-sans text-indigo-100 leading-relaxed">
                <span className="font-bold text-white mr-1.5">Forensic Reason:</span>
                {activeEntry.reason}
              </div>

              {/* Footer: Sub Total, Total, Primary CTA */}
              <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-6 text-xs font-mono">
                  <div>
                    <span className="text-sky-200 text-[10px] uppercase block">Sub Total</span>
                    <span className="text-white font-bold text-sm">
                      ${activeEntry.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-sky-200 text-[10px] uppercase block">Total Exposure</span>
                    <span className="text-white font-black text-base">
                      ${activeEntry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('smart-procurement')}
                  className="px-6 py-3 rounded-full bg-white text-slate-900 font-bold text-xs shadow-lg hover:bg-sky-50 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  <span>Approve & Post Ledger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Interactive Monte Carlo Simulation Sandbox & Autonomous Rebalancer */}
      <div className="space-y-4 pt-2">
        <MonteCarloSandbox
          currentLiquidity={displayData.netLiquidity}
          currentBurnRate={displayData.monthlyBurnRate}
        />
        <AutonomousRebalancer />
      </div>
    </div>
  );
};
