import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CloudSun, Github, AlertCircle, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const { user, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Listen for GitHub code in query parameters or Google id_token in hash parameters
  useEffect(() => {
    // Check for GitHub callback: ?code=XYZ
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setError(null);
      setIsSubmitting(true);
      
      // Clean query parameter from browser address bar
      window.history.replaceState({}, document.title, window.location.pathname);
      
      loginWithGithub(code)
        .catch((err: any) => {
          setError(err.response?.data?.message || 'GitHub OAuth verification failed. Check backend credentials.');
        })
        .finally(() => {
          setIsSubmitting(false);
        });
      return;
    }

    // Check for Google callback: #id_token=XYZ (OIDC implicit flow)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1)); // strip '#'
      const idToken = hashParams.get('id_token');
      if (idToken) {
        setError(null);
        setIsSubmitting(true);
        
        // Clean hash parameters from browser address bar
        window.history.replaceState({}, document.title, window.location.pathname);
        
        loginWithGoogle(idToken)
          .catch((err: any) => {
            setError(err.response?.data?.message || 'Google OAuth verification failed. Check backend credentials.');
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      }
    }
  }, [loginWithGoogle, loginWithGithub]);

  // 2. Redirect to dashboard if logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/request-access');
      }
    }
  }, [user, navigate]);

  // 3. Trigger Google OAuth2 redirect flow directly (or simulator if unconfigured)
  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || window.location.origin + '/login';

    setError(null);
    
    // Choose between official Google or local simulator
    const isConfigured = clientId && !clientId.includes('YOUR_GOOGLE_CLIENT_ID') && clientId !== '';
    const googleAuthUrl = isConfigured 
      ? 'https://accounts.google.com/o/oauth2/v2/auth'
      : 'http://localhost:3000/api/oauth/google';

    window.location.href = `${googleAuthUrl}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=id_token&scope=openid%20profile%20email&nonce=weatherguard_nonce`;
  };

  // 4. Trigger GitHub OAuth2 redirect flow directly (or simulator if unconfigured)
  const handleGithubClick = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;

    setError(null);

    // Choose between official GitHub or local simulator
    const isConfigured = clientId && !clientId.includes('YOUR_GITHUB_CLIENT_ID') && clientId !== '';
    const githubAuthUrl = isConfigured 
      ? 'https://github.com/login/oauth/authorize'
      : 'http://localhost:3000/api/oauth/github';

    window.location.href = `${githubAuthUrl}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=user:email`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] px-4 relative">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Login Card */}
      <div className="max-w-md w-full backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600/15 rounded-xl border border-blue-500/30 flex items-center justify-center mb-4">
            <CloudSun className="w-10 h-10 text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            Weather<span className="text-blue-500">Guard</span>
          </h1>
          <p className="text-slate-400 text-sm text-center">
            Secure, Invite-Only Weather Alert Dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-900/35 border border-red-500/50 text-red-200 text-xs rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 text-slate-400 text-sm">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p>Connecting with server auth module...</p>
          </div>
        ) : (
          <div className="space-y-6 flex flex-col items-center w-full">
            
            {/* Google Sign-in Button */}
            <button
              onClick={handleGoogleClick}
              className="w-full max-w-[320px] flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 text-slate-900 font-semibold h-[44px] rounded-full text-xs transition-all duration-200 shadow-md active:scale-95 border border-transparent cursor-pointer"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
                alt="Google" 
                className="w-4 h-4"
              />
              Sign In with Google
            </button>

            {/* Divider */}
            <div className="relative w-full max-w-[320px] my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-[#0b0f19] px-3 text-slate-500 font-extrabold">Or</span>
              </div>
            </div>

            {/* GitHub Sign-in Button */}
            <button
              onClick={handleGithubClick}
              className="w-full max-w-[320px] flex items-center justify-center gap-2 bg-[#24292e] hover:bg-[#2f363d] text-white font-semibold h-[44px] rounded-full text-xs transition-all duration-200 shadow-md active:scale-95 border border-slate-700/85 cursor-pointer"
            >
              <Github className="w-4 h-4" />
              Sign In with GitHub
            </button>

          </div>
        )}

        {/* Footer notice */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 border-t border-slate-800/50 pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Encrypted social validation protocols</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
