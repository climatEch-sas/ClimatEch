import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { PageLoader, EmptyState, StatusBadge, PrioridadBadge, SearchInput } from '../../components/ui';
import api from '../../utils/api';

export default function MisOrdenesPage() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  useEffect(() => {
    api.get('/ordenes').then(r => setOrdenes(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = ordenes.filter(o => {
    const match = o.cliente?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      o.equipo?.marca.toLowerCase().includes(search.toLowerCase());
    return match && (!filterEstado || o.estado === filterEstado);
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Mis Órdenes</h1>
        <p className="page-subtitle">{ordenes.length} órdenes asignadas</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." />
        </div>
        <select className="input-field w-auto text-sm" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROCESO">En Proceso</option>
          <option value="COMPLETADO">Completado</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin órdenes" description="No tienes órdenes asignadas actualmente" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((o, i) => (
            <Link key={o.id} to={`/tecnico/ordenes/${o.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card hover:border-blue-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-slate-500 font-mono">Orden #{o.id}</span>
                    <p className="font-semibold mt-0.5">{o.cliente?.nombre}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-600 group-hover:text-brand-primary transition-colors mt-1" />
                </div>
                <p className="text-sm text-slate-400 mb-3">{o.equipo?.marca} {o.equipo?.modelo} • {o.equipo?.tipo}</p>
                {o.descripcion && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{o.descripcion}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <PrioridadBadge prioridad={o.prioridad} />
                    <StatusBadge estado={o.estado} />
                  </div>
                  <span className="text-xs text-slate-600">{new Date(o.createdAt).toLocaleDateString('es-CO')}</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
