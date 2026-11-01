import React, { useState } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Scan,
  ZoomIn,
  ZoomOut,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Invoice } from '../types';

interface InvoicePdfInspectorProps {
  invoice: Invoice | null;
  onClose: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export const InvoicePdfInspector: React.FC<InvoicePdfInspectorProps> = ({
  invoice,
  onClose,
  onApprove,
  onReject,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [highlightAnomalies, setHighlightAnomalies] = useState<boolean>(true);

  if (!invoice) return null;

  const isAnomalous = invoice.fraudRiskScore >= 30;
  const lineItem = invoice.lineItems?.[0] || {
    description: 'Cloud Infrastructure HPC Nodes (Cluster-9)',
    quantity: 24,
    unitPrice: 1850.0,
    totalPrice: 44400.0,
  };
  const taxSum = invoice.cgst + invoice.sgst + invoice.igst;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-6xl h-[90vh] bg-[#09090B] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Top Specular Toolbar */}
        <div className="h-14 px-6 border-b border-white/[0.06] bg-[#0D0D10] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-300">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-zinc-100 tracking-tight">
                  {invoice.invoiceNumber}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-400">{invoice.vendorName}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isAnomalous
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {isAnomalous ? `FLAGGED: ${invoice.fraudRiskScore}/100 RISK` : 'CLEAN / VERIFIED'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                PDFBox 3.x OCR Text Extraction • Hash: a89c92f1b04e67cd
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-zinc-900/60 border border-white/[0.06] text-xs font-mono text-zinc-400">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                className="p-1 hover:text-zinc-200"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 tabular-nums text-zinc-300">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                className="p-1 hover:text-zinc-200"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toggle Highlight */}
            <button
              onClick={() => setHighlightAnomalies(!highlightAnomalies)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition ${
                highlightAnomalies
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-white/[0.06]'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Bounding Overlays</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Split View Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left: Interactive Simulated Document Page (7 cols) */}
          <div className="lg:col-span-7 bg-[#050507] p-6 overflow-y-auto flex items-center justify-center border-r border-white/[0.06]">
            <div
              className="relative w-full max-w-xl bg-white text-zinc-900 rounded-lg shadow-2xl p-8 font-sans transition-transform duration-200 select-none"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                minHeight: '620px',
              }}
            >
              {/* Document Header */}
              <div className="flex justify-between items-start pb-6 border-b border-zinc-200">
                <div>
                  <div className="text-xl font-bold tracking-tight text-zinc-950">
                    {invoice.vendorName.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    GSTIN: {invoice.gstin || '27AABCS1429B1Z8'}
                  </div>
                  <div className="text-[11px] text-zinc-500">Corporate Enterprise Hub, Floor 9</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-zinc-800">TAX INVOICE</div>
                  <div className="text-xs font-mono text-zinc-600 mt-1">
                    Invoice #: <span className="font-semibold">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="text-xs text-zinc-500">Date: {invoice.invoiceDate || '2026-10-24'}</div>
                </div>
              </div>

              {/* Bill To */}
              <div className="py-4 text-xs text-zinc-600 grid grid-cols-2 gap-4 border-b border-zinc-100">
                <div>
                  <div className="font-semibold text-zinc-800">Billed To:</div>
                  <div>FinSentinel Global Operations Corp</div>
                  <div className="font-mono text-[11px]">GSTIN: 33AAAAF0000A1Z5</div>
                </div>
                <div>
                  <div className="font-semibold text-zinc-800">Payment Terms:</div>
                  <div>Net 30 Days via Wire Transfer</div>
                  <div>Currency: USD / INR Statutory</div>
                </div>
              </div>

              {/* Line Items Table with Forensic Highlight Overlays */}
              <div className="py-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 font-semibold text-[11px] text-left">
                      <th className="pb-2">ITEM DESCRIPTION</th>
                      <th className="pb-2 text-center">QTY</th>
                      <th className="pb-2 text-right">UNIT PRICE</th>
                      <th className="pb-2 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-mono text-[11.5px]">
                    <tr className="relative">
                      <td className="py-2.5 font-sans text-zinc-800">
                        {lineItem.description}
                      </td>
                      <td className="py-2.5 text-center text-zinc-600">
                        {lineItem.quantity}
                      </td>
                      <td className="py-2.5 text-right text-zinc-800 font-semibold">
                        ${lineItem.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-right font-bold text-zinc-950">
                        ${lineItem.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Simulated Bounding Box for Detected Surge */}
                {highlightAnomalies && isAnomalous && (
                  <div className="mt-2 p-2 rounded border-2 border-dashed border-rose-500 bg-rose-50/80 text-rose-900 text-xs flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-semibold">POL-001 Detected: +18.4% Unit Price Inflation Surge</span>
                    </div>
                    <span className="font-mono text-[11px] bg-rose-200 px-1.5 py-0.5 rounded text-rose-800">
                      OCR Conf: 99.4%
                    </span>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-zinc-200 flex justify-end">
                <div className="w-56 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>GST (18% Invariant):</span>
                    <span>${taxSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-950 font-bold text-sm pt-1 border-t border-zinc-300">
                    <span>Invoice Total:</span>
                    <span>${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Watermark */}
              <div className="mt-12 pt-4 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                <span>DIGITALLY SIGNED & VERIFIED BY SENTINEL AI AGENT</span>
                <span>SHA256: 7f83b165...4b12</span>
              </div>
            </div>
          </div>

          {/* Right: Forensic Synthesis & Decision Panel (5 cols) */}
          <div className="lg:col-span-5 bg-[#0A0A0D] p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-500 font-medium">
                  Forensic Audit Dossier
                </span>
                <h3 className="text-base font-semibold text-zinc-100 tracking-tight mt-0.5">
                  Automated Extraction & Rule Evaluation
                </h3>
              </div>

              {/* Anomaly Callout */}
              <div
                className={`p-4 rounded-xl border ${
                  isAnomalous
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isAnomalous ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-semibold text-xs tracking-tight">
                    {isAnomalous ? 'INTERCEPTED FRAUD ANOMALY' : 'STATUTORY COMPLIANCE CONFIRMED'}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-300 mt-2 leading-relaxed">
                  {invoice.anomalyReasons?.[0] || 'All vendor line-item rates match contractual 90-day benchmarks.'}
                </p>
              </div>

              {/* Forensic Details List */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04] flex justify-between items-center">
                  <span className="text-zinc-400">90-Day Benchmark Unit Price</span>
                  <span className="font-mono text-zinc-200 tabular-nums">
                    ${(lineItem.unitPrice * 0.84).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04] flex justify-between items-center">
                  <span className="text-zinc-400">Invoiced Unit Price</span>
                  <span className="font-mono text-zinc-200 tabular-nums">
                    ${lineItem.unitPrice.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04] flex justify-between items-center">
                  <span className="text-zinc-400">Calculated Rate Variance</span>
                  <span className={`font-mono tabular-nums font-semibold ${isAnomalous ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isAnomalous ? '+18.4% (Threshold: 15.0%)' : '+1.2% (Normal)'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04] flex justify-between items-center">
                  <span className="text-zinc-400">Statutory GST Rate Check</span>
                  <span className="font-mono text-emerald-400 font-medium">18.00% EXACT MATCH</span>
                </div>
              </div>

              {/* Ledger Preview */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-zinc-500">
                  Target Double-Entry Journal Posting Preview
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-300">
                    <span>DR 5010 - Tech Infrastructure</span>
                    <span className="text-emerald-400 tabular-nums">
                      +${invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>DR 1020 - Input GST Receivable</span>
                    <span className="text-emerald-400 tabular-nums">
                      +${taxSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-300 border-t border-white/[0.06] pt-1">
                    <span>CR 2010 - Accounts Payable ({invoice.vendorName})</span>
                    <span className="text-zinc-400 tabular-nums">
                      -${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Auditor Actions Footer */}
            <div className="pt-4 border-t border-white/[0.06] flex items-center space-x-2">
              {onReject && (
                <button
                  onClick={() => onReject(invoice.id)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                >
                  Block & Reject Invoice
                </button>
              )}
              {onApprove && (
                <button
                  onClick={() => onApprove(invoice.id)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Disburse to Ledger</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
