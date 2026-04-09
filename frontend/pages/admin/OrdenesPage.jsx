import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, Pencil, Trash2, ClipboardList, UserCheck } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, PageLoader, SearchInput, StatusBadge, PrioridadBadge } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { descripcion: '', prioridad: 'NORMAL', clienteId: '', equipoId: '', tecnicoId: '' };

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [equiposByCliente, setEquiposByCliente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({ estado: '', tecnicoId: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filterEstado, setFilterEstado] = useState('');

  const load = async () => {
    const [or, cl, te] = await Promise.all([api.get('/ordenes'), api.get('/clientes'), api.get('/tecnicos')]);
    setOrdenes(or.data); setClientes(cl.data); setTecnicos(te.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleClienteChange = async (clienteId) => {
    set('clienteId', clienteId); set('equipoId', '');
    if (clienteId) {
      const r = await api.get(`/equipos?clienteId=${clienteId}`);
      setEquiposByCliente(r.data);
    } else setEquiposByCliente([]);
  };

  const openCreate = () => { setForm(emptyForm); setEquiposByCliente([]); setModal(true); };
  const openEdit = (o) => {
    setSelected(o);
    setEditForm({ estado: o.estado, tecnicoId: o.tecnicoId || '' });
    setEditModal(true);
  };
  const openDetail = (o) => { setSelected(o); setDetailModal(true); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.clienteId || !form.equipoId) return toast.error('Cliente y equipo requeridos');
    setSaving(true);
    try {
      await api.post('/ordenes', { ...form, tecnicoId: form.tecnicoId || undefined });
      toast.success('Orden creada'); setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/ordenes/${selected.id}`, { estado: editForm.estado, tecnicoId: editForm.tecnicoId || null });
      toast.success('Orden actualizada'); setEditModal(false); load();
    } catch { toast.error('Error al actualizar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/ordenes/${deleteId}`); toast.success('Orden eliminada'); setDeleteId(null); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const filtered = ordenes.filter(o => {
    const matchSearch = o.cliente?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      o.equipo?.marca.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado || o.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Órdenes de trabajo</h1>
          <p className="page-subtitle">{ordenes.length} órdenes registradas</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Nueva orden</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cliente o equipo..." />
        </div>
        <select className="input-field w-auto text-sm" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROCESO">En Proceso</option>
          <option value="COMPLETADO">Completado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin órdenes" description="Crea la primera orden de trabajo" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Nueva orden</button>} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>Cliente</th><th>Equipo</th><th>Técnico</th><th>Prioridad</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((o, i) => (
                <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td className="text-slate-500 font-mono text-xs">#{o.id}</td>
                  <td className="font-medium">{o.cliente?.nombre}</td>
                  <td className="text-slate-400 text-xs">{o.equipo?.marca} {o.equipo?.modelo}</td>
                  <td>
                    {o.tecnico
                      ? <span className="flex items-center gap-1.5 text-sm"><UserCheck size={13} className="text-green-400" />{o.tecnico.nombre}</span>
                      : <span className="text-slate-600 text-xs">Sin asignar</span>
                    }
                  </td>
                  <td><PrioridadBadge prioridad={o.prioridad} /></td>
                  <td><StatusBadge estado={o.estado} /></td>
                  <td className="text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openDetail(o)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-blue-500/20 flex items-center justify-center text-slate-400 hover:text-blue-400"><Eye size={13} /></button>
                      <button onClick={() => openEdit(o)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(o.id)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva orden de trabajo" maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cliente *</label>
              <select className="input-field" value={form.clienteId} onChange={e => handleClienteChange(e.target.value)}>
                <option value="">Seleccionar</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Equipo *</label>
              <select className="input-field" value={form.equipoId} onChange={e => set('equipoId', e.target.value)} disabled={!form.clienteId}>
                <option value="">Seleccionar</option>
                {equiposByCliente.map(e => <option key={e.id} value={e.id}>{e.marca} {e.modelo}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Técnico (opcional)</label>
              <select className="input-field" value={form.tecnicoId} onChange={e => set('tecnicoId', e.target.value)}>
                <option value="">Sin asignar</option>
                {tecnicos.filter(t => t.disponible).map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select className="input-field" value={form.prioridad} onChange={e => set('prioridad', e.target.value)}>
                <option value="BAJA">Baja</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descripción del problema</label>
            <textarea className="input-field resize-none" rows={3} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Describe el problema o solicitud..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Creando...' : 'Crear orden'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={`Editar orden #${selected?.id}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="label">Estado</label>
            <select className="input-field" value={editForm.estado} onChange={e => setEditForm(p => ({ ...p, estado: e.target.value }))}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="label">Asignar técnico</label>
            <select className="input-field" value={editForm.tecnicoId} onChange={e => setEditForm(p => ({ ...p, tecnicoId: e.target.value }))}>
              <option value="">Sin asignar</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre} — {t.especialidad}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : 'Actualizar'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      {selected && (
        <Modal open={detailModal} onClose={() => setDetailModal(false)} title={`Detalle orden #${selected.id}`} maxWidth="max-w-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4">
                <p className="text-xs text-slate-400 mb-1">Cliente</p>
                <p className="font-semibold">{selected.cliente?.nombre}</p>
                <p className="text-xs text-slate-500">{selected.cliente?.telefono}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-slate-400 mb-1">Equipo</p>
                <p className="font-semibold">{selected.equipo?.marca} {selected.equipo?.modelo}</p>
                <p className="text-xs text-slate-500">{selected.equipo?.tipo} • {selected.equipo?.serial}</p>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-400 mb-1">Descripción</p>
              <p className="text-sm">{selected.descripcion || 'Sin descripción'}</p>
            </div>
            <div className="flex gap-3">
              <StatusBadge estado={selected.estado} />
              <PrioridadBadge prioridad={selected.prioridad} />
            </div>
            {selected.mantenimientos?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Mantenimientos registrados ({selected.mantenimientos.length})</p>
                {selected.mantenimientos.map(m => (
                  <div key={m.id} className="card p-4 mb-2">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`badge ${m.tipo === 'PREVENTIVO' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'}`}>{m.tipo}</span>
                      <span className="text-xs text-slate-500">{m.fechaRealizado ? new Date(m.fechaRealizado).toLocaleDateString('es-CO') : ''}</span>
                    </div>
                    <p className="text-sm text-slate-300">{m.descripcion}</p>
                    {m.detalleRepuestos?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400 mb-1">Repuestos:</p>
                        {m.detalleRepuestos.map(dr => (
                          <p key={dr.id} className="text-xs text-slate-500">{dr.repuesto.nombre} × {dr.cantidad} — ${Number(dr.costoUnitario).toLocaleString('es-CO')}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar orden" message="¿Eliminar esta orden de trabajo?" />
    </div>
  );
}
