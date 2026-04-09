import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PageLoader, Spinner } from '../../components/ui';

export default function SolicitarServicio() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ equipoId: '', descripcion: '', prioridad: 'NORMAL' });

  useEffect(() => {
    api.get('/equipos').then(r => setEquipos(r.data)).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

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

        {equipos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-2">No tienes equipos registrados.</p>
            <p className="text-slate-500 text-sm">Contacta al administrador para registrar tus equipos.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Equipo a atender *</label>
              <select className="input-field" value={form.equipoId} onChange={e => set('equipoId', e.target.value)}>
                <option value="">Seleccionar equipo</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.marca} {eq.modelo} — {eq.tipo} {eq.serial ? `(${eq.serial})` : ''}</option>
                ))}
              </select>
            </div>

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

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
              {saving ? <><Spinner size={14} />Enviando...</> : <><Wind size={16} />Solicitar servicio</>}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
