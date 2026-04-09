import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, Phone, MapPin } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, PageLoader, SearchInput } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { nombre: '', email: '', password: '', telefono: '', direccion: '' };

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get('/clientes').then(r => setClientes(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ nombre: c.nombre, email: c.usuario?.email || '', password: '', telefono: c.telefono, direccion: c.direccion });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email) return toast.error('Nombre y email requeridos');
    if (!editing && !form.password) return toast.error('Contraseña requerida para nuevo cliente');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/clientes/${editing.id}`, { nombre: form.nombre, telefono: form.telefono, direccion: form.direccion });
      } else {
        await api.post('/clientes', form);
      }
      toast.success(editing ? 'Cliente actualizado' : 'Cliente creado');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clientes/${deleteId}`);
      toast.success('Cliente desactivado');
      setDeleteId(null);
      load();
    } catch { toast.error('Error al eliminar'); }
    finally { setDeleting(false); }
  };

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.usuario?.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes registrados</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      <div className="max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Sin clientes" description="Crea el primer cliente del sistema" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Nuevo cliente</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card hover:border-slate-600 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 font-bold">
                    {c.nombre[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{c.nombre}</p>
                    <p className="text-xs text-slate-400">{c.usuario?.email}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteId(c.id)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone size={13} />
                  <span>{c.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin size={13} />
                  <span className="truncate">{c.direccion || 'Sin dirección'}</span>
                </div>
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500">
                <span><strong className="text-slate-300">{c._count?.equipos}</strong> equipos</span>
                <span><strong className="text-slate-300">{c._count?.ordenes}</strong> órdenes</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input className="input-field" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@ejemplo.com" disabled={!!editing} />
          </div>
          {!editing && (
            <div>
              <label className="label">Contraseña *</label>
              <input type="password" className="input-field" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
          )}
          <div>
            <label className="label">Teléfono</label>
            <input className="input-field" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="3001234567" />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input className="input-field" value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle 10 #23-45" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Desactivar cliente"
        message="¿Confirmas desactivar este cliente? Su cuenta quedará inactiva."
      />
    </div>
  );
}
