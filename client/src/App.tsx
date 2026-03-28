import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Camera from './pages/Camera';
import Library from './pages/Library';
import Search from './pages/Search';
import Settings from './pages/Settings';
import MediaDetail from './pages/MediaDetail';
import Login from './pages/Login';
import Setup from './pages/Setup';
import { useAuth } from './lib/AuthContext';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSetupMode } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (isSetupMode) return <Navigate to="/setup" replace />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSetupMode } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (isSetupMode) return <Navigate to="/setup" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

export default function App() {
  const { isSetupMode, loading, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route 
        path="/setup" 
        element={
          loading ? (
            <div className="h-screen w-screen flex items-center justify-center bg-surface">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : isSetupMode ? <Setup /> : user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/camera"      element={<Camera />} />
        <Route path="/library"     element={<Library />} />
        <Route path="/library/:id" element={<MediaDetail />} />
        <Route path="/search"      element={<Search />} />
        <Route path="/settings"    element={<Settings />} />
      </Route>
    </Routes>
  );
}
