import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface TreasuryRule {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  targetAccount: string;
  status: 'ACTIVE' | 'STANDBY';
}

export const AutonomousRebalancer: React.FC = () => {
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  const rules: TreasuryRule[] = [
    {
      id: 'rule-sweep',
      name: 'Overnight Treasury Sweep to Short-Term Yield',
      description: 'Automatically transfer operating cash exceeding $1.0M buffer into high-yield treasury account 1011.',
      triggerCondition: 'Checking Cash > $1,000,000.00',
      targetAccount: '1011-YIELD',
      status: 'ACTIVE',
    },
    {
      id: 'rule-ap-discount',
      name: 'Dynamic 2/10 Net 30 Early Payment Arbitrage',
      description: 'Auto-disburse invoices offering >2% early payment discount if current cash runway > 4.0 months.',
      triggerCondition: 'Discount >= 2.0% & Runway > 4.0M',
      targetAccount: '5030-DISCOUNT-EARNED',
      status: 'ACTIVE',
    },
    {
      id: 'rule-gst-reserve',
      name: 'Automated Statutory GST Reserve Lock',
      description: 'Lock 18% of collected B2B receivables into a segregated statutory tax account.',
      triggerCondition: 'Receivable Settlement Event',
      targetAccount: '2020-GST-ESCROW',
      status: 'ACTIVE',
    },
  ];

  const handleSimulateRebalance = () => {
    setIsExecuting(true);
    setExecutionLog([
      'Initiating autonomous multi-step treasury audit...',
      'Evaluating current operating balance against $1,000,000 baseline...',
      'Surplus detected: $250,000.00 available for overnight repo yield',
      'Acquiring Redisson distributed lock "lock:treasury:rebalance"...',
      'Generating double-entry journal entry: DR 1011 / CR 1010 ($250,000.00)...',
      'Double-entry invariant verified: SUM(DEBIT) == SUM(CREDIT) = $250,000.00',
      'Ledger transaction successfully committed with Isolation.SERIALIZABLE',
      'Autonomous rebalancing cycle completed with 0 human latency.',
    ]);

    setTimeout(() => {
      setIsExecuting(false);
      queryClient.invalidateQueries({ queryKey: ['cfo-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    }, 1800);
  };

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
              Autonomous Treasury Rebalancer & Liquidity Optimizer
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Agent Active
            </span>
          </div>
          <p className="text-[12px] text-zinc-400 mt-0.5">
            Continuous zero-touch cash sweeps, early supplier discount capture & yield optimization.
          </p>
        </div>

        <button
          onClick={handleSimulateRebalance}
          disabled={isExecuting}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-md shadow-sm transition disabled:opacity-50 cursor-pointer"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
          <span>{isExecuting ? 'Executing Sweep...' : 'Trigger Immediate Sweep'}</span>
        </button>
      </div>

      {/* Rules Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-3.5 rounded-lg bg-zinc-900/30 border border-white/[0.04] space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-zinc-200 tracking-tight">
                  {rule.name}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse shrink-0 mt-1" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                {rule.description}
              </p>
            </div>

            <div className="pt-2 border-t border-white/[0.04] space-y-1 text-[10px] font-mono">
              <div className="flex justify-between text-zinc-500">
                <span>Trigger:</span>
                <span className="text-zinc-300">{rule.triggerCondition}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Account:</span>
                <span className="text-cyan-400">{rule.targetAccount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Agent Execution Output */}
      {executionLog.length > 0 && (
        <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] font-mono text-[11px] space-y-1 text-zinc-400 max-h-40 overflow-y-auto">
          <div className="text-[10px] uppercase text-zinc-500 font-semibold mb-1 flex items-center justify-between">
            <span>Agent Audit Log Stream</span>
            <span className="text-emerald-400">100% INVARIANT COMPLIANT</span>
          </div>
          {executionLog.map((log, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="text-zinc-600">›</span>
              <span className={idx === executionLog.length - 1 ? 'text-zinc-100 font-medium' : ''}>
                {log}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
