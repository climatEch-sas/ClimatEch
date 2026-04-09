import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Wrench, Cpu, ClipboardList,
  Package, FileText, LogOut, Menu, X, Wind, ChevronRight,
  Bell, Settings, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle
} from 'lucide-react';
import api from '../../utils/api';

const navByRole = {
  ADMIN: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/ordenes', icon: ClipboardList, label: 'Órdenes' },
    { to: '/admin/clientes', icon: Users, label: 'Clientes' },
    { to: '/admin/tecnicos', icon: Wrench, label: 'Técnicos' },
    { to: '/admin/equipos', icon: Cpu, label: 'Equipos' },
    { to: '/admin/repuestos', icon: Package, label: 'Repuestos' },
    { to: '/admin/cotizaciones', icon: FileText, label: 'Cotizaciones' },
  ],
  TECNICO: [
    { to: '/tecnico', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/tecnico/ordenes', icon: ClipboardList, label: 'Mis Órdenes' },
  ],
  CLIENTE: [
    { to: '/cliente', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/cliente/solicitar', icon: Wind, label: 'Solicitar Servicio' },
    { to: '/cliente/ordenes', icon: ClipboardList, label: 'Mis Órdenes' },
    { to: '/cliente/cotizaciones', icon: FileText, label: 'Cotizaciones' },
  ],
};

const roleColors = {
  ADMIN: 'bg-brand-primary/20 text-blue-400 border border-blue-500/30',
  TECNICO: 'bg-green-500/20 text-green-400 border border-green-500/30',
  CLIENTE: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const tipoIcon = {
  INFO: <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />,
  EXITO: <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />,
  ADVERTENCIA: <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />,
  ERROR: <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />,
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // — Notificaciones —
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const panelRef = useRef(null);

  const navItems = navByRole[user?.rol] || [];

  const fetchNotificaciones = async () => {
    try {
      setLoadingNotif(true);
      const { data } = await api.get('/notificaciones');
      setNotificaciones(data.notificaciones);
      setNoLeidas(data.noLeidas);
    } catch {
      // silencioso: no interrumpir la sesión
    } finally {
      setLoadingNotif(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 60000); // polling cada 1 min
    return () => clearInterval(interval);
  }, []);

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarcarLeida = async (id) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch { /* noop */ }
  };

  const handleMarcarTodas = async () => {
    try {
      await api.patch('/notificaciones/leer-todas');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch { /* noop */ }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center">
            <Wind size={18} className="text-white" />
          </div>
          <AnimatePresence>
            {(sidebarOpen || mobileOpen) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <span className="font-bold text-lg text-white tracking-tight">ClimatEch</span>
                <p className="text-xs text-slate-400 -mt-0.5">Gestión profesional</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
              ${isActive
                ? 'bg-brand-primary text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className="shrink-0" />
                <AnimatePresence>
                  {(sidebarOpen || mobileOpen) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (sidebarOpen || mobileOpen) && (
                  <ChevronRight size={14} className="ml-auto" />
                )}
                {!sidebarOpen && !mobileOpen && (
                  <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg
                    opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50
                    border border-slate-700 transition-opacity">
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-700/50">
        <div className={`flex items-center gap-3 mb-3 ${!sidebarOpen && !mobileOpen ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.nombre?.[0]?.toUpperCase()}
          </div>
          <AnimatePresence>
            {(sidebarOpen || mobileOpen) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0 flex-1"
              >
                <p className="text-sm font-medium text-white truncate">{user?.nombre}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${roleColors[user?.rol]}`}>
                  {user?.rol}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400
            hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm"
        >
          <LogOut size={16} className="shrink-0" />
          <AnimatePresence>
            {(sidebarOpen || mobileOpen) && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex flex-col bg-slate-900/80 border-r border-slate-700/50 shrink-0 relative z-20"
      >
        <SidebarContent />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600
            rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors z-30"
        >
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }}>
            <ChevronRight size={12} className="text-slate-300" />
          </motion.div>
        </button>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-30"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-700/50 z-40 flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-slate-900/50 border-b border-slate-700/50 flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />

          {/* ── Campanita ── */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <Bell size={16} className="text-slate-400" />
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-primary rounded-full
                  text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </button>

            {/* Panel de notificaciones */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  {/* Header panel */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <span className="text-sm font-semibold text-white">Notificaciones</span>
                    {noLeidas > 0 && (
                      <button
                        onClick={handleMarcarTodas}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <CheckCheck size={13} />
                        Marcar todas
                      </button>
                    )}
                  </div>

                  {/* Lista */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {loadingNotif && notificaciones.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 text-sm">Cargando…</div>
                    ) : notificaciones.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 text-sm">
                        <Bell size={28} className="mx-auto mb-2 opacity-30" />
                        Sin notificaciones
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors
                            ${n.leida ? 'hover:bg-slate-800/40' : 'bg-blue-500/5 hover:bg-blue-500/10'}`}
                          onClick={() => !n.leida && handleMarcarLeida(n.id)}
                        >
                          {tipoIcon[n.tipo] ?? tipoIcon.INFO}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${n.leida ? 'text-slate-400' : 'text-white'}`}>
                              {n.titulo}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                            <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.creadaEn)}</p>
                          </div>
                          {!n.leida && (
                            <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-1" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* ── fin campanita ── */}

          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
            {user?.nombre?.[0]?.toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}