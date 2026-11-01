import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTelemetryStore } from '../store/telemetryStore';
import { UserRole } from '../types';

interface HeaderProps {
  activeTab: string;
  onToggleAlertTicker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onToggleAlertTicker }) => {
  const { user, switchDemoRole } = useAuthStore();
  const { isConnected, unreadAlertCount } = useTelemetryStore();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const breadcrumbs: Record<string, { module: string; section: string }> = {
    'cfo-dashboard': { module: 'FinOps', section: 'Executive Telemetry' },
    'ledger-explorer': { module: 'Ledger Engine', section: 'Double-Entry Invariants' },
    'smart-procurement': { module: 'Procurement', section: 'AI Invoice Triage' },
    'finsentinel-copilot': { module: 'Agentic Copilot', section: 'Forensic Synthesis' },
  };

  const current = breadcrumbs[activeTab] || breadcrumbs['cfo-dashboard'];

  const roles: Array<{ id: UserRole; label: string; desc: string }> = [
    { id: 'ROLE_CFO_ADMIN', label: 'CFO Admin', desc: 'Full Ledger, Approvals & Dual-Auth' },
    { id: 'ROLE_FINANCE_AUDITOR', label: 'Lead Auditor', desc: 'Trial Balance & Anomaly Review' },
    { id: 'ROLE_PROCUREMENT_MANAGER', label: 'Procurement Head', desc: 'Invoices & Vendor Benchmarks' },
    { id: 'ROLE_VENDOR', label: 'Vendor Representative', desc: 'Invoice Upload & Tracking' },
  ];

  return (
    <header className="h-14 bg-[#09090B]/90 backdrop-blur-md border-b border-white/[0.06] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Breadcrumb Navigation with Logo (Linear / macOS style) */}
      <div className="flex items-center space-x-3 text-[13px]">
        <div className="flex items-center space-x-2">
          <img src="/icon.png" alt="FinSentinel AI Logo" className="w-5 h-5 object-contain" />
          <span className="font-semibold text-zinc-200 tracking-tight">FinSentinel AI</span>
        </div>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400 font-medium">{current.module}</span>
        <span className="text-zinc-600">/</span>
        <span className="text-zinc-100 font-semibold tracking-tight">{current.section}</span>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-2.5">
        {/* STOMP Live Indicator */}
        <div
          className="flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-zinc-400 border border-white/[0.06] bg-white/[0.02]"
          title={isConnected ? 'STOMP WebSocket Live Connection' : 'STOMP Disconnected'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-subtle-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-zinc-300">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {/* OpenAPI Link */}
        <a
          href="/swagger-ui.html"
          target="_blank"
          rel="noreferrer"
          className="h-7 px-2.5 rounded-md flex items-center space-x-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
        >
          <span>API</span>
          <ExternalLink className="w-3 h-3 text-zinc-500" />
        </a>

        {/* Anomaly Notification Toggle */}
        <button
          onClick={onToggleAlertTicker}
          className="relative h-7 w-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer"
          title="Toggle Forensic Queue"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#09090B]" />
          )}
        </button>

        {/* Role Switcher Popover */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="h-7 px-2.5 rounded-md flex items-center space-x-1.5 text-xs text-zinc-300 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all cursor-pointer shadow-specular"
          >
            <span className="font-mono text-[11px] text-zinc-400">Role:</span>
            <span className="font-medium text-zinc-100">
              {user?.role ? user.role.replace('ROLE_', '').replace('_', ' ') : 'Select'}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-500 ml-0.5" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-[#0F0F12] border border-white/[0.1] rounded-lg shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-500 border-b border-white/[0.06] mb-1">
                Simulate Role
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    switchDemoRole(r.id);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                    user?.role === r.id
                      ? 'bg-white/[0.08] text-zinc-50 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div>
                    <div>{r.label}</div>
                    <div className="text-[10px] text-zinc-500 font-normal">{r.desc}</div>
                  </div>
                  {user?.role === r.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
