import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, FileText, Cpu, Wind, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { StatCard, PageLoader } from '../../components/ui';
import api from '../../utils/api';

export default function ClienteDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/cliente').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  const quickLinks = [
    { to: '/cliente/solicitar', icon: Wind, label: 'Solicitar servicio', desc: 'Crea una nueva orden', color: 'blue' },
    { to: '/cliente/ordenes', icon: ClipboardList, label: 'Mis órdenes', desc: `${data.activas} activas`, color: 'orange' },
    { to: '/cliente/cotizaciones', icon: FileText, label: 'Cotizaciones', desc: `${data.cotizaciones} cotizaciones`, color: 'purple' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Bienvenido, {data.cliente?.nombre}</h1>
        <p className="page-subtitle">Panel de gestión de servicios</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total órdenes" value={data.totalOrdenes} icon={ClipboardList} color="blue" />
        <StatCard label="Activas" value={data.activas} icon={Clock} color="orange" delay={0.05} />
        <StatCard label="Completadas" value={data.completadas} icon={CheckCircle} color="green" delay={0.1} />
        <StatCard label="Equipos" value={data.equipos} icon={Cpu} color="purple" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map(({ to, icon: Icon, label, desc, color }, i) => (
          <Link key={to} to={to}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="card hover:border-slate-500 transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4
                ${color === 'blue' ? 'bg-blue-500/15' : color === 'orange' ? 'bg-orange-500/15' : 'bg-purple-500/15'}`}>
                <Icon size={22} className={color === 'blue' ? 'text-blue-400' : color === 'orange' ? 'text-orange-400' : 'text-purple-400'} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-semibold text-white">{label}</p>
                  <p className="text-sm text-slate-400">{desc}</p>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
