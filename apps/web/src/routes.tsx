import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ResidentDashboard } from './pages/ResidentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { GrievancesListPage } from './pages/GrievancesListPage';
import { GrievanceDetailPage } from './pages/GrievanceDetailPage';
import { RaiseGrievancePage } from './pages/RaiseGrievancePage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ResidentDirectoryPage } from './pages/ResidentDirectoryPage';
import { PgManagementPage } from './pages/PgManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { useAuth } from './context/AuthContext';

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Authenticated Layout Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route
            path="/"
            element={
              user?.role === 'RESIDENT' ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/admin/dashboard" replace />
              )
            }
          />

          {/* Resident Routes */}
          <Route path="/dashboard" element={<ResidentDashboard />} />
          
          {/* Shared Grievance & Community Routes */}
          <Route path="/grievances" element={<GrievancesListPage />} />
          <Route path="/grievances/new" element={<RaiseGrievancePage />} />
          <Route path="/grievances/:id" element={<GrievanceDetailPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/directory" element={<ResidentDirectoryPage />} />

          {/* Admin & Staff Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/pgs" element={<PgManagementPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
