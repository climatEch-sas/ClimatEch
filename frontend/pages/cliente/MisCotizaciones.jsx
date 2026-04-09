import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye } from 'lucide-react';
import { PageLoader, EmptyState, StatusBadge, Modal } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function MisCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/cotizaciones').then(r => setCotizaciones(r.data)).finally(() => setLoading(false));
  }, []);

  const handlePDF = async (id) => {
    try {
      const res = await api.get(`/cotizaciones/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `cotizacion-${id}.pdf`; a.click();
    } catch { toast.error('Error al generar PDF'); }
  };

  const handleAprobar = async (id) => {
    try {
      await api.put(`/cotizaciones/${id}/estado`, { estado: 'APROBADA' });
      toast.success('Cotización aprobada');
      setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado: 'APROBADA' } : c));
    } catch { toast.error('Error'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Mis Cotizaciones</h1>
        <p className="page-subtitle">{cotizaciones.length} cotizaciones recibidas</p>
      </div>

      {cotizaciones.length === 0 ? (
        <EmptyState icon={FileText} title="Sin cotizaciones" description="Aún no has recibido cotizaciones" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cotizaciones.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card hover:border-slate-600 transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-slate-500 font-mono">Cotización #{c.id}</span>
                <StatusBadge estado={c.estado} />
              </div>
              <p className="text-2xl font-bold text-green-400">${Number(c.total).toLocaleString('es-CO')}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(c.createdAt).toLocaleDateString('es-CO')}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setSelected(c)} className="btn-secondary text-xs py-2 flex-1 justify-center"><Eye size={13} />Ver detalle</button>
                <button onClick={() => handlePDF(c.id)} className="btn-success text-xs py-2 justify-center px-3"><Download size={13} /></button>
                {c.estado === 'PENDIENTE' && (
                  <button onClick={() => handleAprobar(c.id)} className="btn-primary text-xs py-2 flex-1 justify-center">Aprobar</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={`Cotización #${selected.id}`}>
          <div className="space-y-4">
            <StatusBadge estado={selected.estado} />
            <div className="table-wrapper">
              <table className="table text-sm">
                <thead><tr><th>Descripción</th><th>Cant.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {selected.items?.map(it => (
                    <tr key={it.id}><td>{it.descripcion}</td><td>{it.cantidad}</td><td className="font-semibold">${Number(it.subtotal).toLocaleString('es-CO')}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end"><p className="text-lg font-bold text-green-400">Total: ${Number(selected.total).toLocaleString('es-CO')} COP</p></div>
            {selected.notas && <p className="text-sm text-slate-400 italic">{selected.notas}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
