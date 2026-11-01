import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import { LiveAnomalyTicker } from './LiveAnomalyTicker';
import { CommandPalette } from './CommandPalette';
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
  const [tickerOpen, setTickerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    initWebSocket();

    // Global ⌘K / Ctrl+K keyboard shortcut
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
    <div className="flex h-screen bg-[#09090B] text-zinc-100 overflow-hidden font-sans">
      {/* Surgical Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          onToggleAlertTicker={() => setTickerOpen(!tickerOpen)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-5 sm:p-6 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* 24px-tall VS Code / Linear style status bar */}
        <StatusBar />

        <LiveAnomalyTicker
          isOpen={tickerOpen}
          onClose={() => setTickerOpen(false)}
          onSelectInvoice={() => {
            setActiveTab('smart-procurement');
          }}
        />

        {/* Raycast ⌘K Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onNavigate={setActiveTab}
        />
      </div>
    </div>
  );
};
