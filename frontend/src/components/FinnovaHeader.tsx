import React, { useState } from 'react';
import {
  Bell,
  ExternalLink,
  ChevronDown,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTelemetryStore } from '../store/telemetryStore';
import { UserRole } from '../types';

interface FinnovaHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCommandPalette?: () => void;
}

export const FinnovaHeader: React.FC<FinnovaHeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCommandPalette,
}) => {
  const { user, switchDemoRole } = useAuthStore();
  const { isConnected, unreadAlertCount } = useTelemetryStore();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navItems = [
    { id: 'cfo-dashboard', label: 'Overview' },
    { id: 'ledger-explorer', label: 'Ledger' },
    { id: 'smart-procurement', label: 'Invoices' },
    { id: 'finsentinel-copilot', label: 'Copilot' },
  ];

  const roles: Array<{ id: UserRole; label: string; desc: string }> = [
    { id: 'ROLE_CFO_ADMIN', label: 'CFO Admin', desc: 'Alexandra Chen (Full Ledger & Approvals)' },
    { id: 'ROLE_FINANCE_AUDITOR', label: 'Lead Auditor', desc: 'Marcus Vance (Trial Balance & Forensic)' },
    { id: 'ROLE_PROCUREMENT_MANAGER', label: 'Procurement Head', desc: 'Sarah Jenkins (Invoices & Benchmarks)' },
    { id: 'ROLE_VENDOR', label: 'Vendor Rep', desc: 'Self-Service Upload & Tracking' },
  ];

  return (
    <header className="px-6 lg:px-10 py-5 flex items-center justify-between select-none">
      {/* 1. Left: FinSentinel AI Purple Ribbon Logo & Brand */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5847F6] to-[#7B68EE] flex items-center justify-center p-2 shadow-md shadow-indigo-500/25">
          <img src="/icon.png" alt="FinSentinel AI" className="w-full h-full object-contain filter brightness-200" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">FIN-SENTINEL</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-mono">
              AI
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium tracking-tight">
            Smart FinOps, Autonomous Ledger
          </div>
        </div>
      </div>

      {/* 2. Center: Signature Dark Floating Pill Navigation */}
      <nav className="bg-[#161622] rounded-full p-1.5 flex items-center gap-1 shadow-lg shadow-black/10">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#5847F6] text-white shadow-[0_4px_16px_rgba(88,71,246,0.5)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {isActive && <span className="text-[10px] opacity-80">+</span>}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. Right: 42px Circular Action Controls & Role Avatar */}
      <div className="flex items-center space-x-2.5">
        {/* Search / Command Center */}
        <button
          onClick={onOpenCommandPalette}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
          title="Command Palette (⌘K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* STOMP Telemetry Live Beacon */}
        <div
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center relative cursor-pointer group"
          title={isConnected ? 'STOMP Telemetry: Connected (1.8ms)' : 'STOMP Telemetry: Disconnected'}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
        </div>

        {/* OpenAPI Link */}
        <a
          href="/swagger-ui.html"
          target="_blank"
          rel="noreferrer"
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all"
          title="OpenAPI 3.0 Documentation"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Notifications */}
        <button
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* Role Switcher & User Avatar */}
        <div className="relative pl-1">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 bg-white border border-slate-200/80 rounded-full p-1 pr-3 shadow-sm hover:border-indigo-200 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.fullName?.split(',')[0] || 'Alexandra'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {user?.role?.replace('ROLE_', '') || 'CFO_ADMIN'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role Dropdown */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Simulate Role Identity
              </div>
              <div className="space-y-1 mt-1">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      switchDemoRole(r.id);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                      user?.role === r.id
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{r.label}</div>
                      <div className="text-[10px] text-slate-400">{r.desc}</div>
                    </div>
                    {user?.role === r.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
