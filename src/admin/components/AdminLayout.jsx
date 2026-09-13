import React, { useState } from 'react';

const NAV_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'users',     label: 'Users',     icon: '◉' },
  { id: 'tickets',   label: 'Tickets',   icon: '◈' },
  { id: 'blog',      label: 'Blog',      icon: '▤' },
  { id: 'email',     label: 'Email',     icon: '◇' },
  { id: 'studio',    label: 'Studio',    icon: '◫' },
  { id: 'objects',   label: 'Objects',   icon: '⬡' },
  { id: 'settings',  label: 'Settings',  icon: '⚙' },
];

const AdminLayout = ({ activeSection, onNavigate, admin, onLogout, children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-30 flex flex-col border-r border-white/[0.04] transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}
        style={{ background: 'var(--admin-sidebar)' }}
      >
        {/* Logo area */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/[0.04] shrink-0">
          <img src="/Icono_taskoria.svg" alt="" className="w-7 h-7 shrink-0" />
          {!collapsed && <span className="text-sm font-heading font-bold text-white tracking-tight truncate">Taskoria</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto admin-scrollbar">
          <div className="space-y-0.5">
            {NAV_SECTIONS.map(s => {
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onNavigate(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'text-[var(--admin-text-muted)] hover:text-white hover:bg-white/[0.03]'
                  }`}
                  title={collapsed ? s.label : undefined}
                >
                  <span className="w-5 text-center shrink-0 text-sm">{s.icon}</span>
                  {!collapsed && <span className="truncate">{s.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/[0.04] shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-[var(--admin-text-muted)] hover:text-white rounded-md hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-xs">{collapsed ? '▸' : '◂'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-200 ${collapsed ? 'ml-16' : 'ml-56'}`}>
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.04] sticky top-0 z-20" style={{ background: 'var(--admin-bg)' }}>
          <h2 className="text-sm font-heading font-bold text-white capitalize tracking-tight">
            {activeSection}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--admin-text-muted)]">{admin?.username}</span>
            <button
              onClick={onLogout}
              className="text-[11px] text-red-400/70 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
