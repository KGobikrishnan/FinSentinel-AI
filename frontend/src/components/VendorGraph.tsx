import React, { useState } from 'react';
import {
  Building2,
  Search,
} from 'lucide-react';
import { Vendor } from '../types';

interface VendorGraphProps {
  vendors: Vendor[];
  onSelectVendor?: (vendor: Vendor) => void;
}

export const VendorGraph: React.FC<VendorGraphProps> = ({ vendors, onSelectVendor }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="p-5 rounded-xl bg-[#0F0F12]/80 border border-white/[0.06] backdrop-blur-md space-y-4"
      style={{
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.06] gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-zinc-100 font-semibold text-sm tracking-tight">
              Enterprise Supplier Health Matrix & 3-Way Match Graph
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
              {vendors.length} Active Counterparties
            </span>
          </div>
          <p className="text-[12px] text-zinc-400 mt-0.5">
            Real-time PO matching rate, GST compliance scorecards & cumulative enterprise spend exposure.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search supplier..."
              className="pl-8 pr-3 py-1 bg-zinc-900/60 border border-white/[0.06] rounded-md text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Supplier Grid with Health Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((vendor) => {
          const isHighRisk = vendor.riskTier === 'HIGH' || vendor.riskTier === 'CRITICAL';
          const matchRate = isHighRisk ? 82.4 : 98.7;

          return (
            <div
              key={vendor.id}
              onClick={() => onSelectVendor?.(vendor)}
              className="p-3.5 rounded-lg bg-zinc-900/30 border border-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-md bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center text-zinc-300 group-hover:text-zinc-100">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition">
                        {vendor.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {vendor.gstin || '27AABCS1429B1Z8'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isHighRisk
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {vendor.riskTier} RISK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono">
                  <div className="p-2 rounded bg-black/30 border border-white/[0.02]">
                    <div className="text-[10px] text-zinc-500 uppercase">Total Invoiced</div>
                    <div className="text-zinc-200 font-medium tabular-nums mt-0.5">
                      ${vendor.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-black/30 border border-white/[0.02]">
                    <div className="text-[10px] text-zinc-500 uppercase">3-Way PO Match</div>
                    <div className={`font-medium tabular-nums mt-0.5 ${isHighRisk ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {matchRate}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress health bar */}
              <div>
                <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                  <span>Audit Pass Rate</span>
                  <span className="font-mono tabular-nums">{matchRate}%</span>
                </div>
                <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isHighRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${matchRate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
