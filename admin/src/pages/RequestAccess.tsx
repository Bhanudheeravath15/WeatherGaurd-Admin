import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';
import { Send, Clock, Bot, RefreshCw, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const RequestAccess: React.FC = () => {
  const { user, logout, checkAuth } = useAuth();
  const { telegramInfo, loading: telegramLoading, error: telegramError, fetchToken } = useTelegram();
  const navigate = useNavigate();

  const [mockUsername, setMockUsername] = useState('');
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // If user is approved admin, send them to dashboard
    if (user.role === 'ADMIN' && user.status === 'APPROVED') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch telegram verification token upon mounting
  useEffect(() => {
    if (user) {
      fetchToken();
    }
  }, [user, fetchToken]);

  const handleRefresh = async () => {
    await checkAuth();
  };

  const handleSimulateConnection = async () => {
    if (!mockUsername.trim()) return;
    setSimulating(true);
    try {
      await api.post('/telegram/simulate-link', { username: mockUsername.trim() });
      await checkAuth(); // Refresh user state from backend
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  if (!user) return null;

  const isConnected = !!user.telegramChatId;

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-between py-12 px-4 relative">
      {/* Background glow */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-2xl w-full mx-auto backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-8 shadow-2xl flex-grow flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">Access Request</h1>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          {/* Status Alert Banner */}
          {user.status === 'PENDING' ? (
            <div className="flex gap-3 bg-amber-950/20 border border-amber-500/35 text-amber-200 p-4 rounded-xl mb-8">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Approval Pending</h3>
                <p className="text-xs text-amber-300/80 mt-1">
                  Your profile has been registered. An admin will review and manually approve your access request shortly. Once approved, you will begin receiving weather alerts.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 bg-red-950/20 border border-red-500/35 text-red-200 p-4 rounded-xl mb-8">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Request Declined</h3>
                <p className="text-xs text-red-300/80 mt-1">
                  Your access request has been rejected by an administrator. Please reach out to your administrator to request reconsideration.
                </p>
              </div>
            </div>
          )}

          {/* Telegram Connection Section */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Telegram Alert Linkage</h2>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                isConnected
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
              }`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            {isConnected ? (
              <div className="text-slate-300 space-y-3">
                <div className="flex items-center gap-2 text-xs bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 px-3 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Linked with username: <strong className="text-white">@{user.telegramUsername}</strong></span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your Telegram connection is established! You will receive weather forecast summaries directly in Telegram as soon as your access is approved by an administrator.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  To receive automated weather notifications, you must link your Telegram account. Generating a unique link bridges your active web profile directly with the Telegram service.
                </p>

                {telegramError && (
                  <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg">
                    {telegramError}
                  </div>
                )}

                {telegramLoading ? (
                  <div className="flex items-center justify-center py-4 text-slate-500 text-xs gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    Fetching integration tokens...
                  </div>
                ) : telegramInfo ? (
                  <div className="space-y-5">
                    {/* Token detail */}
                    <div className="flex flex-col gap-2 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <span>Verification Token</span>
                        <span>Expires in 15 mins</span>
                      </div>
                      <div className="text-lg font-mono text-center font-bold text-white tracking-widest bg-slate-950 py-1.5 rounded border border-slate-800">
                        {telegramInfo.token}
                      </div>
                    </div>

                    {/* standard Link button */}
                    <div className="space-y-2">
                      <a
                        href={telegramInfo.deepLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all active:scale-[0.98]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Open Telegram Bot & Start
                      </a>
                      <p className="text-[10px] text-slate-500 text-center">
                        This opens <strong className="text-slate-400">@{telegramInfo.botUsername}</strong>. Type <code className="text-[10px] bg-slate-900 px-1 py-0.5 rounded text-blue-400">/start</code> to initialize.
                      </p>
                    </div>

                    {/* Simulator Separator */}
                    <div className="relative w-full py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-850"></div>
                      </div>
                      <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-wider">
                        <span className="bg-[#0f172a] px-2.5 text-slate-600">Or Sandbox Connection Simulator</span>
                      </div>
                    </div>

                    {/* Simulator Input & Button */}
                    <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-850 rounded-xl">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Simulate Telegram Username
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. test_bot_handle"
                          value={mockUsername}
                          onChange={(e) => setMockUsername(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 h-[36px] text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSimulateConnection}
                        disabled={simulating || !mockUsername.trim()}
                        className="w-full bg-blue-650 hover:bg-blue-600 disabled:bg-slate-900 disabled:text-slate-655 text-white text-xs font-bold py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {simulating ? 'Linking...' : 'Connect Mock Telegram Account'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-800/40 pt-6">
          <p className="text-xs text-slate-500">
            Have you completed the steps and been approved?
          </p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Connection & Approval
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestAccess;
