import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Building2,
  X,
  FileCheck,
  RefreshCw,
  ArrowRight,
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
        setUploadError('Only PDF format invoices are supported for automated PDFBox parsing.');
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
    if (statusFilter === 'ALL') return true;
    return inv.triageStatus === statusFilter;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Procurement Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hairline-card p-2.5 rounded-xl">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'bg-white/[0.08] text-zinc-100 shadow-specular'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            Invoice Triage ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`h-7 px-3 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'upload'
                ? 'bg-white/[0.08] text-zinc-100 shadow-specular'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
            <span>Upload Invoice</span>
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`h-7 px-3 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'vendors'
                ? 'bg-white/[0.08] text-zinc-100 shadow-specular'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Vendors ({vendors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`h-7 px-3 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'graph'
                ? 'bg-white/[0.08] text-zinc-100 shadow-specular'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Supplier Matrix</span>
          </button>
        </div>

        {activeTab === 'invoices' && (
          <div className="flex items-center space-x-1 bg-white/[0.02] p-0.5 rounded-md border border-white/[0.06] text-[10px] font-mono">
            {(['ALL', 'AUTO_APPROVED', 'FLAGGED_FOR_AUDIT', 'CRITICAL_ANOMALY'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 rounded transition-colors ${
                  statusFilter === s
                    ? 'bg-white/[0.08] text-zinc-100 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: Invoices High-Density Table */}
      {activeTab === 'invoices' && (
        <div className="hairline-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/[0.04]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Invoice #</th>
                  <th className="py-2.5 px-4 font-medium font-sans">Vendor & GSTIN</th>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 text-right font-medium">Subtotal</th>
                  <th className="py-2.5 px-4 text-right font-medium">GST (18%)</th>
                  <th className="py-2.5 px-4 text-right font-medium">Total</th>
                  <th className="py-2.5 px-4 text-center font-medium">Risk Score</th>
                  <th className="py-2.5 px-4 font-medium">Triage Status</th>
                  <th className="py-2.5 px-4 text-center font-medium">Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[11px]">
                {isLoadingInvoices ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-500 font-sans">
                      Loading invoice triage records...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-500 font-sans">
                      No invoices found in current filter.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-zinc-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-medium text-zinc-200">{inv.vendorName}</div>
                        <div className="text-[10px] font-mono text-zinc-500">{inv.gstin}</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 tabular-nums">{inv.invoiceDate}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-300">
                        ${inv.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                        ${(inv.cgst + inv.sgst + inv.igst).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-zinc-100 tabular-nums">
                        ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] tabular-nums font-semibold ${
                            inv.fraudRiskScore >= 75
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : inv.fraudRiskScore >= 30
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {inv.fraudRiskScore}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 text-[10px] ${
                            inv.triageStatus === 'AUTO_APPROVED'
                              ? 'text-emerald-400'
                              : inv.triageStatus === 'FLAGGED_FOR_AUDIT'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inv.triageStatus === 'AUTO_APPROVED'
                                ? 'bg-emerald-500'
                                : inv.triageStatus === 'FLAGGED_FOR_AUDIT'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>{inv.triageStatus.replace(/_/g, ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {inv.journalEntryNumber ? (
                          <span className="text-[10px] text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                            {inv.journalEntryNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-600">Escrow</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Upload PDF & Simulation Area */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="hairline-card p-5 rounded-xl space-y-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
                PDF Invoice Parsing
              </div>
              <div className="text-sm font-semibold text-zinc-100 tracking-tight mt-0.5">
                Apache PDFBox 3.x Extraction
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Drag and drop vendor invoices. Structured line items, tax fields, and GSTIN are automatically extracted.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={`border border-dashed rounded-xl p-8 text-center transition-all ${
                uploadFile
                  ? 'border-zinc-400 bg-white/[0.03]'
                  : 'border-white/[0.08] hover:border-white/[0.16] bg-white/[0.01]'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              {uploadFile ? (
                <div className="space-y-1">
                  <div className="font-mono text-xs font-semibold text-zinc-200">{uploadFile.name}</div>
                  <div className="text-[11px] text-zinc-500">{(uploadFile.size / 1024).toFixed(1)} KB &bull; PDF verified</div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-zinc-300">Drop invoice PDF here</div>
                  <div className="text-[11px] text-zinc-500">or click below to browse</div>
                </div>
              )}

              <input
                type="file"
                accept="application/pdf"
                id="file-upload"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                    setUploadError(null);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-3 px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.04] text-zinc-300 hover:text-white border border-white/[0.08] cursor-pointer transition-colors"
              >
                Select File
              </label>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
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

          {/* Quick Simulation Cards */}
          <div className="hairline-card p-5 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
                Simulated Test Payloads
              </div>
              <div className="text-sm font-semibold text-zinc-100 tracking-tight mt-0.5">
                Synthetic Invariant Verification
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

      {/* VIEW 3: Vendor Directory */}
      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {vendors.map((v) => (
            <div key={v.id} className="hairline-card p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">{v.gstin}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    v.riskTier === 'LOW'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : v.riskTier === 'MEDIUM'
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {v.riskTier}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-zinc-100">{v.name}</div>
                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{v.taxId}</div>
              </div>

              <div className="pt-2 border-t border-white/[0.04] space-y-1 text-xs font-mono">
                <div className="flex justify-between text-zinc-500">
                  <span>Total Invoiced:</span>
                  <span className="text-zinc-200 font-medium tabular-nums">
                    ${v.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Benchmark Unit:</span>
                  <span className="text-zinc-200 font-medium tabular-nums">
                    ${v.historicalAvgUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}
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

      {/* Invoice Detail Drawer */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0F0F12] border-l border-white/[0.08] h-full p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-500">
                  Invoice Forensic Report
                </div>
                <div className="text-base font-semibold text-zinc-100 font-mono mt-0.5">
                  {selectedInvoice.invoiceNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Risk Indicator Card */}
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Calculated Risk Index</div>
                <div className="text-xl font-semibold font-mono text-zinc-100 tabular-nums mt-0.5">
                  {selectedInvoice.fraudRiskScore} <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                </div>
              </div>

              <span
                className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                  selectedInvoice.triageStatus === 'AUTO_APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {selectedInvoice.triageStatus.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Anomaly Reasons */}
            {selectedInvoice.anomalyReasons && selectedInvoice.anomalyReasons.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-500/[0.04] border border-rose-500/10 space-y-1.5">
                <div className="text-xs font-medium text-rose-300">Detected Variances</div>
                {selectedInvoice.anomalyReasons.map((reason, idx) => (
                  <div key={idx} className="text-xs text-rose-200/80 font-mono text-[11px] leading-relaxed">
                    &bull; {reason}
                  </div>
                ))}
              </div>
            )}

            {/* Line Items */}
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Line Items</div>
              <div className="space-y-1">
                {selectedInvoice.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-sans text-zinc-200">{item.description}</div>
                      <div className="text-[10px] text-zinc-500">
                        {item.quantity} &times; ${item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-semibold text-zinc-100 tabular-nums">
                      ${item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Ledger Auto-Disbursement Status */}
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs font-mono space-y-1">
              <div className="text-zinc-500 text-[10px] uppercase">Ledger Settlement</div>
              {selectedInvoice.journalEntryNumber ? (
                <div className="text-emerald-400 font-medium">
                  Posted under {selectedInvoice.journalEntryNumber} (Debit 5010, Credit 2010)
                </div>
              ) : (
                <div className="text-zinc-400">
                  Escrow locked. Disbursement pending forensic auditor authorization.
                </div>
              )}
            </div>

            {/* Inspect OCR Document with Bounding Boxes */}
            <button
              onClick={() => {
                setInspectingInvoice(selectedInvoice);
                setInspectorOpen(true);
              }}
              className="w-full h-8 rounded-md text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inspect OCR & Bounding Boxes</span>
            </button>

            {!selectedInvoice.journalEntryId && (
              <button
                onClick={() => setAuditModalOpen(true)}
                className="w-full h-8 rounded-md text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition-all cursor-pointer shadow-sm"
              >
                Perform Auditor Override
              </button>
            )}
          </div>
        </div>
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
