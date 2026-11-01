import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Bot,
  User as UserIcon,
  Sparkles,
  Zap,
  BookOpen,
  RefreshCw,
  Scale,
  CornerDownLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { apiClient } from '../api/client';
import { CopilotResponse, CopilotRequest, ToolExecutionRecord, ChartDataPayload } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  tools?: ToolExecutionRecord[];
  chart?: ChartDataPayload;
  citations?: string[];
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-init',
    sender: 'assistant',
    content: `### FinSentinel Autonomous FinOps Copilot

Autonomous financial reasoning backed by **pgvector RAG** over statutory procurement policies and **safe read-only MCP tool execution** across our ACID general ledger.

Common operational queries:
- **Ledger Invariants:** *"Show general ledger balance summary"*
- **Vendor Concentration:** *"Audit top vendors by cumulative spend"*
- **Fraud Anomaly Interception:** *"Find flagged anomalies with score >= 30"*
- **Statutory GST Validation:** *"Verify GST compliance for 27AABCS1429B1Z8"*`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const QUICK_PROMPTS = [
  'Audit top 5 vendors by spend',
  'Show full General Ledger balance summary',
  'Find flagged anomalies with score >= 30',
  'Verify GST compliance for 27AABCS1429B1Z8',
  'Explain 15% price variance threshold policy',
];

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

const CopilotChartTooltip: React.FC<CustomChartTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#09090B]/95 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg shadow-2xl text-xs font-mono">
        <div className="text-[11px] text-zinc-400">{label}</div>
        <div className="text-zinc-100 font-semibold tabular-nums mt-0.5">
          ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
    );
  }
  return null;
};

export const FinSentinelCopilot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');

  const askMutation = useMutation({
    mutationFn: async (payload: CopilotRequest) => {
      const res = await apiClient.post<CopilotResponse>('/copilot/ask', payload);
      return res.data;
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: 'msg-' + Date.now(),
        sender: 'assistant',
        content: data.markdownResponse,
        tools: data.executedTools,
        chart: data.chartData,
        citations: data.ragCitations,
        timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      const assistantError: Message = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        content: `**Agent Execution Error:** ${
          axiosError.response?.data?.detail || 'Could not complete copilot query execution.'
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantError]);
    },
  });

  const handleSend = (queryText?: string) => {
    const text = queryText || inputValue;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    askMutation.mutate({ query: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in">
      {/* 1. Page Header (Finnova Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5847F6] to-[#7B68EE] shadow-md shadow-indigo-500/25 flex items-center justify-center text-white font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900 leading-tight">
              FinOps AI Copilot
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Spring AI pgvector corporate policy RAG & safe Model Context Protocol (MCP) tool calling.
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages(INITIAL_MESSAGES)}
          className="h-9 px-4 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 hover:text-indigo-600 shadow-sm transition-all"
        >
          Reset Session
        </button>
      </div>

      {/* Main Chat Dock */}
      <div className="flex flex-col h-[650px] finnova-dock-shell overflow-hidden text-white">
        {/* Copilot Header */}
        <div className="h-12 px-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">Forensic FinOps Agent</span>
            <span className="text-[10px] font-mono text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full bg-indigo-500/20">
              MCP Active
            </span>
          </div>

          <span className="text-[11px] font-mono text-zinc-400">
            pgvector Cosine Distance
          </span>
        </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-zinc-800/90 text-zinc-100 border border-white/[0.08] font-medium shadow-sm'
                  : 'bg-white/[0.02] border border-white/[0.06] text-zinc-200'
              }`}
            >
              {/* Content text */}
              <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap font-sans text-zinc-200">
                {msg.content}
              </div>

              {/* MCP Tool Execution Telemetry */}
              {msg.tools && msg.tools.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-white/[0.06] space-y-1.5">
                  <div className="text-[10px] uppercase font-mono text-zinc-400 font-medium flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-zinc-400" />
                    <span>Safe MCP Tool Executions ({msg.tools.length})</span>
                  </div>
                  <div className="space-y-1">
                    {msg.tools.map((t, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded-md bg-black/40 border border-white/[0.04] text-[11px] font-mono flex items-center justify-between text-zinc-300"
                      >
                        <span className="text-zinc-200 font-semibold">{t.toolName}()</span>
                        <span className="text-[10px] text-zinc-500 tabular-nums">{t.executionTimeMs}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline Dynamic Recharts */}
              {msg.chart && msg.chart.data && msg.chart.data.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="text-xs font-medium text-zinc-200 flex items-center space-x-1.5">
                    <Scale className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{msg.chart.title}</span>
                  </div>

                  <div className="h-52 w-full bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={msg.chart.data} margin={{ top: 8, right: 8, left: -24, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                          dataKey={msg.chart.xAxisKey}
                          stroke="#52525B"
                          fontSize={9}
                          tickLine={false}
                          angle={-15}
                          textAnchor="end"
                          fontFamily="JetBrains Mono"
                        />
                        <YAxis stroke="#52525B" fontSize={9} tickLine={false} fontFamily="JetBrains Mono" />
                        <Tooltip content={<CopilotChartTooltip />} />
                        <Bar
                          dataKey={msg.chart.seriesKeys[0]}
                          fill="#D4D4D8"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* RAG Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-white/[0.06] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-zinc-500 font-medium flex items-center space-x-1">
                    <BookOpen className="w-3 h-3 text-zinc-500" />
                    <span>Policy Citations</span>
                  </div>
                  <div className="space-y-1">
                    {msg.citations.map((c, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] font-mono text-zinc-400 bg-black/30 p-2 rounded border border-white/[0.04]"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 text-[10px] text-right font-mono text-zinc-600 tabular-nums">
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-md bg-zinc-700/60 border border-white/[0.1] flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {askMutation.isPending && (
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
              <span>Synthesizing ledger tools and policy RAG vectors...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts Bar */}
      <div className="px-4 py-2 bg-white/[0.01] border-t border-white/[0.06] flex items-center space-x-1.5 overflow-x-auto">
        <span className="text-[10px] font-mono uppercase text-zinc-600 shrink-0 mr-1">
          Suggestions:
        </span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            disabled={askMutation.isPending}
            className="text-[11px] font-mono whitespace-nowrap px-2.5 py-1 rounded-md bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Raycast-Style Prompt Input */}
      <div className="p-3 bg-[#0D0D10] border-t border-white/[0.06]">
        <div className="flex items-center space-x-2 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 focus-within:border-white/[0.2] transition-colors">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about ledger balances, vendor spend, GST validation, or policies..."
            disabled={askMutation.isPending}
            className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || askMutation.isPending}
            className="h-7 px-2.5 rounded text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-20 transition-all flex items-center space-x-1 cursor-pointer"
          >
            <span>Ask</span>
            <CornerDownLeft className="w-3 h-3 text-zinc-600" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
