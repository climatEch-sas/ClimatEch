import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ClipboardList, Users, Wrench, Cpu, Clock, CheckCircle, AlertCircle, TrendingUp
} from 'lucide-react';
import { StatCard, PageLoader, StatusBadge, PrioridadBadge } from '../../components/ui';
import api from '../../utils/api';

const COLORS = ['#F59E0B', '#3B82F6', '#22C55E', '#EF4444'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  const { metricas, ordenesRecientes, ordenesPorEstado, ordenesPorMes } = data;

  const pieData = ordenesPorEstado.map(e => ({
    name: { PENDIENTE: 'Pendiente', EN_PROCESO: 'En Proceso', COMPLETADO: 'Completado', CANCELADO: 'Cancelado' }[e.estado] || e.estado,
    value: e._count.estado,
  }));

  const barData = (ordenesPorMes || []).map(m => ({
    mes: m.mes?.slice(5),
    total: Number(m.total),
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general del sistema</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Órdenes" value={metricas.totalOrdenes} icon={ClipboardList} color="blue" delay={0} />
        <StatCard label="Pendientes" value={metricas.ordenesPendientes} icon={Clock} color="orange" delay={0.05} />
        <StatCard label="En Proceso" value={metricas.ordenesEnProceso} icon={AlertCircle} color="purple" delay={0.1} />
        <StatCard label="Completadas" value={metricas.ordenesCompletadas} icon={CheckCircle} color="green" delay={0.15} />
        <StatCard label="Clientes" value={metricas.totalClientes} icon={Users} color="blue" delay={0.2} />
        <StatCard label="Técnicos" value={metricas.totalTecnicos} icon={Wrench} color="green" delay={0.25} />
        <StatCard label="Disponibles" value={metricas.tecnicosDisponibles} icon={TrendingUp} color="green" delay={0.3} />
        <StatCard label="Equipos" value={metricas.totalEquipos} icon={Cpu} color="purple" delay={0.35} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card lg:col-span-2"
        >
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-primary" />
            Órdenes por mes
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="mes" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12 }}
                  labelStyle={{ color: '#F1F5F9' }}
                  cursor={{ fill: '#2563EB15' }}
                />
                <Bar dataKey="total" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              Sin datos suficientes aún
            </div>
          )}
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card"
        >
          <h3 className="font-semibold text-white mb-4">Estado de órdenes</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12 }}
                  labelStyle={{ color: '#F1F5F9' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">Sin datos</div>
          )}
        </motion.div>
      </div>

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h3 className="font-semibold text-white mb-4">Órdenes recientes</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Técnico</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ordenesRecientes.map(o => (
                <tr key={o.id}>
                  <td className="text-slate-500 font-mono text-xs">#{o.id}</td>
                  <td className="font-medium">{o.cliente?.nombre}</td>
                  <td className="text-slate-400">{o.equipo?.marca} {o.equipo?.modelo}</td>
                  <td className="text-slate-400">{o.tecnico?.nombre || <span className="text-slate-600">Sin asignar</span>}</td>
                  <td><PrioridadBadge prioridad={o.prioridad} /></td>
                  <td><StatusBadge estado={o.estado} /></td>
                  <td className="text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
