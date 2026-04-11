import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, FileText, Download, Eye, Lock } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, PageLoader, StatusBadge } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const MANO_DE_OBRA = { descripcion: 'Mano de Obra', cantidad: 1, precioUnit: 100000 };

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  // solicitudes (órdenes EN_PROCESO) del cliente seleccionado
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);

  const [form, setForm] = useState({
    clienteId: '',
    solicitudId: '',
    notas: '',
    itemsRepuestos: [], // items de repuestos (readonly)
  });

  const load = async () => {
    const [co, cl] = await Promise.all([api.get('/cotizaciones'), api.get('/clientes')]);
    setCotizaciones(co.data); setClientes(cl.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Al cambiar el cliente, cargar sus solicitudes EN_PROCESO
  const handleClienteChange = async (clienteId) => {
    setForm(p => ({ ...p, clienteId, solicitudId: '', itemsRepuestos: [] }));
    setSolicitudes([]);
    if (!clienteId) return;
    setLoadingSolicitudes(true);
    try {
      const res = await api.get(`/cotizaciones/solicitudes/${clienteId}`);
      setSolicitudes(res.data);
    } catch {
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  // Al elegir solicitud, cargar sus repuestos como items readonly
  const handleSolicitudChange = (solicitudId) => {
    const sol = solicitudes.find(s => String(s.id) === String(solicitudId));
    setForm(p => ({
      ...p,
      solicitudId,
      itemsRepuestos: sol ? sol.repuestos : [],
    }));
  };

  // Todos los items: repuestos + Mano de Obra fija
  const allItems = [
    ...form.itemsRepuestos,
    MANO_DE_OBRA,
  ];

  const total = allItems.reduce((s, it) => s + (Number(it.cantidad) * Number(it.precioUnit) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.clienteId) return toast.error('Selecciona un cliente');
    if (!form.solicitudId) return toast.error('Selecciona una solicitud en proceso');
    setSaving(true);
    try {
      await api.post('/cotizaciones', {
        clienteId: form.clienteId,
        notas: form.notas,
        items: allItems,
      });
      toast.success('Cotización creada');
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const openCreate = () => {
    setForm({ clienteId: '', solicitudId: '', notas: '', itemsRepuestos: [] });
    setSolicitudes([]);
    setModal(true);
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
        <button onClick={openCreate} className="btn-primary">
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

          {/* Cliente */}
          <div>
            <label className="label">Cliente *</label>
            <select className="input-field" value={form.clienteId} onChange={e => handleClienteChange(e.target.value)}>
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Solicitudes EN_PROCESO del cliente */}
          {form.clienteId && (
            <div>
              <label className="label">Solicitud en proceso *</label>
              {loadingSolicitudes ? (
                <p className="text-xs text-slate-400 py-2">Cargando solicitudes...</p>
              ) : solicitudes.length === 0 ? (
                <p className="text-xs text-amber-400 py-2 bg-amber-500/10 rounded-lg px-3 border border-amber-500/20">
                  Este cliente no tiene solicitudes en estado "En Proceso".
                </p>
              ) : (
                <select
                  className="input-field"
                  value={form.solicitudId}
                  onChange={e => handleSolicitudChange(e.target.value)}
                >
                  <option value="">Seleccionar solicitud</option>
                  {solicitudes.map(s => (
                    <option key={s.id} value={s.id}>
                      Solicitud #{s.id} — {s.equipo ? `${s.equipo.marca} ${s.equipo.modelo}` : ''} {s.descripcion ? `· ${s.descripcion.slice(0, 40)}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Items (readonly) */}
          {form.solicitudId && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="label mb-0">Items de la cotización</label>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Lock size={11} /> Solo lectura
                </span>
              </div>
              <div className="rounded-xl border border-slate-700/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-slate-400 text-xs">
                      <th className="text-left px-3 py-2 font-medium">Descripción</th>
                      <th className="text-center px-3 py-2 font-medium w-16">Cant.</th>
                      <th className="text-right px-3 py-2 font-medium w-32">Precio unit.</th>
                      <th className="text-right px-3 py-2 font-medium w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allItems.map((item, i) => {
                      const isManoObra = item.descripcion === 'Mano de Obra';
                      return (
                        <tr
                          key={i}
                          className={`border-t border-slate-700/40 ${isManoObra ? 'bg-blue-500/5' : 'bg-slate-800/30'}`}
                        >
                          <td className="px-3 py-2 text-slate-200 flex items-center gap-2">
                            {isManoObra && <Lock size={11} className="text-blue-400 shrink-0" />}
                            {item.descripcion}
                            {isManoObra && <span className="text-xs text-blue-400 ml-1">(fijo)</span>}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-300">{item.cantidad}</td>
                          <td className="px-3 py-2 text-right text-slate-300">${Number(item.precioUnit).toLocaleString('es-CO')}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-200">
                            ${(Number(item.cantidad) * Number(item.precioUnit)).toLocaleString('es-CO')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-slate-700/50">
                <p className="font-bold text-green-400">Total: ${total.toLocaleString('es-CO')} COP</p>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="label">Notas adicionales</label>
            <textarea
              className="input-field resize-none text-sm"
              rows={2}
              value={form.notas}
              onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
              placeholder="Condiciones, validez, etc."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button
              type="submit"
              disabled={saving || !form.solicitudId}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {saving ? 'Creando...' : 'Crear cotización'}
            </button>
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
