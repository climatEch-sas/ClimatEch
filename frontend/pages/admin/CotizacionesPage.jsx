import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, FileText, Download, Eye } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, PageLoader, SearchInput, StatusBadge } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clienteId: '', notas: '', items: [{ descripcion: '', cantidad: 1, precioUnit: '' }] });

  const load = async () => {
    const [co, cl] = await Promise.all([api.get('/cotizaciones'), api.get('/clientes')]);
    setCotizaciones(co.data); setClientes(cl.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setItem = (i, k, v) => setForm(p => {
    const items = [...p.items]; items[i] = { ...items[i], [k]: v }; return { ...p, items };
  });
  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { descripcion: '', cantidad: 1, precioUnit: '' }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const total = form.items.reduce((s, it) => s + (Number(it.cantidad) * Number(it.precioUnit) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.clienteId || !form.items.length) return toast.error('Cliente e items requeridos');
    setSaving(true);
    try {
      await api.post('/cotizaciones', form);
      toast.success('Cotización creada');
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleUpdateEstado = async (id, estado) => {
    try { await api.put(`/cotizaciones/${id}/estado`, { estado }); toast.success('Estado actualizado'); load(); }
    catch { toast.error('Error'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/cotizaciones/${deleteId}`); toast.success('Cotización eliminada'); setDeleteId(null); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const handlePDF = async (id) => {
    try {
      const res = await api.get(`/cotizaciones/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `cotizacion-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Error al generar PDF'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Cotizaciones</h1>
          <p className="page-subtitle">{cotizaciones.length} cotizaciones</p>
        </div>
        <button onClick={() => { setForm({ clienteId: '', notas: '', items: [{ descripcion: '', cantidad: 1, precioUnit: '' }] }); setModal(true); }} className="btn-primary">
          <Plus size={16} />Nueva cotización
        </button>
      </div>

      {cotizaciones.length === 0 ? (
        <EmptyState icon={FileText} title="Sin cotizaciones" description="Crea cotizaciones para tus clientes" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {cotizaciones.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="font-mono text-xs text-slate-500">#{c.id}</td>
                  <td className="font-medium">{c.cliente?.nombre}</td>
                  <td className="font-semibold text-green-400">${Number(c.total).toLocaleString('es-CO')}</td>
                  <td>
                    <select
                      className="text-xs bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white"
                      value={c.estado}
                      onChange={e => handleUpdateEstado(c.id, e.target.value)}
                    >
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="APROBADA">Aprobada</option>
                      <option value="RECHAZADA">Rechazada</option>
                    </select>
                  </td>
                  <td className="text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString('es-CO')}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelected(c); setDetailModal(true); }} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-blue-500/20 flex items-center justify-center text-slate-400 hover:text-blue-400"><Eye size={13} /></button>
                      <button onClick={() => handlePDF(c.id)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-green-500/20 flex items-center justify-center text-slate-400 hover:text-green-400"><Download size={13} /></button>
                      <button onClick={() => setDeleteId(c.id)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva cotización" maxWidth="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select className="input-field" value={form.clienteId} onChange={e => setField('clienteId', e.target.value)}>
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label mb-0">Items *</label>
              <button type="button" onClick={addItem} className="text-xs text-brand-primary hover:text-blue-400 flex items-center gap-1"><Plus size={12} />Agregar item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <input className="input-field col-span-5 text-sm py-2" placeholder="Descripción" value={item.descripcion} onChange={e => setItem(i, 'descripcion', e.target.value)} />
                  <input type="number" className="input-field col-span-2 text-sm py-2" placeholder="Cant." value={item.cantidad} onChange={e => setItem(i, 'cantidad', e.target.value)} min="1" />
                  <input type="number" className="input-field col-span-4 text-sm py-2" placeholder="Precio unit." value={item.precioUnit} onChange={e => setItem(i, 'precioUnit', e.target.value)} />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-red-400 hover:text-red-300 mt-2 flex justify-center"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 pt-3 border-t border-slate-700/50">
              <p className="font-bold text-green-400">Total: ${total.toLocaleString('es-CO')} COP</p>
            </div>
          </div>

          <div>
            <label className="label">Notas adicionales</label>
            <textarea className="input-field resize-none text-sm" rows={2} value={form.notas} onChange={e => setField('notas', e.target.value)} placeholder="Condiciones, validez, etc." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Creando...' : 'Crear cotización'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      {selected && (
        <Modal open={detailModal} onClose={() => setDetailModal(false)} title={`Cotización #${selected.id}`} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-400">Cliente</p>
                <p className="font-semibold">{selected.cliente?.nombre}</p>
              </div>
              <StatusBadge estado={selected.estado} />
            </div>
            <div className="table-wrapper">
              <table className="table text-sm">
                <thead><tr><th>Descripción</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {selected.items?.map(it => (
                    <tr key={it.id}>
                      <td>{it.descripcion}</td>
                      <td>{it.cantidad}</td>
                      <td>${Number(it.precioUnit).toLocaleString('es-CO')}</td>
                      <td className="font-semibold">${Number(it.subtotal).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <p className="text-lg font-bold text-green-400">Total: ${Number(selected.total).toLocaleString('es-CO')} COP</p>
            </div>
            {selected.notas && <p className="text-sm text-slate-400 italic">{selected.notas}</p>}
            <button onClick={() => handlePDF(selected.id)} className="btn-success w-full justify-center">
              <Download size={14} />Descargar PDF
            </button>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar cotización" message="¿Eliminar esta cotización?" />
    </div>
  );
}
