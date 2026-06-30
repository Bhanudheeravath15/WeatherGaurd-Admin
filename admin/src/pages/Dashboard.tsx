import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, Clock, 
  Send, RefreshCw, LogOut, CheckCircle, 
  XCircle, CloudSun, Calendar, ShieldAlert
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    users, metrics, recentLogs, loading, error, 
    fetchUsers, fetchDashboardData, approveUser, rejectUser, triggerAlerts 
  } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [syncReport, setSyncReport] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Security check - Admins only
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      navigate('/request-access');
    }
  }, [user, navigate]);

  // Fetch initial dashboard metrics and logs
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch users list when active tab changes
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchUsers('PENDING');
    } else if (activeTab === 'approved') {
      fetchUsers('APPROVED');
    } else {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await approveUser(id);
      } else {
        await rejectUser(id);
      }
      // Refresh current table tab
      if (activeTab === 'pending') {
        fetchUsers('PENDING');
      } else if (activeTab === 'approved') {
        fetchUsers('APPROVED');
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncReport(null);
    try {
      const report = await triggerAlerts();
      setSyncReport(report);
      // Automatically clear report notice after 8 seconds
      setTimeout(() => setSyncReport(null), 8000);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 pb-16 px-4 md:px-8 relative">
      {/* Glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto pt-8">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/25 rounded-xl flex items-center justify-center">
              <CloudSun className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">WeatherGuard</h1>
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full font-bold">Admin Portal</span>
              </div>
              <p className="text-xs text-slate-400">Manage user access authorizations and monitor Telegram alert statuses</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2.5 text-right">
              <img 
                src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-slate-800"
              />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500">{user.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/30 border border-red-500/35 text-red-200 text-xs rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Manual Sync Trigger Report */}
        {syncReport && (
          <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-500/35 text-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-200">Manual Weather Alert Sync Completed</p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Processed {syncReport.total} users. Dispatched: <strong className="text-white">{syncReport.successCount} Successes</strong>, <strong className="text-red-400">{syncReport.failCount} Failures</strong>.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSyncReport(null)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg self-end sm:self-center"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Users */}
          <div className="backdrop-blur-md bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Users</p>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {metrics ? metrics.totalUsers : '--'}
              </h3>
            </div>
          </div>

          {/* Card 2: Pending Approvals */}
          <div className="backdrop-blur-md bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className={`w-10 h-10 border rounded-xl flex items-center justify-center ${
              metrics && metrics.pendingUsers > 0 
                ? 'bg-amber-950/40 border-amber-500/25 text-amber-400' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pending Users</p>
              <h3 className={`text-xl font-bold mt-0.5 ${metrics && metrics.pendingUsers > 0 ? 'text-amber-400' : 'text-white'}`}>
                {metrics ? metrics.pendingUsers : '--'}
              </h3>
            </div>
          </div>

          {/* Card 3: Connected Telegrams */}
          <div className="backdrop-blur-md bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Connected Bots</p>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {metrics ? metrics.connectedBots : '--'}
              </h3>
            </div>
          </div>

          {/* Card 4: Dispatched Alerts */}
          <div className="backdrop-blur-md bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Alerts Sent</p>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {metrics ? metrics.totalAlertsSent : '--'}
              </h3>
            </div>
          </div>
        </section>

        {/* Dashboard Actions Panel */}
        <section className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/60">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-slate-900 border border-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Approvals {metrics && metrics.pendingUsers > 0 && `(${metrics.pendingUsers})`}
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'approved'
                  ? 'bg-slate-900 border border-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Approved Users
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-900 border border-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Registered
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData()}
              className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all duration-150 active:scale-95"
              title="Refresh Metrics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-900 disabled:cursor-not-allowed border border-blue-500/20 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
            >
              {syncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Trigger Alert Dispatches
            </button>
          </div>
        </section>

        {/* Tables & Logs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Main Column: Users Table */}
          <div className="lg:col-span-2 backdrop-blur-md bg-slate-900/30 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">
              {activeTab === 'pending' && 'Pending Access Approvals'}
              {activeTab === 'approved' && 'Approved Systems'}
              {activeTab === 'all' && 'All Registered Database Accounts'}
            </h2>

            {loading ? (
              <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                Querying database accounts...
              </div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-800/80 rounded-xl text-slate-500">
                <CloudSun className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No users found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {activeTab === 'pending' && 'No accounts are pending approvals.'}
                  {activeTab === 'approved' && 'No approved users exist.'}
                  {activeTab === 'all' && 'The database contains no registered accounts.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3">User Details</th>
                      <th className="pb-3 hidden sm:table-cell">Source</th>
                      <th className="pb-3">Registered City</th>
                      <th className="pb-3">Telegram Username</th>
                      <th className="pb-3 text-right">Actions / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-950/20 transition-all">
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.email}`}
                              alt={u.name}
                              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-850"
                            />
                            <div>
                              <p className="font-semibold text-white leading-none">{u.name}</p>
                              <p className="text-[10px] text-slate-450 mt-1">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 hidden sm:table-cell text-slate-400 capitalize">{u.provider}</td>
                        <td className="py-3.5 text-slate-300 font-medium">📍 {u.location || 'New York'}</td>
                        <td className="py-3.5">
                          {u.telegramChatId ? (
                            <span className="text-emerald-400 bg-emerald-950/25 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold text-[10px]">
                              @{u.telegramUsername}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[10px]">Unlinked</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          {u.status === 'PENDING' ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleAction(u._id, 'approve')}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all active:scale-[0.93]"
                              >
                                <UserCheck className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(u._id, 'reject')}
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-650 hover:bg-red-650 text-white text-[10px] font-bold rounded-lg transition-all active:scale-[0.93]"
                              >
                                <UserX className="w-3 h-3" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              u.status === 'APPROVED' 
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                                : 'bg-red-950/20 border-red-500/30 text-red-400'
                            }`}>
                              {u.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Dispatch Logs */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">Recent Alert Logs</h2>
            
            {recentLogs.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-850 rounded-xl text-slate-500">
                <Send className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No logs recorded</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Dispatched alert details will report here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div key={log._id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img 
                          src={log.userId?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${log.userId?.email || 'system'}`} 
                          alt="user" 
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="font-semibold text-slate-200 truncate max-w-[120px]" title={log.userId?.email}>
                          {log.userId?.name || 'Unknown User'}
                        </span>
                      </div>
                      
                      <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-450'
                          : 'bg-red-950/30 border border-red-500/30 text-red-450'
                      }`}>
                        {log.status === 'SUCCESS' ? (
                          <>
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                            Sent
                          </>
                        ) : (
                          <>
                            <XCircle className="w-2.5 h-2.5 text-red-400" />
                            Failed
                          </>
                        )}
                      </span>
                    </div>

                    {log.weatherDetails ? (
                      <div className="flex justify-between text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded">
                        <span>🌡️ {log.weatherDetails.temp}°C</span>
                        <span className="font-semibold text-slate-300">{log.weatherDetails.condition}</span>
                        <span className="truncate max-w-[100px]">{log.weatherDetails.city}</span>
                      </div>
                    ) : log.errorMessage ? (
                      <div className="text-[10px] text-red-400 bg-red-950/15 p-2 rounded truncate" title={log.errorMessage}>
                        ⚠️ {log.errorMessage}
                      </div>
                    ) : null}

                    <div className="flex justify-between items-center text-[9px] text-slate-500 pt-0.5">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span>ID: ...{log.telegramChatId.slice(-6)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
