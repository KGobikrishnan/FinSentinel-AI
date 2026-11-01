// Strict TypeScript Models for FinSentinel AI

export type UserRole =
  | 'ROLE_CFO_ADMIN'
  | 'ROLE_FINANCE_AUDITOR'
  | 'ROLE_PROCUREMENT_MANAGER'
  | 'ROLE_VENDOR';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  enabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

// Double-Entry Ledger Engine Types
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type EntryType = 'DEBIT' | 'CREDIT';
export type JournalStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export interface Account {
  id: number;
  code: string;
  name: string;
  accountType: AccountType;
  currency: string;
  balance: number;
  active: boolean;
  description?: string;
  updatedAt: string;
}

export interface JournalLine {
  accountCode: string;
  accountName?: string;
  entryType: EntryType;
  amount: number;
  lineOrder?: number;
  memo?: string;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  referenceId?: string;
  postingDate: string;
  status: JournalStatus;
  memo?: string;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  lines: JournalLine[];
}

export interface JournalEntryRequest {
  referenceId?: string;
  postingDate: string;
  memo: string;
  lines: JournalLine[];
}

export interface TrialBalanceAccount {
  code: string;
  name: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalance {
  asOfDate: string;
  totalDebit: number;
  totalCredit: number;
  netImbalance: number;
  isBalanced: boolean;
  accounts: TrialBalanceAccount[];
}

// Smart Procurement & Anomaly Triage Types
export type TriageStatus = 'AUTO_APPROVED' | 'FLAGGED_FOR_AUDIT' | 'CRITICAL_ANOMALY';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: number;
  vendorId: number;
  vendorName: string;
  vendorRiskTier: string;
  invoiceNumber: string;
  invoiceDate: string;
  gstin: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  lineItems: InvoiceLineItem[];
  fraudRiskScore: number;
  triageStatus: TriageStatus;
  anomalyReasons: string[];
  journalEntryId?: number;
  journalEntryNumber?: string;
  createdAt: string;
}

export interface InvoiceCreateRequest {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  gstin: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  lineItems: InvoiceLineItem[];
}

export interface Vendor {
  id: number;
  name: string;
  gstin: string;
  taxId: string;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  totalInvoiced: number;
  historicalAvgUnitPrice: number;
  verified: boolean;
  createdAt: string;
}

export interface AuditDecisionRequest {
  decision: 'APPROVED' | 'REJECTED';
  rationale: string;
}

// AI Copilot & Tool Calling Types
export interface ToolExecutionRecord {
  toolName: string;
  description: string;
  arguments: Record<string, string | number | boolean>;
  result: unknown;
  executionTimeMs: number;
}

export interface ChartDataPayload {
  chartType: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  xAxisKey: string;
  seriesKeys: string[];
  data: Record<string, string | number>[];
}

export interface CopilotRequest {
  query: string;
  conversationId?: string;
  contextFilters?: string[];
}

export interface CopilotResponse {
  markdownResponse: string;
  executedTools: ToolExecutionRecord[];
  chartData?: ChartDataPayload;
  ragCitations: string[];
  timestamp: string;
}

// Real-Time Telemetry Types
export interface AnomalyAlert {
  invoiceId: number;
  invoiceNumber: string;
  vendorName: string;
  amount: number;
  fraudRiskScore: number;
  triageStatus: TriageStatus;
  anomalyReasons: string[];
  timestamp: string;
}

export interface CashflowTrendPoint {
  month: string;
  inflow: number;
  outflow: number;
  netBalance: number;
}

export interface SpendBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface CfoMetrics {
  netLiquidity: number;
  accountsReceivable: number;
  accountsPayable: number;
  totalInvoiced: number;
  highRiskExposure: number;
  fraudAnomalyCount: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  equityCapital: number;
  cashflowTrends: CashflowTrendPoint[];
  spendBreakdown: SpendBreakdownItem[];
  lastUpdated: string;
}
