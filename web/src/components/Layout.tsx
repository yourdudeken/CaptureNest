import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  Images,
  Search,
  Settings,
  Aperture,
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
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col bg-surface-elevated border-r border-surface-border">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
            <Aperture className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">CaptureNest</p>
            <p className="text-xs text-gray-500 mt-0.5">AI Media Server</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx('sidebar-link', isActive && 'active')
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
            <span className="text-xs text-gray-500">System online</span>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
