import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import {
  Home,
  AlertCircle,
  Megaphone,
  Users,
  BarChart3,
  Building2,
  Bell,
  LogOut,
  PlusCircle,
  Menu,
  X,
  CheckCircle,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedGrievanceId?: string;
}

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (user) {
      apiClient.get('/notifications').then((res) => {
        setNotifications(res.data.notifications || []);
      }).catch(() => {});
    }
  }, [user, location.pathname]);

  const markNotificationRead = async (id: string, grievanceId?: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (grievanceId) {
        setNotificationsOpen(false);
        navigate(`/grievances/${grievanceId}`);
      }
    } catch (err) {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isResident = user?.role === 'RESIDENT';
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  const navItems = [
    {
      label: 'Dashboard',
      path: isResident ? '/dashboard' : '/admin/dashboard',
      icon: Home,
      show: true,
    },
    {
      label: 'Grievances',
      path: '/grievances',
      icon: AlertCircle,
      show: true,
    },
    {
      label: 'Raise Grievance',
      path: '/grievances/new',
      icon: PlusCircle,
      show: isResident || isStaff,
    },
    {
      label: 'Announcements',
      path: '/announcements',
      icon: Megaphone,
      show: true,
    },
    {
      label: 'Resident Directory',
      path: '/directory',
      icon: Users,
      show: true,
    },
    {
      label: 'PG & Rooms',
      path: '/admin/pgs',
      icon: Building2,
      show: isAdmin,
    },
    {
      label: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
      show: isAdmin,
    },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-500 md:hidden hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link to="/" className="flex items-center gap-2 font-bold text-xl text-sky-600 ml-2 md:ml-0">
                <Building2 className="w-6 h-6 text-sky-600" />
                <span>PG Connect</span>
              </Link>
              {user?.pg && (
                <span className="hidden sm:inline-flex ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  {user.pg.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full relative transition"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
                      <span className="text-xs text-gray-500">{unreadCount} unread</span>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id, n.relatedGrievanceId)}
                          className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${
                            !n.isRead ? 'bg-sky-50/50 font-medium' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs text-gray-800">{n.message}</p>
                            {!n.isRead && <CheckCircle className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Profile & Logout */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-800">{user?.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role.toLowerCase()}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 hidden md:block bg-white border-r border-gray-200 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-sky-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </aside>

        {/* Mobile Navigation Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-white h-full p-4 space-y-1 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 pb-3 border-b border-gray-100 font-bold text-sky-600 flex items-center justify-between">
                <span>Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      active ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
