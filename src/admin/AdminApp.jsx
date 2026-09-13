import React, { useState, useCallback } from 'react';
import { useAdminAuth } from './hooks/useAdminAuth';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';
import DashboardHome from './components/DashboardHome';
import UsersSection from './components/UsersSection';
import SettingsSection from './components/SettingsSection';
import StudioSection from './components/StudioSection';
import BlogSection from './components/BlogSection';
import TicketsSection from './components/TicketsSection';
import EmailSection from './components/EmailSection';
import ObjectsSection from './components/ObjectsSection';

const AdminApp = () => {
  const { admin, loading, error, login, logout, adminFetch } = useAdminAuth();
  const [section, setSection] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });

  const navigate = useCallback((id) => {
    setSection(id);
    window.location.hash = id;
  }, []);

  if (!admin) {
    return <AdminLogin onLogin={login} loading={loading} error={error} />;
  }

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <DashboardHome adminFetch={adminFetch} />;
      case 'users':     return <UsersSection adminFetch={adminFetch} />;
      case 'settings':  return <SettingsSection adminFetch={adminFetch} />;
      case 'studio':    return <StudioSection adminFetch={adminFetch} />;
      case 'blog':      return <BlogSection adminFetch={adminFetch} />;
      case 'tickets':   return <TicketsSection adminFetch={adminFetch} />;
      case 'email':     return <EmailSection adminFetch={adminFetch} />;
      case 'objects':   return <ObjectsSection adminFetch={adminFetch} />;
      default:          return <DashboardHome adminFetch={adminFetch} />;
    }
  };

  return (
    <AdminLayout
      activeSection={section}
      onNavigate={navigate}
      admin={admin}
      onLogout={logout}
    >
      {renderSection()}
    </AdminLayout>
  );
};

export default AdminApp;
