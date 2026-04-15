import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/errors/Unauthorized';

// Role-based Dashboards
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import AADashboard from './pages/aa/AADashboard';
import AAOnboarding from './pages/aa/AAOnboarding';
import ATOCropsDashboard from './pages/ato/ATOCropsDashboard';
import ATOIrrigationDashboard from './pages/ato/ATOIrrigationDashboard';
import AEODashboard from './pages/aeo/AEODashboard';
import BEODashboard from './pages/district/BEODashboard';
import DCPODashboard from './pages/district/DCPODashboard';
import DIODashboard from './pages/district/DIODashboard';
import SITODashboard from './pages/sito/SITODashboard';

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!profile) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" />;
  }
  return children;
}

// Role-based redirect after login
function RoleRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!profile) return <Navigate to="/login" />;
  const role = profile.role;
  switch (role) {
    case 'farmer': return <Navigate to="/farmer" />;
    case 'aa': return <Navigate to="/aa" />;
    case 'ato_crops': return <Navigate to="/ato-crops" />;
    case 'ato_irrigation': return <Navigate to="/ato-irrigation" />;
    case 'aeo': return <Navigate to="/aeo" />;
    case 'beo': return <Navigate to="/beo" />;
    case 'dcpo': return <Navigate to="/dcpo" />;
    case 'dio': return <Navigate to="/dio" />;
    case 'sito': return <Navigate to="/sito" />;
    default: return <Navigate to="/login" />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Farmer */}
      <Route path="/farmer" element={
        <ProtectedRoute allowedRoles={['farmer']}>
          <FarmerDashboard />
        </ProtectedRoute>
      } />

      {/* AA */}
      <Route path="/aa" element={
        <ProtectedRoute allowedRoles={['aa']}>
          <AADashboard />
        </ProtectedRoute>
      } />
      <Route path="/aa/onboard" element={
        <ProtectedRoute allowedRoles={['aa']}>
          <AAOnboarding />
        </ProtectedRoute>
      } />

      {/* ATOs */}
      <Route path="/ato-crops" element={
        <ProtectedRoute allowedRoles={['ato_crops']}>
          <ATOCropsDashboard />
        </ProtectedRoute>
      } />
      <Route path="/ato-irrigation" element={
        <ProtectedRoute allowedRoles={['ato_irrigation']}>
          <ATOIrrigationDashboard />
        </ProtectedRoute>
      } />

      {/* AEO */}
      <Route path="/aeo" element={
        <ProtectedRoute allowedRoles={['aeo']}>
          <AEODashboard />
        </ProtectedRoute>
      } />

      {/* District Officers */}
      <Route path="/beo" element={
        <ProtectedRoute allowedRoles={['beo']}>
          <BEODashboard />
        </ProtectedRoute>
      } />
      <Route path="/dcpo" element={
        <ProtectedRoute allowedRoles={['dcpo']}>
          <DCPODashboard />
        </ProtectedRoute>
      } />
      <Route path="/dio" element={
        <ProtectedRoute allowedRoles={['dio']}>
          <DIODashboard />
        </ProtectedRoute>
      } />

      {/* SITO */}
      <Route path="/sito" element={
        <ProtectedRoute allowedRoles={['sito']}>
          <SITODashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;