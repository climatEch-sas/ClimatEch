import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { PageLoader, EmptyState, StatusBadge, PrioridadBadge, Modal } from '../../components/ui';
import api from '../../utils/api';

export default function MisOrdenesCliente() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/ordenes').then(r => setOrdenes(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Mis Órdenes</h1>
        <p className="page-subtitle">{ordenes.length} órdenes de servicio</p>
      </div>

      {ordenes.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin órdenes" description="Solicita un servicio para comenzar" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ordenes.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card hover:border-slate-600 cursor-pointer transition-all" onClick={() => setSelected(o)}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-slate-500 font-mono">Orden #{o.id}</span>
                <div className="flex gap-2"><PrioridadBadge prioridad={o.prioridad} /><StatusBadge estado={o.estado} /></div>
              </div>
              <p className="font-semibold mb-1">{o.equipo?.marca} {o.equipo?.modelo}</p>
              <p className="text-xs text-slate-400">{o.equipo?.tipo}</p>
              {o.tecnico && <p className="text-xs text-slate-500 mt-2">Técnico: {o.tecnico.nombre}</p>}
              <p className="text-xs text-slate-600 mt-2">{new Date(o.createdAt).toLocaleDateString('es-CO')}</p>
            </motion.div>
          ))}
        </div>
      )}

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={`Orden #${selected.id}`} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="flex gap-2"><PrioridadBadge prioridad={selected.prioridad} /><StatusBadge estado={selected.estado} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-3"><p className="text-xs text-slate-400">Equipo</p><p className="font-medium text-sm">{selected.equipo?.marca} {selected.equipo?.modelo}</p></div>
              <div className="card p-3"><p className="text-xs text-slate-400">Técnico</p><p className="font-medium text-sm">{selected.tecnico?.nombre || 'Sin asignar'}</p></div>
            </div>
            {selected.descripcion && <div className="card p-3"><p className="text-xs text-slate-400 mb-1">Descripción</p><p className="text-sm">{selected.descripcion}</p></div>}
            {selected.mantenimientos?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Mantenimientos ({selected.mantenimientos.length})</p>
                {selected.mantenimientos.map(m => (
                  <div key={m.id} className="card p-3 mb-2 text-sm">
                    <span className={`badge text-xs ${m.tipo === 'PREVENTIVO' ? 'bg-blue-500/15 text-blue-400' : 'bg-orange-500/15 text-orange-400'}`}>{m.tipo}</span>
                    <p className="mt-2 text-slate-300">{m.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
