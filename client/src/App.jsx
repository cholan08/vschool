import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/dashboards/OwnerDashboard';
import OwnerBranches from './pages/dashboards/owner/OwnerBranches';
import OwnerStaff from './pages/dashboards/owner/OwnerStaff';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import AdminPatients from './pages/dashboards/admin/AdminPatients';
import AdminSchedule from './pages/dashboards/admin/AdminSchedule';
import TherapistDashboard from './pages/dashboards/TherapistDashboard';
import TherapistPatients from './pages/dashboards/therapist/TherapistPatients';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import ParentProgress from './pages/dashboards/parent/ParentProgress';

// Smart redirect: sends user to the correct dashboard for their role
const RoleDashboard = () => {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case 'owner':     return <OwnerDashboard />;
    case 'admin':     return <AdminDashboard />;
    case 'therapist': return <TherapistDashboard />;
    case 'parent':    return <ParentDashboard />;
    default:          return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ─── Public ──────────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ─── Protected — all authenticated users ─────────────────── */}
          <Route element={<ProtectedRoute />}>
            {/* Role-smart dashboard entry point */}
            <Route path="/dashboard" element={<RoleDashboard />} />

            {/* ─── Owner-only routes ──────────────────────────────────── */}
            <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
              <Route path="/dashboard/branches" element={<OwnerBranches />} />
              <Route path="/dashboard/staff" element={<OwnerStaff />} />
            </Route>

            {/* ─── Admin-only routes ──────────────────────────────────── */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/dashboard/patients" element={<AdminPatients />} />
              <Route path="/dashboard/schedule" element={<AdminSchedule />} />
            </Route>

            {/* ─── Therapist-only routes ──────────────────────────────── */}
            <Route element={<ProtectedRoute allowedRoles={['therapist']} />}>
              <Route path="/dashboard/patients" element={<TherapistPatients />} />
            </Route>

            {/* ─── Parent-only routes ─────────────────────────────────── */}
            <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
              <Route path="/dashboard/progress" element={<ParentProgress />} />
            </Route>
          </Route>

          {/* ─── Fallback ────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
