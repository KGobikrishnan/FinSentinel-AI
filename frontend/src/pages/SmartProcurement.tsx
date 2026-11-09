import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  CheckCircle2,
  Building2,
  X,
  FileCheck,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Calendar,
  Search,
  Plus,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { Invoice, Vendor, AuditDecisionRequest, TriageStatus } from '../types';
import { InvoicePdfInspector } from '../components/InvoicePdfInspector';
import { VendorGraph } from '../components/VendorGraph';

export const SmartProcurement: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'invoices' | 'upload' | 'vendors' | 'graph'>('invoices');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TriageStatus>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [inspectingInvoice, setInspectingInvoice] = useState<Invoice | null>(null);

  // Manual Audit Override Modal State
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditDecision, setAuditDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [auditRationale, setAuditRationale] = useState('');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Query Invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await apiClient.get<Invoice[]>('/procurement/invoices');
      return res.data;
    },
  });

  // Query Vendors
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await apiClient.get<Vendor[]>('/procurement/vendors');
      return res.data;
    },
  });

  // Calculate Finnova-style Executive Stats
  const overdueTotal = 24850.0;
  const dueNextMonth = 142560.0;
  const instantPayout = 186540.0;
  const avgPayDays = 16;

  // Upload PDF Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<Invoice>('/procurement/invoices/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['cfo-metrics'] });
      setIsUploading(false);
      setUploadFile(null);
      setUploadSuccessMessage(
        `Invoice ${data.invoiceNumber} processed: ${data.triageStatus} (Risk: ${data.fraudRiskScore}/100)`
      );
      setSelectedInvoice(data);
    },
    onError: (err: unknown) => {
      setIsUploading(false);
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      setUploadError(axiosError.response?.data?.detail || 'Failed to parse invoice PDF');
    },
  });

  // Audit Decision Mutation
  const auditDecisionMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AuditDecisionRequest }) => {
      const res = await apiClient.post<Invoice>(`/procurement/invoices/${id}/audit-decision`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['cfo-metrics'] });
      setAuditModalOpen(false);
      setAuditRationale('');
      setSelectedInvoice(data);
    },
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setUploadFile(file);
        setUploadError(null);
      } else {
        setUploadError('Only PDF files are supported.');
      }
    }
  };

  const handleStartUpload = () => {
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);
    uploadMutation.mutate(uploadFile);
  };

  const handleApplyAuditDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    auditDecisionMutation.mutate({
      id: selectedInvoice.id,
      payload: {
        decision: auditDecision,
        rationale: auditRationale || 'Authorized by Forensic Auditor via FinSentinel UI',
      },
    });
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.triageStatus === statusFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Currently active invoice in split view
  const currentInspectInvoice = selectedInvoice || invoices[0] || null;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Breadcrumbs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center space-x-2">
            <span>Invoices</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage, triage, and audit autonomous procure-to-pay invoices in one surgical workspace.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('upload')}
            className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center space-x-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create / Upload Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. Finnova-Style 4 Floating KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Overdue */}
        <div
          className="p-4 rounded-2xl bg-[#0F0F13]/90 border border-white/[0.06] backdrop-blur-md flex flex-col justify-between relative overflow-hidden"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)' }}
        >
          <div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em]">Overdue</span>
              <span className="w-5 h-5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-[10px] font-mono">
                !
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-100 tabular-nums font-sans mt-2">
              ${overdueTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-[11px] text-rose-400 font-medium mt-1">
              <span className="flex items-center mr-1 font-mono tabular-nums">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.5%
              </span>
              <span className="text-zinc-500">from last month</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-400">
            <span>2 Invoices Overdue</span>
            <span className="font-mono text-zinc-500">Net 30 breach</span>
          </div>
        </div>

        {/* Card 2: Due within next month with Mini Bar Sparkline */}
        <div
          className="p-4 rounded-2xl bg-[#0F0F13]/90 border border-white/[0.06] backdrop-blur-md flex flex-col justify-between relative overflow-hidden"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)' }}
        >
          <div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em]">Due Next Month</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-100 tabular-nums font-sans mt-2">
              ${dueNextMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-[11px] text-cyan-400 font-medium mt-1">
              <span className="flex items-center mr-1 font-mono tabular-nums">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +8.2%
              </span>
              <span className="text-zinc-500">from last month</span>
            </div>
          </div>

          {/* Mini Bar Sparkline */}
          <div className="mt-3 flex items-end justify-between h-8 gap-1 pt-1">
            {[40, 55, 30, 70, 85, 60, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-zinc-800 rounded-sm h-full flex items-end overflow-hidden">
                <div
                  className="w-full bg-sky-500 rounded-sm transition-all"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Average time to get paid with Mini Line Sparkline */}
        <div
          className="p-4 rounded-2xl bg-[#0F0F13]/90 border border-white/[0.06] backdrop-blur-md flex flex-col justify-between relative overflow-hidden"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)' }}
        >
          <div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em]">Avg Pay Settlement</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-100 tabular-nums font-sans mt-2">
              {avgPayDays} <span className="text-sm font-normal text-zinc-400">days</span>
            </div>
            <div className="flex items-center text-[11px] text-emerald-400 font-medium mt-1">
              <span className="flex items-center mr-1 font-mono tabular-nums">
                ↓ 2 days
              </span>
              <span className="text-zinc-500">faster turnaround</span>
            </div>
          </div>

          {/* Mini Sparkline Curve */}
          <div className="mt-3 h-8 flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-white/[0.04] pt-2">
            <span>Fastest: 4d</span>
            <span className="text-emerald-400 font-semibold">98.4% On-Time</span>
          </div>
        </div>

        {/* Card 4: Instant Payout / Liquidity Available */}
        <div
          className="p-4 rounded-2xl bg-[#0F0F13]/90 border border-white/[0.06] backdrop-blur-md flex flex-col justify-between relative overflow-hidden"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)' }}
        >
          <div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em]">Available for Instant Payout</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-100 tabular-nums font-sans mt-2">
              ${instantPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Quick Payment Rails Tabs */}
          <div className="mt-3 grid grid-cols-3 gap-1 pt-2 border-t border-white/[0.04]">
            <div className="p-1 rounded bg-black/40 border border-white/[0.04] text-center">
              <div className="text-[9px] font-mono text-zinc-500">Visa</div>
              <div className="text-[10px] font-mono text-zinc-300">•••• 4242</div>
            </div>
            <div className="p-1 rounded bg-sky-500/10 border border-sky-500/20 text-center">
              <div className="text-[9px] font-mono text-cyan-400">Stripe</div>
              <div className="text-[10px] font-mono text-sky-200">•••• 6789</div>
            </div>
            <div className="p-1 rounded bg-black/40 border border-white/[0.04] text-center">
              <div className="text-[9px] font-mono text-zinc-500">PayPal</div>
              <div className="text-[10px] font-mono text-zinc-300">•••• 1234</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-2.5 rounded-2xl bg-[#0F0F13]/80 border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Active filters pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs text-zinc-300 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Active filters</span>
            <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-mono">
              {statusFilter === 'ALL' ? '1' : '2'}
            </span>
          </div>

          {/* Status selector */}
          <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/[0.06] text-xs">
            {(['ALL', 'AUTO_APPROVED', 'FLAGGED_FOR_AUDIT', 'CRITICAL_ANOMALY'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                }`}
              >
                {s === 'ALL' ? 'All Invoices' : s === 'AUTO_APPROVED' ? 'Approved' : s === 'FLAGGED_FOR_AUDIT' ? 'Flagged' : 'Critical'}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice # or vendor..."
            className="w-full pl-9 pr-3 py-1 bg-black/40 border border-white/[0.06] rounded-lg text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* 4. Finnova-Style Master-Detail Interactive Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols): Unpaid / Triage Invoices Queue */}
        <div
          className="lg:col-span-5 rounded-2xl bg-[#0D0D12] border border-white/[0.06] p-4 flex flex-col justify-between space-y-3"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)' }}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-zinc-200 tracking-tight">
                Triaged Invoices Queue ({filteredInvoices.length})
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Live Telemetry</span>
            </div>

            <div className="space-y-1.5 mt-3 max-h-[460px] overflow-y-auto pr-1">
              {isLoadingInvoices ? (
                <div className="py-12 text-center text-xs text-zinc-500">Loading records...</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">No matching invoices found.</div>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = currentInspectInvoice?.id === inv.id;
                  const isFlagged = inv.fraudRiskScore >= 30;

                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-600/20 border-sky-500/40 shadow-sm'
                          : 'bg-zinc-900/30 border-white/[0.03] hover:bg-white/[0.02] hover:border-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border text-xs font-semibold ${
                            isSelected
                              ? 'bg-sky-600 text-white border-cyan-400'
                              : 'bg-zinc-800 text-zinc-300 border-white/[0.06]'
                          }`}
                        >
                          {inv.vendorName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-zinc-100 truncate">
                            {inv.invoiceNumber}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate font-sans">
                            {inv.vendorName}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold font-mono text-zinc-100 tabular-nums">
                          ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-mono px-1.5 py-0.2 rounded mt-0.5 border ${
                            isFlagged
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {isFlagged ? `Flagged: ${inv.fraudRiskScore}` : 'Clean'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Autonomous Invariant Engine</span>
            <span className="text-zinc-300">Java 21 / SERIALIZABLE</span>
          </div>
        </div>

        {/* Right Column (7 cols): Finnova-Style Purple Gradient Card (Invoice Details) */}
        <div className="lg:col-span-7">
          {currentInspectInvoice ? (
            <div
              className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-6 text-white"
              style={{
                background: 'linear-gradient(135deg, #3730A3 0%, #1E1B4B 60%, #0F0E17 100%)',
                boxShadow: '0 20px 40px -15px rgba(55, 48, 163, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              {/* Header with Company Logo & Customer Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-sky-200/80 font-mono">
                    Invoice Details
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl font-bold font-mono tracking-tight text-white">
                      {currentInspectInvoice.invoiceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        currentInspectInvoice.fraudRiskScore >= 30
                          ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                          : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                      }`}
                    >
                      {currentInspectInvoice.triageStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <Building2 className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-sky-200/70 font-mono">Supplier</div>
                    <div className="text-xs font-semibold text-white">{currentInspectInvoice.vendorName}</div>
                  </div>
                </div>
              </div>

              {/* 3 Prominent Service Allocation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
                  <div className="text-[10px] text-sky-200/80 uppercase font-mono">Subtotal</div>
                  <div className="text-lg font-bold font-mono text-white tabular-nums">
                    ${currentInspectInvoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-cyan-300/80">Base Procurement</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
                  <div className="text-[10px] text-sky-200/80 uppercase font-mono">GST (18%)</div>
                  <div className="text-lg font-bold font-mono text-white tabular-nums">
                    ${(currentInspectInvoice.cgst + currentInspectInvoice.sgst + currentInspectInvoice.igst).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-cyan-300/80">Input Tax Credit</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
                  <div className="text-[10px] text-sky-200/80 uppercase font-mono">Total Balance</div>
                  <div className="text-lg font-bold font-mono text-white tabular-nums">
                    ${currentInspectInvoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-cyan-300/80">Net Payable</div>
                </div>
              </div>

              {/* Forensic Anomaly Reason or Compliance Pass */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 text-xs font-mono space-y-1">
                <div className="text-[10px] text-sky-200/70 uppercase">Forensic Audit Verdict</div>
                <div className="text-white font-sans text-xs">
                  {currentInspectInvoice.anomalyReasons?.[0] ||
                    'Invariant check verified. No unit price inflation surge detected against 90-day contracts.'}
                </div>
              </div>

              {/* Bottom Summary Bar with Payout Action */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-6 text-xs font-mono">
                  <div>
                    <span className="text-sky-200/70 text-[10px] uppercase block">Invoice Date</span>
                    <span className="text-white font-medium">{currentInspectInvoice.invoiceDate}</span>
                  </div>
                  <div>
                    <span className="text-sky-200/70 text-[10px] uppercase block">GSTIN</span>
                    <span className="text-white font-medium">{currentInspectInvoice.gstin || '27AABCS1429B1Z8'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setInspectingInvoice(currentInspectInvoice);
                      setInspectorOpen(true);
                    }}
                    className="h-8 px-3 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>OCR Inspector</span>
                  </button>

                  {!currentInspectInvoice.journalEntryId && (
                    <button
                      onClick={() => setAuditModalOpen(true)}
                      className="h-8 px-4 rounded-lg text-xs font-bold bg-white text-slate-950 hover:bg-sky-50 transition-all cursor-pointer shadow-lg shadow-black/30"
                    >
                      Authorize & Disburse
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full rounded-2xl bg-[#0D0D12] border border-white/[0.06] flex items-center justify-center p-12 text-zinc-500 text-xs">
              Select an invoice from the queue to view forensic details.
            </div>
          )}
        </div>
      </div>

      {/* 5. Additional Views: Upload & Supplier Matrix */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="hairline-card p-5 rounded-2xl space-y-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
                PDFBox Stream Ingestion
              </div>
              <div className="text-sm font-semibold text-zinc-100 tracking-tight mt-0.5">
                Headless OCR & Regulatory GST Verification
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border border-dashed border-white/[0.12] hover:border-sky-500/50 rounded-xl p-8 text-center transition-all bg-white/[0.01]"
            >
              <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-medium text-zinc-200">
                {uploadFile ? uploadFile.name : 'Drop vendor invoice PDF here or browse'}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Extracts text, compares unit prices against 90-day benchmarks & verifies 18% GST.
              </div>
              <input
                type="file"
                accept="application/pdf"
                id="pdf-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                    setUploadError(null);
                  }
                }}
              />
              <label
                htmlFor="pdf-upload"
                className="mt-3 inline-block px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] cursor-pointer transition-colors"
              >
                Select Local File
              </label>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {uploadError}
              </div>
            )}

            {uploadSuccessMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            <button
              onClick={handleStartUpload}
              disabled={!uploadFile || isUploading}
              className="w-full h-8 rounded-md text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Parsing with PDFBox & Triage...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Parse & Evaluate</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Simulation Synthetic Payloads */}
          <div className="hairline-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
                Synthetic Invariant Verification
              </div>
              <div className="text-sm font-semibold text-zinc-100 tracking-tight mt-0.5">
                Simulated Test Payloads
              </div>

              <div className="space-y-2 mt-4">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">1. Compliant Enterprise SaaS</span>
                    <span className="text-[10px] font-mono text-emerald-400">AUTO-APPROVE</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Vendor: CloudScale Networks, Unit Price $1,200.00 (within 15% threshold), Tax: 18% GST ($6,840).
                  </p>
                  <button
                    onClick={() => {
                      apiClient
                        .post('/procurement/invoices', {
                          vendorName: 'CloudScale Networks Inc.',
                          invoiceNumber: 'INV-CS-' + Date.now().toString().slice(-6),
                          invoiceDate: new Date().toISOString().split('T')[0],
                          gstin: '27AABCS1429B1Z8',
                          subtotal: 38000.0,
                          cgst: 3420.0,
                          sgst: 3420.0,
                          igst: 0.0,
                          totalAmount: 44840.0,
                          lineItems: [
                            {
                              description: 'Enterprise Compute Instance H100',
                              quantity: 1,
                              unitPrice: 1200.0,
                              totalPrice: 38000.0,
                            },
                          ],
                        })
                        .then((res) => {
                          queryClient.invalidateQueries({ queryKey: ['invoices'] });
                          queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
                          setSelectedInvoice(res.data);
                        });
                    }}
                    className="text-xs font-medium text-zinc-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Run Simulation</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">2. Price Inflation & Tax Mismatch</span>
                    <span className="text-[10px] font-mono text-rose-400">INTERCEPTED</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Vendor: Nova Hardware, Unit Price $16,400 (Historical $8,000 &gt; 15% threshold), Tax discrepancy.
                  </p>
                  <button
                    onClick={() => {
                      apiClient
                        .post('/procurement/invoices', {
                          vendorName: 'Nova Cyberware Solutions',
                          invoiceNumber: 'INV-NV-' + Date.now().toString().slice(-6),
                          invoiceDate: new Date().toISOString().split('T')[0],
                          gstin: '07AAECN9999P1ZK',
                          subtotal: 82000.0,
                          cgst: 1000.0,
                          sgst: 1000.0,
                          igst: 0.0,
                          totalAmount: 84000.0,
                          lineItems: [
                            {
                              description: 'High-Speed Cryptographic Hardware',
                              quantity: 5,
                              unitPrice: 16400.0,
                              totalPrice: 82000.0,
                            },
                          ],
                        })
                        .then((res) => {
                          queryClient.invalidateQueries({ queryKey: ['invoices'] });
                          setSelectedInvoice(res.data);
                        });
                    }}
                    className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Run Simulation</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 border-t border-white/[0.06] pt-3">
              Policy POL-001: Variance &gt; 15% halts automated disbursement.
            </div>
          </div>
        </div>
      )}

      {/* Supplier Matrix & 3-Way Match Graph Tab */}
      {activeTab === 'graph' && (
        <VendorGraph
          vendors={vendors}
          onSelectVendor={() => {
            setActiveTab('vendors');
          }}
        />
      )}

      {/* OCR Split-Screen Inspector Modal */}
      {inspectorOpen && inspectingInvoice && (
        <InvoicePdfInspector
          invoice={inspectingInvoice}
          onClose={() => setInspectorOpen(false)}
          onApprove={() => {
            setInspectorOpen(false);
            setAuditModalOpen(true);
          }}
          onReject={() => {
            setInspectorOpen(false);
            setAuditModalOpen(true);
          }}
        />
      )}

      {/* Auditor Decision Modal */}
      {auditModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0F0F12] border border-white/[0.1] rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="text-sm font-semibold text-zinc-100">Auditor Authorization</div>
              <button onClick={() => setAuditModalOpen(false)} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyAuditDecision} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAuditDecision('APPROVED')}
                  className={`py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                    auditDecision === 'APPROVED'
                      ? 'bg-white/[0.08] text-zinc-50 border-white/[0.16]'
                      : 'bg-white/[0.02] text-zinc-400 border-white/[0.06]'
                  }`}
                >
                  Authorize & Disburse
                </button>
                <button
                  type="button"
                  onClick={() => setAuditDecision('REJECTED')}
                  className={`py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                    auditDecision === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-white/[0.02] text-zinc-400 border-white/[0.06]'
                  }`}
                >
                  Reject & Lock
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Audit Rationale</label>
                <textarea
                  rows={3}
                  value={auditRationale}
                  onChange={(e) => setAuditRationale(e.target.value)}
                  placeholder="Justification for approving this price variance..."
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setAuditModalOpen(false)}
                  className="h-7 px-3 rounded-md text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={auditDecisionMutation.isPending}
                  className="h-7 px-4 rounded-md text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition-all cursor-pointer"
                >
                  {auditDecisionMutation.isPending ? 'Committing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
