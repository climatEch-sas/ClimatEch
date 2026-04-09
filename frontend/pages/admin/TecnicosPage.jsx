import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, PageLoader, SearchInput } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { nombre: '', email: '', password: '', especialidad: '', disponible: true };

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => api.get('/tecnicos').then(r => setTecnicos(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ nombre: t.nombre, email: t.usuario?.email || '', password: '', especialidad: t.especialidad, disponible: t.disponible });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email) return toast.error('Nombre y email requeridos');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/tecnicos/${editing.id}`, { nombre: form.nombre, especialidad: form.especialidad, disponible: form.disponible });
      } else {
        await api.post('/tecnicos', form);
      }
      toast.success(editing ? 'Técnico actualizado' : 'Técnico creado');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tecnicos/${deleteId}`);
      toast.success('Técnico desactivado');
      setDeleteId(null); load();
    } catch { toast.error('Error'); }
  };

  const filtered = tecnicos.filter(t =>
    t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.especialidad.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Técnicos</h1>
          <p className="page-subtitle">{tecnicos.length} técnicos registrados</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Nuevo técnico</button>
      </div>

      <div className="max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar técnico..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="Sin técnicos" description="Agrega técnicos al sistema" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Nuevo técnico</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card hover:border-slate-600 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-green-400 font-bold">
                    {t.nombre[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t.nombre}</p>
                    <p className="text-xs text-slate-400">{t.especialidad}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteId(t.id)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5 text-sm">
                  {t.disponible
                    ? <><CheckCircle size={14} className="text-green-400" /><span className="text-green-400">Disponible</span></>
                    : <><XCircle size={14} className="text-red-400" /><span className="text-red-400">No disponible</span></>
                  }
                </div>
                <span className="text-xs text-slate-500">{t._count?.ordenes} órdenes</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar técnico' : 'Nuevo técnico'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input className="input-field" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del técnico" />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} disabled={!!editing} />
          </div>
          {!editing && (
            <div>
              <label className="label">Contraseña *</label>
              <input type="password" className="input-field" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Especialidad</label>
            <input className="input-field" value={form.especialidad} onChange={e => set('especialidad', e.target.value)} placeholder="Aire acondicionado split" />
          </div>
          {editing && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="disponible" checked={form.disponible} onChange={e => set('disponible', e.target.checked)} className="w-4 h-4 accent-brand-primary" />
              <label htmlFor="disponible" className="text-sm text-slate-300">Disponible para órdenes</label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Desactivar técnico" message="¿Confirmas desactivar este técnico?" />
    </div>
  );
}
