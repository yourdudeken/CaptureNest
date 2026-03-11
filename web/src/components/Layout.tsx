import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  Images,
  Search,
  Settings,
  Aperture,
  Menu,
  X
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/camera',    label: 'Camera',    icon: Camera },
  { to: '/library',   label: 'Library',   icon: Images },
  { to: '/search',    label: 'AI Search', icon: Search },
  { to: '/settings',  label: 'Settings',  icon: Settings },
];

export default function Layout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-surface relative">
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside 
        className={clsx(
          "absolute md:relative z-50 h-full shrink-0 flex flex-col bg-surface-elevated border-surface-border transition-all duration-300 ease-in-out overflow-hidden shadow-2xl md:shadow-none",
          isOpen ? "w-64 border-r translate-x-0" : "w-0 border-r-0 overflow-hidden -translate-x-full md:translate-x-0"
        )}
      >
        <div className="w-64 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-surface-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
                <Aperture className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">CaptureNest</p>
                <p className="text-xs text-gray-400 mt-0.5">AI Media Server</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx('sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap', 
                    isActive ? 'active bg-brand-600/10 text-brand-400' : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                  )
                }
                onClick={() => {
                  // Auto-close on strictly mobile
                  if (window.innerWidth < 768) setIsOpen(false)
                }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-surface-border shrink-0 bg-surface-elevated">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-medium text-gray-400">System online</span>
              </div>
              {/* Desktop collapse toggle */}
              <button 
                onClick={() => setIsOpen(false)}
                className="hidden md:flex p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-surface-border transition-colors group"
                title="Collapse sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-hidden relative flex flex-col bg-surface w-full h-full">
        {/* Toggle header (appears when closed or on mobile) */}
        {!isOpen && (
          <div className="flex-none p-4 pb-0 z-30">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2.5 rounded-lg bg-surface-elevated border border-surface-border text-gray-300 hover:text-white hover:bg-brand-600/20 hover:border-brand-500/50 transition-all shadow-sm"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto relative w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
