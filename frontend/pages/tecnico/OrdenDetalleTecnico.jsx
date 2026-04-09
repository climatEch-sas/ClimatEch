import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, CheckCircle, Upload, Wrench } from 'lucide-react';
import { PageLoader, StatusBadge, PrioridadBadge, Spinner } from '../../components/ui';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function OrdenDetalleTecnico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [repuestosDisp, setRepuestosDisp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    tipo: 'PREVENTIVO',
    descripcion: '',
    evidenciaUrl: '',
    repuestos: []
  });

  const load = async () => {
    const [or, rp] = await Promise.all([api.get(`/ordenes/${id}`), api.get('/repuestos')]);
    setOrden(or.data); setRepuestosDisp(rp.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const addRepuesto = () => setForm(p => ({ ...p, repuestos: [...p.repuestos, { repuestoId: '', cantidad: 1, costoUnitario: '' }] }));
  const setRep = (i, k, v) => setForm(p => {
    const reps = [...p.repuestos]; reps[i] = { ...reps[i], [k]: v };
    if (k === 'repuestoId') {
      const r = repuestosDisp.find(r => r.id === Number(v));
      if (r) reps[i].costoUnitario = r.costo;
    }
    return { ...p, repuestos: reps };
  });
  const removeRep = (i) => setForm(p => ({ ...p, repuestos: p.repuestos.filter((_, idx) => idx !== i) }));

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const r = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(p => ({ ...p, evidenciaUrl: r.data.url }));
      toast.success('Imagen subida');
    } catch { toast.error('Error al subir imagen'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descripcion) return toast.error('La descripción es requerida');
    setSaving(true);
    try {
      await api.post('/mantenimientos', { ...form, ordenId: Number(id) });
      toast.success('Mantenimiento registrado');
      setForm({ tipo: 'PREVENTIVO', descripcion: '', evidenciaUrl: '', repuestos: [] });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al registrar'); }
    finally { setSaving(false); }
  };

  const handleCompletar = async () => {
    setCompleting(true);
    try {
      await api.post('/mantenimientos/completar', { ordenId: Number(id) });
      toast.success('¡Servicio completado!');
      load();
    } catch { toast.error('Error'); }
    finally { setCompleting(false); }
  };

  if (loading) return <PageLoader />;
  if (!orden) return <p className="text-slate-400">Orden no encontrada</p>;

  const puedeRegistrar = orden.estado !== 'COMPLETADO' && orden.estado !== 'CANCELADO';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title mb-0">Orden #{orden.id}</h1>
          <p className="page-subtitle">{orden.cliente?.nombre}</p>
        </div>
        <div className="flex gap-2 ml-auto">
          <PrioridadBadge prioridad={orden.prioridad} />
          <StatusBadge estado={orden.estado} />
        </div>
      </div>

      {/* Info equipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Equipo', value: `${orden.equipo?.marca} ${orden.equipo?.modelo}`, sub: orden.equipo?.tipo },
          { label: 'Cliente', value: orden.cliente?.nombre, sub: orden.cliente?.telefono },
          { label: 'Serial', value: orden.equipo?.serial || '—', sub: `Creada: ${new Date(orden.createdAt).toLocaleDateString('es-CO')}` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="font-semibold text-sm">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {orden.descripcion && (
        <div className="card p-4">
          <p className="text-xs text-slate-400 mb-1">Descripción del problema</p>
          <p className="text-sm">{orden.descripcion}</p>
        </div>
      )}

      {/* Mantenimientos previos */}
      {orden.mantenimientos?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Mantenimientos registrados ({orden.mantenimientos.length})</h3>
          <div className="space-y-3">
            {orden.mantenimientos.map(m => (
              <div key={m.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                <div className="flex justify-between items-start mb-2">
                  <span className={`badge ${m.tipo === 'PREVENTIVO' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'}`}>{m.tipo}</span>
                  {m.fechaRealizado && <span className="text-xs text-slate-500">{new Date(m.fechaRealizado).toLocaleDateString('es-CO')}</span>}
                </div>
                <p className="text-sm text-slate-300 mb-2">{m.descripcion}</p>
                {m.evidenciaUrl && (
                  <a href={m.evidenciaUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-primary hover:underline">Ver evidencia →</a>
                )}
                {m.detalleRepuestos?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Repuestos usados:</p>
                    <div className="flex flex-wrap gap-2">
                      {m.detalleRepuestos.map(dr => (
                        <span key={dr.id} className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg">
                          {dr.repuesto.nombre} × {dr.cantidad}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario nuevo mantenimiento */}
      {puedeRegistrar && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Wrench size={16} className="text-green-400" />
            Registrar mantenimiento
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo</label>
                <select className="input-field" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                  <option value="PREVENTIVO">Preventivo</option>
                  <option value="CORRECTIVO">Correctivo</option>
                </select>
              </div>
              <div>
                <label className="label">Evidencia (imagen)</label>
                <div className="flex gap-2">
                  <label className="btn-secondary cursor-pointer text-sm py-2 flex-1 justify-center">
                    <Upload size={14} />
                    {uploading ? 'Subiendo...' : 'Subir foto'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  </label>
                </div>
                {form.evidenciaUrl && <p className="text-xs text-green-400 mt-1">✓ Imagen cargada</p>}
              </div>
            </div>
            <div>
              <label className="label">Descripción *</label>
              <textarea className="input-field resize-none" rows={3} value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Describe el trabajo realizado..." />
            </div>

            {/* Repuestos */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label mb-0">Repuestos utilizados</label>
                <button type="button" onClick={addRepuesto} className="text-xs text-brand-primary hover:text-blue-400 flex items-center gap-1"><Plus size={12} />Agregar</button>
              </div>
              {form.repuestos.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <select className="input-field col-span-5 text-sm py-2" value={r.repuestoId} onChange={e => setRep(i, 'repuestoId', e.target.value)}>
                    <option value="">Seleccionar repuesto</option>
                    {repuestosDisp.map(rp => <option key={rp.id} value={rp.id}>{rp.nombre}</option>)}
                  </select>
                  <input type="number" className="input-field col-span-2 text-sm py-2" placeholder="Cant." min="1" value={r.cantidad} onChange={e => setRep(i, 'cantidad', e.target.value)} />
                  <input type="number" className="input-field col-span-4 text-sm py-2" placeholder="Costo unit." value={r.costoUnitario} onChange={e => setRep(i, 'costoUnitario', e.target.value)} />
                  <button type="button" onClick={() => removeRep(i)} className="col-span-1 text-red-400 hover:text-red-300 flex justify-center"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <><Spinner size={14} /> Guardando...</> : <><Plus size={14} />Registrar mantenimiento</>}
              </button>
              {orden.estado === 'EN_PROCESO' && (
                <button type="button" onClick={handleCompletar} disabled={completing} className="btn-success flex-1 justify-center">
                  {completing ? <Spinner size={14} /> : <CheckCircle size={14} />}
                  Confirmar completado
                </button>
              )}
            </div>
          </form>
        </motion.div>
      )}

      {orden.estado === 'COMPLETADO' && (
        <div className="card p-4 border border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <p className="text-green-400 font-medium">Esta orden fue completada exitosamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}
