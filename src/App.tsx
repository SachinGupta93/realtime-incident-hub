import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import NewIncident from './pages/NewIncident';
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="incidents/new" element={
            <PrivateRoute requiredRole={undefined}>
              <NewIncident />
            </PrivateRoute>
          } />
          <Route path="incidents/:id" element={<IncidentDetail />} />
          <Route path="audit-logs" element={
            <PrivateRoute requiredRole="ADMIN">
              <AuditLogs />
            </PrivateRoute>
          } />
          <Route path="users" element={
            <PrivateRoute requiredRole="ADMIN">
              <Users />
            </PrivateRoute>
          } />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
