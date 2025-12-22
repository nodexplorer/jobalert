// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing';
import AuthCallback from './pages/authcallback';
import Dashboard from './pages/Dashboard';
import Registration from './pages/registration';
import ProtectedRoute from './components/ProtectedRoute';
import BiometricSetup from './pages/BiometricSetup';
import Settings from './pages/Settings';
import NotificationHistory from './pages/NotificationHistory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/error" element={<AuthCallback />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/biometric-setup"
          element={
            <ProtectedRoute>
              <BiometricSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationHistory />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;