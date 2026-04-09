import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { StatCard, PageLoader, StatusBadge, PrioridadBadge } from '../../components/ui';
import api from '../../utils/api';

export default function TecnicoDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/tecnico').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Bienvenido, {data.tecnico?.nombre}</h1>
        <p className="page-subtitle">{data.tecnico?.especialidad}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pendientes" value={data.pendientes} icon={Clock} color="orange" />
        <StatCard label="En Proceso" value={data.enProceso} icon={AlertCircle} color="blue" delay={0.05} />
        <StatCard label="Completadas" value={data.completadas} icon={CheckCircle} color="green" delay={0.1} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><ClipboardList size={16} className="text-brand-primary" />Órdenes recientes</h3>
          <Link to="/tecnico/ordenes" className="text-sm text-brand-primary hover:text-blue-400 flex items-center gap-1">
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>
        {data.recientes.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No tienes órdenes asignadas</p>
        ) : (
          <div className="space-y-3">
            {data.recientes.map((o, i) => (
              <Link key={o.id} to={`/tecnico/ordenes/${o.id}`}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 hover:bg-slate-700/30 transition-colors cursor-pointer border border-slate-700/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                    <ClipboardList size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{o.cliente?.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">{o.equipo?.marca} {o.equipo?.modelo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PrioridadBadge prioridad={o.prioridad} />
                    <StatusBadge estado={o.estado} />
                    <ArrowRight size={14} className="text-slate-500" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
