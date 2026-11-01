import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { CfoDashboard } from './pages/CfoDashboard';
import { LedgerExplorer } from './pages/LedgerExplorer';
import { SmartProcurement } from './pages/SmartProcurement';
import { FinSentinelCopilot } from './pages/FinSentinelCopilot';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('cfo-dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'cfo-dashboard' && <CfoDashboard onNavigate={setActiveTab} />}
        {activeTab === 'ledger-explorer' && <LedgerExplorer />}
        {activeTab === 'smart-procurement' && <SmartProcurement />}
        {activeTab === 'finsentinel-copilot' && <FinSentinelCopilot />}
      </Layout>
    </QueryClientProvider>
  );
};

export default App;
