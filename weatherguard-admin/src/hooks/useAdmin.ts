import { useState, useCallback } from 'react';
import api from '../services/api';
import type { User } from '../context/AuthContext';

export interface AlertLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  telegramChatId: string;
  status: 'SUCCESS' | 'FAILED';
  weatherDetails?: {
    temp: number;
    condition: string;
    description: string;
    city: string;
  };
  sentAt: string;
  errorMessage?: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  connectedBots: number;
  totalAlertsSent: number;
}

export const useAdmin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = status ? `/admin/users?status=${status}` : '/admin/users';
      const response = await api.get(url);
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/metrics');
      setMetrics(response.data.metrics);
      setRecentLogs(response.data.recentAlerts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch metrics data');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveUser = async (id: string) => {
    setError(null);
    try {
      await api.patch(`/admin/users/${id}/approve`);
      // Update local state lists
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status: 'APPROVED' } : u)));
      // Refresh metrics
      fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Approval failed');
      throw err;
    }
  };

  const rejectUser = async (id: string) => {
    setError(null);
    try {
      await api.patch(`/admin/users/${id}/reject`);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status: 'REJECTED' } : u)));
      fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rejection failed');
      throw err;
    }
  };

  const triggerAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/scheduler/trigger-alerts');
      // Refresh logs & metrics
      await fetchDashboardData();
      return response.data.report;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Manual alert dispatch failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    metrics,
    recentLogs,
    loading,
    error,
    fetchUsers,
    fetchDashboardData,
    approveUser,
    rejectUser,
    triggerAlerts,
  };
};
