import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Cpu } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, PageLoader, SearchInput } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { tipo: '', marca: '', modelo: '', serial: '', clienteId: '' };

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
