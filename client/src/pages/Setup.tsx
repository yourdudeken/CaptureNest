import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Setup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshAuth } = useAuth();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords don't match");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    
    setLoading(true);

    try {
      await authApi.setup({ username, password });
      await refreshAuth();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Initialization</h1>
          <p className="text-sm text-gray-400 mt-2">
            Welcome to CaptureNest! Set up your primary administrator account to secure this instance.
          </p>
        </div>

        <form onSubmit={handleSetup} className="bg-surface-elevated border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin Username</label>
            <input
              type="text"
              autoFocus
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all font-mono"
              placeholder="e.g. admin"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Secure Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all font-mono"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all font-mono"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full !mt-6 btn-primary py-3 rounded-xl disabled:opacity-50 group flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure System'}
          </button>
        </form>
      </div>
    </div>
  );
}
