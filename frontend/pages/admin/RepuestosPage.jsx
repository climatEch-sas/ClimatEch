import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, PageLoader, SearchInput } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { nombre: '', costo: '', stock: '', unidad: 'unidad' };

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => api.get('/repuestos').then(r => setRepuestos(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ nombre: r.nombre, costo: r.costo, stock: r.stock, unidad: r.unidad || 'unidad' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.costo) return toast.error('Nombre y costo requeridos');
    setSaving(true);
    try {
      editing ? await api.put(`/repuestos/${editing.id}`, form) : await api.post('/repuestos', form);
      toast.success(editing ? 'Repuesto actualizado' : 'Repuesto creado');
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/repuestos/${deleteId}`); toast.success('Repuesto eliminado'); setDeleteId(null); load(); }
    catch { toast.error('No se puede eliminar, está en uso'); }
  };

  const filtered = repuestos.filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Repuestos</h1>
          <p className="page-subtitle">{repuestos.length} repuestos en inventario</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Nuevo repuesto</button>
      </div>

      <div className="max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar repuesto..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Sin repuestos" description="Agrega repuestos al inventario" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Nuevo</button>} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Nombre</th><th>Costo unitario</th><th>Stock</th><th>Unidad</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center"><Package size={14} className="text-orange-400" /></div>
                      <span className="font-medium">{r.nombre}</span>
                    </div>
                  </td>
                  <td className="font-semibold text-green-400">${Number(r.costo).toLocaleString('es-CO')}</td>
                  <td>
                    <span className={`badge ${r.stock > 5 ? 'bg-green-500/15 text-green-400 border border-green-500/30' : r.stock > 0 ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                      {r.stock} disponibles
                    </span>
                  </td>
                  <td className="text-slate-400 text-sm">{r.unidad || '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(r.id)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar repuesto' : 'Nuevo repuesto'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input className="input-field" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Filtro de aire, gas refrigerante..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Costo (COP) *</label>
              <input type="number" className="input-field" value={form.costo} onChange={e => set('costo', e.target.value)} placeholder="35000" />
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" className="input-field" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="label">Unidad de medida</label>
            <select className="input-field" value={form.unidad} onChange={e => set('unidad', e.target.value)}>
              <option value="unidad">Unidad</option>
              <option value="lb">Libra (lb)</option>
              <option value="kg">Kilogramo (kg)</option>
              <option value="litro">Litro</option>
              <option value="metro">Metro</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar repuesto" message="¿Eliminar este repuesto del inventario?" />
    </div>
  );
}
