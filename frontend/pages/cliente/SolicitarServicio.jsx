import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, CheckCircle, Plus, ChevronDown } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PageLoader, Spinner } from '../../components/ui';

const NUEVO_EQUIPO_VALUE = '__nuevo__';

export default function SolicitarServicio() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({ equipoId: '', descripcion: '', prioridad: 'NORMAL' });

  // Estado del formulario de nuevo equipo
  const [showNuevoEquipo, setShowNuevoEquipo] = useState(false);
  const [savingEquipo, setSavingEquipo] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState({ tipo: '', marca: '', modelo: '', serial: '' });

  const loadEquipos = () =>
    api.get('/equipos').then(r => setEquipos(r.data)).finally(() => setLoading(false));

  useEffect(() => { loadEquipos(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setNE = (k, v) => setNuevoEquipo(p => ({ ...p, [k]: v }));

  const handleEquipoChange = (val) => {
    if (val === NUEVO_EQUIPO_VALUE) {
      setShowNuevoEquipo(true);
      set('equipoId', '');
    } else {
      setShowNuevoEquipo(false);
      set('equipoId', val);
    }
  };

  const handleRegistrarEquipo = async (e) => {
    e.preventDefault();
    if (!nuevoEquipo.tipo || !nuevoEquipo.marca || !nuevoEquipo.modelo) {
      return toast.error('Tipo, marca y modelo son requeridos');
    }
    setSavingEquipo(true);
    try {
      const res = await api.post('/equipos', nuevoEquipo);
      toast.success('Equipo registrado correctamente');
      // Recargar lista y seleccionar el nuevo
      await loadEquipos();
      setEquipos(prev => {
        // Si loadEquipos no actualizó aún, agregamos manualmente
        const exists = prev.find(e => e.id === res.data.id);
        return exists ? prev : [res.data, ...prev];
      });
      set('equipoId', String(res.data.id));
      setShowNuevoEquipo(false);
      setNuevoEquipo({ tipo: '', marca: '', modelo: '', serial: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar equipo');
    } finally {
      setSavingEquipo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.equipoId) return toast.error('Selecciona un equipo');
    setSaving(true);
    try {
      await api.post('/ordenes', form);
      setDone(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Error al solicitar'); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;

  if (done) return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-6">
        <CheckCircle size={36} className="text-green-400" />
      </motion.div>
      <h2 className="text-2xl font-bold mb-2">¡Solicitud enviada!</h2>
      <p className="text-slate-400 mb-8">Tu solicitud de servicio fue registrada exitosamente. Un técnico será asignado pronto.</p>
      <div className="flex gap-3">
        <button onClick={() => setDone(false)} className="btn-secondary">Nueva solicitud</button>
        <button onClick={() => navigate('/cliente/ordenes')} className="btn-primary">Ver mis órdenes</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Solicitar servicio</h1>
        <p className="page-subtitle">Crea una nueva orden de mantenimiento</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-3 mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <Wind size={20} className="text-blue-400 shrink-0" />
          <p className="text-sm text-blue-300">Tu solicitud será revisada y un técnico será asignado lo antes posible.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Equipo a atender */}
          <div>
            <label className="label">Equipo a atender *</label>
            <select
              className="input-field"
              value={showNuevoEquipo ? NUEVO_EQUIPO_VALUE : form.equipoId}
              onChange={e => handleEquipoChange(e.target.value)}
            >
              <option value="">Seleccionar equipo</option>
              {equipos.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.marca} {eq.modelo} — {eq.tipo}{eq.serial ? ` (${eq.serial})` : ''}
                </option>
              ))}
              <option value={NUEVO_EQUIPO_VALUE}>➕ Registrar nuevo equipo...</option>
            </select>
          </div>

          {/* Panel de nuevo equipo */}
          <AnimatePresence>
            {showNuevoEquipo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Plus size={15} className="text-blue-400" />
                    <p className="text-sm font-semibold text-blue-300">Nuevo equipo</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Tipo *</label>
                      <input
                        className="input-field text-sm py-2"
                        placeholder="Ej: Aire acondicionado"
                        value={nuevoEquipo.tipo}
                        onChange={e => setNE('tipo', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Marca *</label>
                      <input
                        className="input-field text-sm py-2"
                        placeholder="Ej: LG"
                        value={nuevoEquipo.marca}
                        onChange={e => setNE('marca', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Modelo *</label>
                      <input
                        className="input-field text-sm py-2"
                        placeholder="Ej: S12EQ"
                        value={nuevoEquipo.modelo}
                        onChange={e => setNE('modelo', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Serial</label>
                      <input
                        className="input-field text-sm py-2"
                        placeholder="Opcional"
                        value={nuevoEquipo.serial}
                        onChange={e => setNE('serial', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setShowNuevoEquipo(false); setNuevoEquipo({ tipo: '', marca: '', modelo: '', serial: '' }); }}
                      className="btn-secondary text-xs py-2 px-4"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={savingEquipo}
                      onClick={handleRegistrarEquipo}
                      className="btn-primary text-xs py-2 px-4"
                    >
                      {savingEquipo ? <><Spinner size={12} />Registrando...</> : <><Plus size={12} />Registrar equipo</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prioridad */}
          <div>
            <label className="label">Prioridad</label>
            <div className="grid grid-cols-4 gap-2">
              {['BAJA', 'NORMAL', 'ALTA', 'URGENTE'].map(p => (
                <button key={p} type="button"
                  onClick={() => set('prioridad', p)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all
                    ${form.prioridad === p
                      ? p === 'URGENTE' ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : p === 'ALTA' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : p === 'NORMAL' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-slate-700 border-slate-600 text-slate-300'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                >{p}</button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="label">Descripción del problema</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              placeholder="Describe lo que está ocurriendo con el equipo..."
            />
          </div>

          <button type="submit" disabled={saving || showNuevoEquipo} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
            {saving ? <><Spinner size={14} />Enviando...</> : <><Wind size={16} />Solicitar servicio</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
