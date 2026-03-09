import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './styles/App.css';
import './styles/QRCode.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Auth from './pages/Auth';
import Capture from './pages/Capture';
import Gallery from './pages/Gallery';
import QRLogin from './pages/QRLogin';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

// Simple SVG Icons
const Icons = {
  Home: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Gallery: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Camera: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Sun: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Moon: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
};

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/auth');
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <Icons.Home />, exact: true },
    { path: '/gallery', label: 'Gallery', icon: <Icons.Gallery /> },
    { path: '/capture', label: 'Camera', icon: <Icons.Camera /> },
    { path: '/settings', label: 'Menu', icon: <Icons.Menu /> },
  ];

  const isCapturePage = location.pathname === '/capture';
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="App">
      {/* Top Bar - Hidden on Capture and Auth */}
      {user && !isCapturePage && !isAuthPage && (
        <header className="app-top-bar">
          <div className="top-bar-left">
            {/* Header text changes based on route */}
            <span className="page-title">
              {location.pathname === '/' ? 'Home' :
                location.pathname === '/gallery' ? 'Albums' :
                  location.pathname === '/settings' ? 'Settings' : 'CaptureNest'}
            </span>
          </div>
          <div className="top-bar-right">
            {/* Theme and User moved to Settings/Menu page */}
          </div>
        </header>
      )}

      <main className={`main-content ${isCapturePage ? 'full-screen-capture' : ''}`}>
        <Routes>
          <Route path="/auth" element={<Auth onLogin={setUser} />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/qr-login" element={<QRLogin onLogin={setUser} />} />
          <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
          <Route path="/" element={user ? <Dashboard /> : <Auth onLogin={setUser} />} />
        </Routes>
      </main>

      {/* Bottom Navigation - Fixed */}
      {user && !isCapturePage && !isAuthPage && (
        <nav className="bottom-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive && (item.exact ? location.pathname === item.path : true) ? 'active' : ''}`}
              end={item.exact}
            >
              <div className="nav-icon">{item.icon}</div>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
