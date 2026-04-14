import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Cpu, Eye, Wrench, Calendar, User, Package, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, PageLoader, SearchInput } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { tipo: '', marca: '', modelo: '', serial: '', clienteId: '' };

const TIPO_LABEL = { PREVENTIVO: 'Preventivo', CORRECTIVO: 'Correctivo' };
const TIPO_COLOR = {
  PREVENTIVO: 'bg-green-500/15 text-green-400 border-green-500/30',
  CORRECTIVO: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

function HistorialModal({ equipo, open, onClose }) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!open || !equipo) return;
    setDetalle(null);
    setExpanded({});
    setLoading(true);
    api.get(`/equipos/${equipo.id}`)
      .then(r => setDetalle(r.data))
      .catch(() => toast.error('Error al cargar historial'))
      .finally(() => setLoading(false));
  }, [open, equipo]);

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // Aplanar solicitudes: cada orden tiene sus mantenimientos
  const solicitudes = detalle?.ordenes ?? [];

  return (
    <Modal open={open} onClose={onClose} title={`Historial — ${equipo?.marca} ${equipo?.modelo}`} maxWidth="max-w-2xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
            <FileText size={20} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">Este equipo no tiene solicitudes registradas.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {solicitudes.map((orden, i) => {
            const isOpen = expanded[orden.id];
            const hasMant = orden.mantenimientos?.length > 0;

            return (
              <motion.div
                key={orden.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden"
              >
                {/* Cabecera de la solicitud */}
                <button
                  type="button"
                  onClick={() => toggleExpand(orden.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                      <FileText size={13} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Solicitud #{orden.id}
                        {orden.descripcion && (
                          <span className="text-slate-400 font-normal ml-2">· {orden.descripcion.slice(0, 50)}{orden.descripcion.length > 50 ? '…' : ''}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar size={10} />
                          {new Date(orden.createdAt).toLocaleDateString('es-CO')}
                        </span>
                        {orden.tecnico && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <User size={10} />
                            {orden.tecnico.nombre}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          orden.estado === 'COMPLETADO' ? 'bg-green-500/15 text-green-400 border-green-500/30'
                          : orden.estado === 'EN_PROCESO' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : orden.estado === 'CANCELADO' ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
                        }`}>
                          {orden.estado.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-slate-500">{orden.mantenimientos?.length ?? 0} mant.</span>
                    {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </button>

                {/* Detalle expandible */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-slate-700/40 space-y-4">

                        {/* Descripción de la solicitud */}
                        {orden.descripcion && (
                          <div className="flex gap-2 p-3 rounded-lg bg-slate-700/30">
                            <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-slate-400 mb-0.5">Descripción de la solicitud</p>
                              <p className="text-sm text-slate-300">{orden.descripcion}</p>
                            </div>
                          </div>
                        )}

                        {/* Técnico asignado */}
                        {orden.tecnico ? (
                          <div className="flex items-center gap-2 text-sm">
                            <User size={14} className="text-purple-400 shrink-0" />
                            <span className="text-slate-400 text-xs">Técnico:</span>
                            <span className="text-slate-200 font-medium">{orden.tecnico.nombre}</span>
                            {orden.tecnico.especialidad && (
                              <span className="text-xs text-slate-500">· {orden.tecnico.especialidad}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <AlertCircle size={13} />
                            Sin técnico asignado
                          </div>
                        )}

                        {/* Mantenimientos */}
                        {!hasMant ? (
                          <p className="text-xs text-slate-500 italic">Sin mantenimientos registrados en esta solicitud.</p>
                        ) : (
                          <div className="space-y-3">
                            {orden.mantenimientos.map((m) => (
                              <div key={m.id} className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3 space-y-2">

                                {/* Tipo + fecha */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${TIPO_COLOR[m.tipo] ?? 'bg-slate-700/50 text-slate-400 border-slate-600/50'}`}>
                                    <Wrench size={10} />
                                    {TIPO_LABEL[m.tipo] ?? m.tipo}
                                  </span>
                                  {m.fechaRealizado && (
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                      <Calendar size={10} />
                                      {new Date(m.fechaRealizado).toLocaleDateString('es-CO')}
                                    </span>
                                  )}
                                </div>

                                {/* Descripción del mantenimiento */}
                                {m.descripcion && (
                                  <div className="flex gap-2">
                                    <FileText size={13} className="text-slate-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-xs text-slate-500 mb-0.5">Descripción del mantenimiento</p>
                                      <p className="text-sm text-slate-300">{m.descripcion}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Repuestos */}
                                {m.detalleRepuestos?.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-1 mb-2">
                                      <Package size={12} className="text-slate-400" />
                                      <p className="text-xs font-medium text-slate-400">Repuestos utilizados</p>
                                    </div>
                                    <div className="rounded-lg overflow-hidden border border-slate-700/40">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="bg-slate-800/60 text-slate-500">
                                            <th className="text-left px-3 py-1.5 font-medium">Repuesto</th>
                                            <th className="text-center px-3 py-1.5 font-medium w-16">Cant.</th>
                                            <th className="text-right px-3 py-1.5 font-medium w-28">Costo unit.</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {m.detalleRepuestos.map((dr) => (
                                            <tr key={dr.id} className="border-t border-slate-700/30">
                                              <td className="px-3 py-1.5 text-slate-300">{dr.repuesto?.nombre ?? '—'}</td>
                                              <td className="px-3 py-1.5 text-center text-slate-400">{dr.cantidad}</td>
                                              <td className="px-3 py-1.5 text-right text-slate-400">${Number(dr.costoUnitario).toLocaleString('es-CO')}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export default function EquiposPage() {
  const [equipos, setEquipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Historial
  const [historialEquipo, setHistorialEquipo] = useState(null);
  const [historialOpen, setHistorialOpen] = useState(false);

  const load = async () => {
    const [eq, cl] = await Promise.all([api.get('/equipos'), api.get('/clientes')]);
    setEquipos(eq.data); setClientes(cl.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (e) => {
    setEditing(e);
    setForm({ tipo: e.tipo, marca: e.marca, modelo: e.modelo, serial: e.serial || '', clienteId: e.clienteId });
    setModal(true);
  };
  const openHistorial = (e) => { setHistorialEquipo(e); setHistorialOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.tipo || !form.marca || !form.modelo || !form.clienteId) return toast.error('Todos los campos obligatorios');
    setSaving(true);
    try {
      editing ? await api.put(`/equipos/${editing.id}`, form) : await api.post('/equipos', form);
      toast.success(editing ? 'Equipo actualizado' : 'Equipo creado');
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/equipos/${deleteId}`); toast.success('Equipo eliminado'); setDeleteId(null); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const tiposEquipo = ['Split', 'Cassette', 'Centralizado', 'Mini Split', 'VRF', 'Chillers', 'Torres de enfriamiento', 'Fan Coil'];

  const filtered = equipos.filter(e =>
    e.marca.toLowerCase().includes(search.toLowerCase()) ||
    e.modelo.toLowerCase().includes(search.toLowerCase()) ||
    e.tipo.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Equipos</h1>
          <p className="page-subtitle">{equipos.length} equipos registrados</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Nuevo equipo</button>
      </div>

      <div className="max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar equipo..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Cpu} title="Sin equipos" description="Registra equipos de los clientes" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Nuevo equipo</button>} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Equipo</th><th>Tipo</th><th>Serial</th><th>Cliente</th><th>Órdenes</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center"><Cpu size={14} className="text-purple-400" /></div>
                      <div>
                        <p className="font-medium">{e.marca} {e.modelo}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge bg-slate-700/50 text-slate-300">{e.tipo}</span></td>
                  <td className="font-mono text-xs text-slate-400">{e.serial || '—'}</td>
                  <td>{e.cliente?.nombre}</td>
                  <td>{e._count?.ordenes}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openHistorial(e)}
                        title="Ver historial"
                        className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-blue-500/20 flex items-center justify-center text-slate-400 hover:text-blue-400"
                      >
                        <Eye size={13} />
                      </button>
                      <button onClick={() => openEdit(e)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(e.id)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal historial */}
      <HistorialModal
        equipo={historialEquipo}
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
      />

      {/* Modal crear/editar */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar equipo' : 'Nuevo equipo'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select className="input-field" value={form.clienteId} onChange={e => set('clienteId', e.target.value)} disabled={!!editing}>
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo *</label>
            <select className="input-field" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              <option value="">Seleccionar tipo</option>
              {tiposEquipo.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Marca *</label>
              <input className="input-field" value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="LG, Samsung..." />
            </div>
            <div>
              <label className="label">Modelo *</label>
              <input className="input-field" value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="Dual Cool 18000" />
            </div>
          </div>
          <div>
            <label className="label">Serial</label>
            <input className="input-field" value={form.serial} onChange={e => set('serial', e.target.value)} placeholder="ABC-2024-001" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar equipo" message="¿Eliminar este equipo? Esta acción no se puede deshacer." />
    </div>
  );
}
