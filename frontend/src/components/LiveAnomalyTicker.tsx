import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useTelemetryStore } from '../store/telemetryStore';

interface LiveAnomalyTickerProps {
  onSelectInvoice?: (invoiceId: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveAnomalyTicker: React.FC<LiveAnomalyTickerProps> = ({
  onSelectInvoice,
  isOpen,
  onClose,
}) => {
  const { alerts, acknowledgeAlert, clearAlerts } = useTelemetryStore();

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-6 w-[400px] bg-[#0F0F12] border border-white/[0.08] rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="h-10 px-3.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-subtle-pulse" />
          <span className="text-xs font-semibold text-zinc-100">Live Anomaly Stream</span>
          <span className="text-[10px] font-mono text-zinc-500">({alerts.length})</span>
        </div>

        <div className="flex items-center space-x-1">
          {alerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded hover:bg-white/[0.04] transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-h-[28rem] overflow-y-auto divide-y divide-white/[0.04] p-1.5 space-y-1">
        {alerts.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-xs text-zinc-400">Zero pending anomalies. General ledger in equilibrium.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.invoiceId}
              className="p-3 rounded-lg bg-white/[0.015] hover:bg-white/[0.03] transition-colors space-y-2 border border-white/[0.04]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-semibold text-zinc-100">
                      {alert.invoiceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        alert.fraudRiskScore >= 75
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      Risk {alert.fraudRiskScore}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{alert.vendorName}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-semibold text-zinc-200 tabular-nums">
                    ${alert.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {alert.anomalyReasons && alert.anomalyReasons.length > 0 && (
                <div className="bg-rose-500/[0.04] border border-rose-500/10 rounded-md p-2 text-[11px] text-rose-300/90 space-y-1">
                  {alert.anomalyReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start space-x-1.5 font-mono text-[10px] leading-relaxed">
                      <AlertCircle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => acknowledgeAlert(alert.invoiceId)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium cursor-pointer"
                >
                  Dismiss
                </button>
                {onSelectInvoice && (
                  <button
                    onClick={() => {
                      onSelectInvoice(alert.invoiceId);
                      onClose();
                    }}
                    className="flex items-center space-x-1 text-[11px] font-medium text-zinc-300 hover:text-white cursor-pointer"
                  >
                    <span>Inspect Queue</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
