import React, { useEffect, useState } from 'react';
import { FinnovaHeader } from './FinnovaHeader';
import { CommandPalette } from './CommandPalette';
import { LiveAnomalyTicker } from './LiveAnomalyTicker';
import { useTelemetryStore } from '../store/telemetryStore';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { initWebSocket, disconnectWebSocket } = useTelemetryStore();
  const { checkAuth } = useAuthStore();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [tickerOpen, setTickerOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    initWebSocket();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      disconnectWebSocket();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [checkAuth, initWebSocket, disconnectWebSocket]);

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Floating Nav Pill Header (Finnova Style) */}
      <FinnovaHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Responsive Canvas */}
      <main className="flex-1 px-6 lg:px-10 pb-12 max-w-[1500px] w-full mx-auto">
        {children}
      </main>

      {/* ⌘K Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={setActiveTab}
      />

      {/* Forensic Queue Drawer */}
      <LiveAnomalyTicker
        isOpen={tickerOpen}
        onClose={() => setTickerOpen(false)}
        onSelectInvoice={() => setActiveTab('smart-procurement')}
      />
    </div>
  );
};
