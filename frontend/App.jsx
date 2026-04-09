import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientesPage from './pages/admin/ClientesPage';
import TecnicosPage from './pages/admin/TecnicosPage';
import EquiposPage from './pages/admin/EquiposPage';
import OrdenesPage from './pages/admin/OrdenesPage';
import RepuestosPage from './pages/admin/RepuestosPage';
import CotizacionesPage from './pages/admin/CotizacionesPage';

// Tecnico pages
import TecnicoDashboard from './pages/tecnico/TecnicoDashboard';
import MisOrdenesPage from './pages/tecnico/MisOrdenesPage';
import OrdenDetalleTecnico from './pages/tecnico/OrdenDetalleTecnico';

// Cliente pages
import ClienteDashboard from './pages/cliente/ClienteDashboard';
import MisOrdenesCliente from './pages/cliente/MisOrdenesCliente';
import MisCotizaciones from './pages/cliente/MisCotizaciones';
import SolicitarServicio from './pages/cliente/SolicitarServicio';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.rol === 'TECNICO') return <Navigate to="/tecnico" replace />;
  if (user.rol === 'CLIENTE') return <Navigate to="/cliente" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155' },
            success: { iconTheme: { primary: '#22C55E', secondary: '#0F172A' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#0F172A' } },
          }}
        />
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ADMIN */}
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="tecnicos" element={<TecnicosPage />} />
            <Route path="equipos" element={<EquiposPage />} />
            <Route path="ordenes" element={<OrdenesPage />} />
            <Route path="repuestos" element={<RepuestosPage />} />
            <Route path="cotizaciones" element={<CotizacionesPage />} />
          </Route>

          {/* TECNICO */}
          <Route path="/tecnico" element={<ProtectedRoute roles={['TECNICO']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<TecnicoDashboard />} />
            <Route path="ordenes" element={<MisOrdenesPage />} />
            <Route path="ordenes/:id" element={<OrdenDetalleTecnico />} />
          </Route>

          {/* CLIENTE */}
          <Route path="/cliente" element={<ProtectedRoute roles={['CLIENTE']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<ClienteDashboard />} />
            <Route path="ordenes" element={<MisOrdenesCliente />} />
            <Route path="cotizaciones" element={<MisCotizaciones />} />
            <Route path="solicitar" element={<SolicitarServicio />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
