import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from './api';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSetupMode: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isSetupMode: false,
  refreshAuth: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSetupMode, setIsSetupMode] = useState(false);

  const refreshAuth = async () => {
    try {
      setLoading(true);
      // First check if the system is setup
      const statusRes = await authApi.status();
      setIsSetupMode(!statusRes.data.isSetup);

      if (statusRes.data.isSetup) {
        // Only try to fetch 'me' if it's already setup
        const meRes = await authApi.me();
        setUser(meRes.data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isSetupMode, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
