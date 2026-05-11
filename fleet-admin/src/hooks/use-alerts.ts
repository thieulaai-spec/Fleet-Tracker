import { useState, useEffect, useCallback } from 'react';
import { Alert } from '@/types';
import { api } from '@/lib/api';
import { connectSocket, SOCKET_EVENTS } from '@/lib/socket';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Alert[]>('/alerts/active');
      setAlerts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveAlert = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}/resolve`, {});
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    let socket: any;

    const setupSocket = async () => {
      socket = await connectSocket();
      
      socket.on(SOCKET_EVENTS.ALERT_NEW, (newAlert: Alert) => {
        setAlerts(prev => [newAlert, ...prev]);
      });

      socket.on(SOCKET_EVENTS.ALERT_RESOLVED, (resolvedAlert: Alert) => {
        setAlerts(prev => prev.filter(a => a.id !== resolvedAlert.id));
      });
    };

    setupSocket();
    
    // Poll for new alerts every 60 seconds as fallback
    const interval = setInterval(fetchAlerts, 60000);
    
    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off(SOCKET_EVENTS.ALERT_NEW);
        socket.off(SOCKET_EVENTS.ALERT_RESOLVED);
      }
    };
  }, [fetchAlerts]);

  return {
    alerts,
    isLoading,
    error,
    resolveAlert,
    refreshAlerts: fetchAlerts,
  };
}
