import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Scale,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '../api/client';
import {
  JournalEntry,
  TrialBalance,
  Account,
  JournalLine,
  JournalEntryRequest,
  EntryType,
} from '../types';

export const LedgerExplorer: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'journals' | 'trial-balance' | 'accounts'>('journals');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Form state for new journal entry
  const [memo, setMemo] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<JournalLine[]>([
    { accountCode: '1010', entryType: 'DEBIT', amount: 5000, memo: 'Treasury reserve allocation' },
    { accountCode: '3010', entryType: 'CREDIT', amount: 5000, memo: 'Capital adjustment' },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Journal Entries
  const { data: journalEntries = [], isLoading: isLoadingEntries } = useQuery<JournalEntry[]>({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const res = await apiClient.get<JournalEntry[]>('/ledger/entries');
      return res.data;
    },
  });

  // Fetch Trial Balance
  const { data: trialBalance, isLoading: isLoadingTrial } = useQuery<TrialBalance>({
    queryKey: ['trial-balance'],
    queryFn: async () => {
      const res = await apiClient.get<TrialBalance>('/ledger/trial-balance');
      return res.data;
    },
  });

  // Fetch Chart of Accounts
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await apiClient.get<Account[]>('/ledger/accounts');
      return res.data;
    },
  });

  // Post Journal Entry Mutation
  const postMutation = useMutation({
    mutationFn: async (payload: JournalEntryRequest) => {
      const res = await apiClient.post<JournalEntry>('/ledger/entries', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['cfo-metrics'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      const message = axiosError.response?.data?.detail || axiosError.response?.data?.title || 'Failed to post entry';
      setFormError(message);
    },
  });

  const resetForm = () => {
    setMemo('');
    setReferenceId('');
    setPostingDate(new Date().toISOString().split('T')[0]);
    setLines([
      { accountCode: '1010', entryType: 'DEBIT', amount: 5000, memo: '' },
      { accountCode: '3010', entryType: 'CREDIT', amount: 5000, memo: '' },
    ]);
    setFormError(null);
  };

  const totalDebit = lines
    .filter((l) => l.entryType === 'DEBIT')
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const totalCredit = lines
    .filter((l) => l.entryType === 'CREDIT')
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const imbalance = Math.abs(totalDebit - totalCredit);
  const isBalanced = imbalance < 0.0001 && lines.length >= 2 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountCode: '5010', entryType: 'DEBIT', amount: 0, memo: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof JournalLine, value: string | number) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setFormError('Cannot post unbalanced entry: Total Debit must strictly equal Total Credit.');
      return;
    }
    setFormError(null);
    postMutation.mutate({
      referenceId: referenceId || undefined,
      postingDate,
      memo: memo || 'Manual journal posting',
      lines: lines.map((l, idx) => ({
        ...l,
        amount: Number(l.amount),
        lineOrder: idx + 1,
      })),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header (Finnova Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-indigo-600 font-bold">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900 leading-tight">
              General Ledger
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              High-concurrency double-entry invariants (ACID SERIALIZABLE) & trial balance.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="h-10 px-5 rounded-full bg-[#5847F6] hover:bg-[#4B3BE0] text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Atomic Entry</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Switcher (Pill Style) */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setActiveSubTab('journals')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'journals'
              ? 'bg-[#5847F6] text-white shadow-md shadow-indigo-500/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm'
          }`}
        >
          Journal Entries ({journalEntries.length})
        </button>
        <button
          onClick={() => setActiveSubTab('trial-balance')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeSubTab === 'trial-balance'
              ? 'bg-[#5847F6] text-white shadow-md shadow-indigo-500/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm'
          }`}
        >
          <span>Trial Balance Sheet</span>
          {trialBalance?.isBalanced && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'accounts'
              ? 'bg-[#5847F6] text-white shadow-md shadow-indigo-500/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm'
          }`}
        >
          Chart of Accounts ({accounts.length})
        </button>
      </div>

      {/* VIEW 1: Journal Entries Table */}
      {activeSubTab === 'journals' && (
        <div className="hairline-card rounded-xl overflow-hidden">
          <div className="h-10 px-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
              General Ledger Postings (Isolation.SERIALIZABLE)
            </div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['journal-entries'] })}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/[0.04]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Entry ID</th>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium font-sans">Memo & Purpose</th>
                  <th className="py-2.5 px-4 text-right font-medium">Debits</th>
                  <th className="py-2.5 px-4 text-right font-medium">Credits</th>
                  <th className="py-2.5 px-4 text-right font-medium">Total Settled</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 text-center font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[11px]">
                {isLoadingEntries ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500 font-sans">
                      Loading general ledger journal entries...
                    </td>
                  </tr>
                ) : journalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500 font-sans">
                      No posted journal entries found.
                    </td>
                  </tr>
                ) : (
                  journalEntries.map((entry) => {
                    const debitsCount = entry.lines.filter((l) => l.entryType === 'DEBIT').length;
                    const creditsCount = entry.lines.filter((l) => l.entryType === 'CREDIT').length;
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-zinc-200">
                          {entry.entryNumber}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 tabular-nums">{entry.postingDate}</td>
                        <td className="py-3 px-4 font-sans">
                          <div className="font-medium text-zinc-200">{entry.memo || 'No memo'}</div>
                          {entry.referenceId && (
                            <div className="text-[10px] font-mono text-zinc-500">
                              Ref: {entry.referenceId}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                          {debitsCount} Dr
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                          {creditsCount} Cr
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-zinc-100 tabular-nums">
                          ${entry.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{entry.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-zinc-600">
                          <ChevronRight className="w-3.5 h-3.5 inline" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Trial Balance Sheet */}
      {activeSubTab === 'trial-balance' && (
        <div className="space-y-4">
          {/* Subtle Invariant Status Banner */}
          <div className="hairline-card p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  trialBalance?.isBalanced ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <div>
                <div className="text-xs font-semibold text-zinc-100">
                  {trialBalance?.isBalanced
                    ? 'Mathematical Equilibrium Satisfied (Debit == Credit)'
                    : 'Invariant Discrepancy Detected'}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  As of period {trialBalance?.asOfDate || 'Current'} &bull; Zero tolerance tolerance: 0.0000
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-zinc-500 text-[10px] uppercase">Net Imbalance</div>
              <div className={`font-semibold tabular-nums ${trialBalance?.isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${trialBalance?.netImbalance?.toFixed(4) || '0.0000'}
              </div>
            </div>
          </div>

          {/* Trial Balance High-Density Table */}
          <div className="hairline-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/[0.02] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/[0.04]">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Code</th>
                    <th className="py-2.5 px-4 font-medium font-sans">Account Title</th>
                    <th className="py-2.5 px-4 font-medium">Classification</th>
                    <th className="py-2.5 px-4 text-right font-medium">Debit ($)</th>
                    <th className="py-2.5 px-4 text-right font-medium">Credit ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-[11px]">
                  {isLoadingTrial ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 font-sans">
                        Calculating trial balance...
                      </td>
                    </tr>
                  ) : (
                    trialBalance?.accounts.map((acc) => (
                      <tr key={acc.code} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-zinc-200">{acc.code}</td>
                        <td className="py-2.5 px-4 font-sans text-zinc-300">{acc.name}</td>
                        <td className="py-2.5 px-4 text-zinc-500">{acc.accountType}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-zinc-200">
                          {acc.debitBalance > 0
                            ? `$${acc.debitBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-zinc-200">
                          {acc.creditBalance > 0
                            ? `$${acc.creditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-white/[0.03] border-t border-white/[0.08] text-xs font-semibold text-zinc-100">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right text-zinc-400 font-sans">
                      Equilibrium Totals:
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-emerald-400">
                      ${trialBalance?.totalDebit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-emerald-400">
                      ${trialBalance?.totalCredit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Chart of Accounts */}
      {activeSubTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="hairline-card p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-zinc-200">{acc.code}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{acc.accountType}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-200 truncate">{acc.name}</div>
                <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{acc.description}</div>
              </div>
              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Balance:</span>
                <span className="font-semibold text-zinc-100 tabular-nums">
                  ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer: Journal Entry Line Items */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0F0F12] border-l border-white/[0.08] h-full p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-500">
                  Journal Entry
                </div>
                <div className="text-base font-semibold text-zinc-100 font-mono mt-0.5">
                  {selectedEntry.entryNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                <div className="text-zinc-500 text-[10px]">Date</div>
                <div className="text-zinc-200 font-medium mt-0.5 tabular-nums">{selectedEntry.postingDate}</div>
              </div>
              <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                <div className="text-zinc-500 text-[10px]">Total Amount</div>
                <div className="text-zinc-100 font-semibold mt-0.5 tabular-nums">
                  ${selectedEntry.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Memo</div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-zinc-300">
                {selectedEntry.memo || 'No transaction memo provided.'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1.5">
                Posting Lines ({selectedEntry.lines.length})
              </div>
              <div className="space-y-1.5">
                {selectedEntry.lines.map((l, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-zinc-200">{l.accountCode}</span>
                        <span className="font-sans text-zinc-400">{l.accountName}</span>
                      </div>
                      {l.memo && <div className="text-[10px] text-zinc-500 mt-0.5">{l.memo}</div>}
                    </div>

                    <div className="text-right">
                      <span className="tabular-nums font-semibold text-zinc-200">
                        {l.entryType === 'DEBIT' ? 'Dr' : 'Cr'}{' '}
                        ${l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST NEW JOURNAL ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0F0F12] border border-white/[0.1] rounded-xl p-5 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <div className="text-sm font-semibold text-zinc-100">Post Balanced Journal Entry</div>
                <div className="text-[11px] text-zinc-500">Atomic ledger mutation backed by Redisson distributed locks</div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={postingDate}
                    onChange={(e) => setPostingDate(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Reference ID</label>
                  <input
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="e.g. PO-90812"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Memo</label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Transaction purpose"
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Lines (Min 2)</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-zinc-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Line</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04] items-center text-xs"
                    >
                      <div className="col-span-4">
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                          className="w-full bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none"
                        >
                          {accounts.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.code} • {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <select
                          value={line.entryType}
                          onChange={(e) => handleLineChange(idx, 'entryType', e.target.value as EntryType)}
                          className="w-full bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-xs font-mono font-medium focus:outline-none text-zinc-300"
                        >
                          <option value="DEBIT">Debit (Dr)</option>
                          <option value="CREDIT">Credit (Cr)</option>
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={line.amount || ''}
                          onChange={(e) => handleLineChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          required
                          className="w-full bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-xs font-mono text-zinc-100 text-right tabular-nums focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="text"
                          value={line.memo || ''}
                          onChange={(e) => handleLineChange(idx, 'memo', e.target.value)}
                          placeholder="Line memo"
                          className="w-full bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={lines.length <= 2}
                          className="text-zinc-600 hover:text-rose-400 disabled:opacity-20 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minimal Invariant Equilibrium Strip */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isBalanced ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  />
                  <span className={isBalanced ? 'text-zinc-300' : 'text-rose-400'}>
                    {isBalanced ? 'Balanced' : `Imbalance: $${imbalance.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex items-center space-x-3 tabular-nums text-zinc-400 text-[11px]">
                  <span>Dr: ${totalDebit.toFixed(2)}</span>
                  <span>Cr: ${totalCredit.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-3 rounded-md text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || postMutation.isPending}
                  className="h-8 px-4 rounded-md text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-30 cursor-pointer transition-all shadow-sm flex items-center space-x-1.5"
                >
                  {postMutation.isPending && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Commit Post</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
