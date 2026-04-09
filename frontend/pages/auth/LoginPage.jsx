import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Completa todos los campos');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Bienvenido, ${user.nombre}`);
      if (user.rol === 'ADMIN') navigate('/admin');
      else if (user.rol === 'TECNICO') navigate('/tecnico');
      else navigate('/cliente');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (email, password) => {
    setForm({ email, password });
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bienvenido, ${user.nombre}`);
      if (user.rol === 'ADMIN') navigate('/admin');
      else if (user.rol === 'TECNICO') navigate('/tecnico');
      else navigate('/cliente');
    } catch { toast.error('Error al iniciar sesión demo'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex">
      {/* Left - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-slate-900 to-brand-dark" />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-blue-500/10 border border-blue-500/10"
              style={{
                width: Math.random() * 200 + 50,
                height: Math.random() * 200 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-center p-16">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center">
              <Wind size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ClimatEch</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Gestión inteligente<br />
            <span className="text-brand-primary">de climatización</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            Digitaliza y optimiza todos los procesos de mantenimiento de equipos de climatización en una plataforma profesional.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { value: '100%', label: 'Digital' },
              { value: '3', label: 'Roles' },
              { value: '∞', label: 'Órdenes' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-brand-primary">{value}</div>
                <div className="text-slate-400 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center">
              <Wind size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold">ClimatEch</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Iniciar sesión</h2>
          <p className="text-slate-400 text-sm mb-8">Accede a tu cuenta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                className="input-field"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ingresando...</span>
              ) : (
                <span className="flex items-center gap-2">Ingresar <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-slate-500 text-xs text-center mb-3">— Cuentas demo —</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', email: 'admin@climatech.com', password: 'admin123', color: 'blue' },
                { label: 'Técnico', email: 'carlos@climatech.com', password: 'tecnico123', color: 'green' },
                { label: 'Cliente', email: 'empresa@abc.com', password: 'cliente123', color: 'purple' },
              ].map(({ label, email, password, color }) => (
                <button
                  key={label}
                  onClick={() => demoLogin(email, password)}
                  className={`text-xs py-2 px-3 rounded-xl border transition-all
                    ${color === 'blue' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' : ''}
                    ${color === 'green' ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' : ''}
                    ${color === 'purple' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20' : ''}
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-slate-500 text-sm text-center mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-brand-primary hover:text-blue-400 font-medium">
              Regístrate
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
