import { create } from 'zustand';
import { Client, IMessage } from '@stomp/stompjs';
import { AnomalyAlert, CfoMetrics } from '../types';

interface TelemetryState {
  isConnected: boolean;
  alerts: AnomalyAlert[];
  unreadAlertCount: number;
  liveMetrics: CfoMetrics | null;
  client: Client | null;
  initWebSocket: () => void;
  disconnectWebSocket: () => void;
  acknowledgeAlert: (invoiceId: number) => void;
  clearAlerts: () => void;
  setLiveMetrics: (metrics: CfoMetrics) => void;
}

const initialAlerts: AnomalyAlert[] = [
  {
    invoiceId: 2,
    invoiceNumber: 'INV-NV-2026-9901',
    vendorName: 'Nova Cyberware Solutions',
    amount: 96760.0,
    fraudRiskScore: 78,
    triageStatus: 'FLAGGED_FOR_AUDIT',
    anomalyReasons: [
      'Unit price $16,400.00 represents a 105.0% variance over historical benchmark of $8,000.00',
      'High vendor risk tier: HIGH',
    ],
    timestamp: new Date().toISOString(),
  },
];

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  isConnected: false,
  alerts: initialAlerts,
  unreadAlertCount: 1,
  liveMetrics: null,
  client: null,

  initWebSocket: () => {
    if (get().client) return;

    // Use WebSocket directly or SockJS fallback
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const brokerURL = `${protocol}//${window.location.host}/ws-raw`;

    const stompClient = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        set({ isConnected: true });

        // 1. Subscribe to Live Anomaly Alerts
        stompClient.subscribe('/topic/anomaly-alerts', (message: IMessage) => {
          try {
            const alert = JSON.parse(message.body) as AnomalyAlert;
            set((state) => ({
              alerts: [alert, ...state.alerts.filter((a) => a.invoiceId !== alert.invoiceId)],
              unreadAlertCount: state.unreadAlertCount + 1,
            }));
          } catch (err) {
            console.error('Failed to parse anomaly alert payload', err);
          }
        });

        // 2. Subscribe to Periodic CFO Dashboard Metrics
        stompClient.subscribe('/topic/dashboard-metrics', (message: IMessage) => {
          try {
            const metrics = JSON.parse(message.body) as CfoMetrics;
            set({ liveMetrics: metrics });
          } catch (err) {
            console.error('Failed to parse telemetry metrics', err);
          }
        });
      },
      onDisconnect: () => {
        set({ isConnected: false });
      },
      onStompError: (frame) => {
        console.warn('STOMP broker reported error: ' + frame.headers['message']);
      },
    });

    try {
      stompClient.activate();
      set({ client: stompClient });
    } catch (e) {
      console.warn('WebSocket connection attempt failed, will retry in background', e);
    }
  },

  disconnectWebSocket: () => {
    const { client } = get();
    if (client) {
      client.deactivate();
      set({ client: null, isConnected: false });
    }
  },

  acknowledgeAlert: (invoiceId: number) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.invoiceId !== invoiceId),
      unreadAlertCount: Math.max(0, state.unreadAlertCount - 1),
    }));
  },

  clearAlerts: () => {
    set({ alerts: [], unreadAlertCount: 0 });
  },

  setLiveMetrics: (metrics: CfoMetrics) => {
    set({ liveMetrics: metrics });
  },
}));
