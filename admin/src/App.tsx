import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RequestAccess from './pages/RequestAccess';
import Dashboard from './pages/Dashboard';
import { RefreshCw } from 'lucide-react';

// Protected Route Guard (Checks if user is logged in)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center text-slate-400 text-sm gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        Checking authentication session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Guard (Requires user to be APPROVED and role = ADMIN)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center text-slate-400 text-sm gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        Checking admin access credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN' || user.status !== 'APPROVED') {
    return <Navigate to="/request-access" replace />;
  }

  return <>{children}</>;
};

// Main Routing Component
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center text-slate-400 text-sm gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        Initializing WeatherGuard...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route 
        path="/request-access" 
        element={
          <ProtectedRoute>
            <RequestAccess />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/dashboard" 
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        } 
      />

      {/* Catch-all route */}
      <Route 
        path="*" 
        element={
          user 
            ? user.role === 'ADMIN' && user.status === 'APPROVED'
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/request-access" replace />
            : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
