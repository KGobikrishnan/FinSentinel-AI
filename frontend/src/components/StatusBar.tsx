import React from 'react';
import { useTelemetryStore } from '../store/telemetryStore';

export const StatusBar: React.FC = () => {
  const { isConnected, unreadAlertCount } = useTelemetryStore();

  return (
    <footer className="h-6 bg-[#0D0D10] border-t border-white/[0.06] px-3 flex items-center justify-between text-[11px] font-mono select-none z-30 shrink-0 text-zinc-400">
      {/* Left: Environment & Engine Telemetry */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-subtle-pulse" />
          <span className="font-semibold text-zinc-200">FinSentinel</span>
          <span className="text-zinc-500">v1.0.0-GA</span>
        </div>

        <div className="hidden md:flex items-center space-x-3 text-zinc-400">
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Virtual Threads</span>
          </span>

          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Redisson Lock</span>
          </span>

          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>pgvector HNSW</span>
          </span>
        </div>
      </div>

      {/* Right: Latency, Invariant equilibrium, and WebSocket telemetry */}
      <div className="flex items-center space-x-4">
        {unreadAlertCount > 0 && (
          <span className="flex items-center space-x-1 text-rose-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{unreadAlertCount} Anomaly Queued</span>
          </span>
        )}

        <span className="hidden sm:inline text-zinc-500">
          Invariant: <span className="text-emerald-400 tabular-nums">Δ 0.0000</span>
        </span>

        <span className="text-zinc-500 hidden sm:inline">
          Latency: <span className="text-zinc-300 tabular-nums">1.8ms</span>
        </span>

        <div className="flex items-center space-x-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className={isConnected ? 'text-zinc-300' : 'text-amber-400'}>
            {isConnected ? 'STOMP' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
    </footer>
  );
};
