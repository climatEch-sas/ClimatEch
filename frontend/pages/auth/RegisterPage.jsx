import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', direccion: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) return toast.error('Completa los campos requeridos');
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, rol: 'CLIENTE' });
      toast.success('Cuenta creada. Inicia sesión');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center">
            <Wind size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold">ClimatEch</span>
        </div>

        <h2 className="text-2xl font-bold mb-1">Crear cuenta</h2>
        <p className="text-slate-400 text-sm mb-8">Regístrate como cliente</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre completo *</label>
            <input className="input-field" placeholder="Tu nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
          </div>
          <div>
            <label className="label">Correo electrónico *</label>
            <input type="email" className="input-field" placeholder="correo@ejemplo.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Contraseña *</label>
            <input type="password" className="input-field" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input-field" placeholder="3001234567" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input className="input-field" placeholder="Calle 10 #23-45" value={form.direccion} onChange={e => set('direccion', e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
            {loading
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</span>
              : <span className="flex items-center gap-2">Crear cuenta <ArrowRight size={16} /></span>
            }
          </button>
        </form>

        <p className="text-slate-500 text-sm text-center mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-primary hover:text-blue-400 font-medium">Inicia sesión</Link>
        </p>
      </motion.div>
    </div>
  );
}
