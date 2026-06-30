import { useState, useCallback } from 'react';
import api from '../services/api';

export interface TelegramInfo {
  token: string;
  botUsername: string;
  deepLink: string;
  isMockTelegram: boolean;
}

export const useTelegram = () => {
  const [telegramInfo, setTelegramInfo] = useState<TelegramInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/telegram/token');
      setTelegramInfo(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch Telegram integration details');
    } finally {
      setLoading(false);
    }
  }, []);

  const simulateBotConnection = async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/telegram/mock-connect', { username });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mock Telegram link failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    telegramInfo,
    loading,
    error,
    fetchToken,
    simulateBotConnection,
  };
};
