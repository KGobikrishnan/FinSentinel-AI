import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  LayoutDashboard,
  BookOpenCheck,
  FileSpreadsheet,
  Bot,
  Zap,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Plus,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTelemetryStore } from '../store/telemetryStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenNewEntryModal?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Actions' | 'Forensic Queries' | 'Role Switcher';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  badge?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewEntryModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user, switchDemoRole } = useAuthStore();
  const { alerts } = useTelemetryStore();

  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: 'nav-cfo',
        title: 'Executive Telemetry Dashboard',
        subtitle: 'View live liquidity, burn rate, runway & cashflow trends',
        category: 'Navigation',
        icon: LayoutDashboard,
        shortcut: 'G D',
        action: () => {
          onNavigate('cfo-dashboard');
          onClose();
        },
      },
      {
        id: 'nav-ledger',
        title: 'General Ledger & Trial Balance',
        subtitle: 'Double-entry invariants, journal entries & atomic postings',
        category: 'Navigation',
        icon: BookOpenCheck,
        shortcut: 'G L',
        action: () => {
          onNavigate('ledger-explorer');
          onClose();
        },
      },
      {
        id: 'nav-procurement',
        title: 'Smart Procurement & AI Triage',
        subtitle: 'Upload PDF invoices, audit flagged price surges & review GST',
        category: 'Navigation',
        icon: FileSpreadsheet,
        shortcut: 'G P',
        badge: alerts.length > 0 ? `${alerts.length} Flagged` : undefined,
        action: () => {
          onNavigate('smart-procurement');
          onClose();
        },
      },
      {
        id: 'nav-copilot',
        title: 'FinOps AI Copilot',
        subtitle: 'pgvector RAG reasoning, safe MCP tool execution & chart synthesis',
        category: 'Navigation',
        icon: Bot,
        shortcut: 'G C',
        badge: 'Spring AI',
        action: () => {
          onNavigate('finsentinel-copilot');
          onClose();
        },
      },

      // Actions
      {
        id: 'act-new-entry',
        title: 'Post Atomic Journal Entry',
        subtitle: 'Open balanced double-entry modal (Debit == Credit)',
        category: 'Actions',
        icon: Plus,
        shortcut: '⌘ N',
        action: () => {
          onNavigate('ledger-explorer');
          onClose();
          if (onOpenNewEntryModal) {
            setTimeout(onOpenNewEntryModal, 150);
          }
        },
      },
      {
        id: 'act-upload-pdf',
        title: 'Upload Invoice PDF (PDFBox Parser)',
        subtitle: 'Extract text, verify GST & calculate 90-day price variance',
        category: 'Actions',
        icon: FileSpreadsheet,
        shortcut: '⌘ U',
        action: () => {
          onNavigate('smart-procurement');
          onClose();
        },
      },

      // Forensic Queries
      {
        id: 'forensic-anomalies',
        title: 'Intercepted Fraud Anomalies',
        subtitle: 'Filter active invoices with risk score >= 30',
        category: 'Forensic Queries',
        icon: ShieldAlert,
        badge: 'Forensics',
        action: () => {
          onNavigate('smart-procurement');
          onClose();
        },
      },
      {
        id: 'forensic-cloud',
        title: 'Cloud Infrastructure Spend Breakdown',
        subtitle: 'Audit AWS & GCP contract commitments against budget limits',
        category: 'Forensic Queries',
        icon: TrendingUp,
        action: () => {
          onNavigate('cfo-dashboard');
          onClose();
        },
      },

      // Role Switchers
      {
        id: 'role-cfo',
        title: 'Switch Role to CFO Admin',
        subtitle: 'Active: Alexandra Chen (Full Ledger & Dual-Auth Approvals)',
        category: 'Role Switcher',
        icon: Zap,
        badge: user?.role === 'ROLE_CFO_ADMIN' ? 'Active' : undefined,
        action: () => {
          switchDemoRole('ROLE_CFO_ADMIN');
          onClose();
        },
      },
      {
        id: 'role-auditor',
        title: 'Switch Role to Lead Auditor',
        subtitle: 'Active: Marcus Vance (Trial Balance & Forensic Anomaly Review)',
        category: 'Role Switcher',
        icon: Zap,
        badge: user?.role === 'ROLE_FINANCE_AUDITOR' ? 'Active' : undefined,
        action: () => {
          switchDemoRole('ROLE_FINANCE_AUDITOR');
          onClose();
        },
      },
      {
        id: 'role-procurement',
        title: 'Switch Role to Procurement Head',
        subtitle: 'Active: Sarah Jenkins (Invoices & Vendor Benchmarks)',
        category: 'Role Switcher',
        icon: Zap,
        badge: user?.role === 'ROLE_PROCUREMENT_MANAGER' ? 'Active' : undefined,
        action: () => {
          switchDemoRole('ROLE_PROCUREMENT_MANAGER');
          onClose();
        },
      },
    ];

    return list;
  }, [onNavigate, onClose, onOpenNewEntryModal, user?.role, switchDemoRole, alerts.length]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.subtitle.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(filtered.map((item) => item.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-[#09090B] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 h-13 border-b border-white/[0.06] bg-zinc-900/30">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, ledger accounts, invoices, or switch roles..."
            className="w-full h-full bg-transparent px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none tracking-tight"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.06] rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-white/[0.02]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No matching commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = filtered.filter((i) => i.category === category);
              return (
                <div key={category} className="py-1.5">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-500 font-medium">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {categoryItems.map((item) => {
                      const itemGlobalIndex = filtered.indexOf(item);
                      const isSelected = itemGlobalIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-white/[0.06] text-zinc-100 shadow-sm'
                              : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? 'bg-zinc-800 border-white/[0.12] text-zinc-100'
                                  : 'bg-zinc-900/60 border-white/[0.04] text-zinc-400'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium tracking-tight text-zinc-200 truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-zinc-500 truncate">{item.subtitle}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 ml-3">
                            {item.badge && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-300">
                                {item.badge}
                              </span>
                            )}
                            {item.shortcut && (
                              <kbd className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-black/40 border border-white/[0.06]">
                                {item.shortcut}
                              </kbd>
                            )}
                            {isSelected && <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="h-9 px-4 border-t border-white/[0.06] bg-zinc-900/40 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded mr-1">↑</kbd>
              <kbd className="px-1 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded mr-1">↓</kbd>
              to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded mr-1">↵</kbd>
              to execute
            </span>
          </div>
          <div>
            <span className="text-zinc-400 font-sans">FinSentinel Command OS</span> • <span className="tabular-nums">v1.2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
