import React from 'react';
import {
  LayoutDashboard,
  BookOpenCheck,
  FileSpreadsheet,
  Bot,
  Shield,
} from 'lucide-react';
import { useTelemetryStore } from '../store/telemetryStore';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { unreadAlertCount } = useTelemetryStore();
  const { user } = useAuthStore();

  const navItems = [
    {
      id: 'cfo-dashboard',
      label: 'Executive Telemetry',
      icon: LayoutDashboard,
      counter: null,
      dotColor: null,
    },
    {
      id: 'ledger-explorer',
      label: 'General Ledger',
      icon: BookOpenCheck,
      counter: null,
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'smart-procurement',
      label: 'Smart Procurement',
      icon: FileSpreadsheet,
      counter: unreadAlertCount > 0 ? String(unreadAlertCount) : null,
      counterColor: 'text-rose-400 bg-rose-500/10 border border-rose-500/20',
      dotColor: null,
    },
    {
      id: 'finsentinel-copilot',
      label: 'FinOps Copilot',
      icon: Bot,
      counter: 'RAG',
      counterColor: 'text-zinc-400 bg-white/[0.04] border border-white/[0.06]',
      dotColor: null,
    },
  ];

  return (
    <aside className="w-60 bg-[#0D0D10] border-r border-white/[0.06] flex flex-col justify-between h-full select-none shrink-0 z-30">
      <div>
        {/* Sleek Linear-style Brand Header */}
        <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-950 shadow-sm">
              <Shield className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-semibold text-[13px] text-zinc-100 tracking-tight">FinSentinel</span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">OS</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.02]">
            21.0
          </div>
        </div>

        {/* Compact Navigation Menu */}
        <div className="p-2 space-y-0.5">
          <div className="px-2.5 pt-3 pb-1.5 text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-500 font-medium">
            Core Ledger
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full h-8 px-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-white/[0.08] text-zinc-50 shadow-specular'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {item.dotColor && (
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                  )}
                  {item.counter && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        item.counterColor || 'text-zinc-400 bg-white/[0.04]'
                      }`}
                    >
                      {item.counter}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Session Footer (Linear Style) */}
      <div className="p-2.5 border-t border-white/[0.06]">
        {user ? (
          <div className="h-9 px-2 rounded-md flex items-center justify-between bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center text-[10px] font-semibold text-zinc-200 shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="truncate text-left">
                <div className="text-[11px] font-medium text-zinc-200 truncate leading-tight">
                  {user.fullName}
                </div>
                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider truncate">
                  {user.role.replace('ROLE_', '').replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          </div>
        ) : (
          <div className="text-[11px] font-mono text-zinc-500 text-center py-1">
            Anonymous Session
          </div>
        )}
      </div>
    </aside>
  );
};
