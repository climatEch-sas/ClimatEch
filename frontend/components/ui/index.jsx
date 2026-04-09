import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

// ─── Modal ───────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative w-full ${maxWidth} bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col`}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'blue', trend, delay = 0 }) {
  const colors = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
    green: { bg: 'bg-green-500/10', icon: 'text-green-400', border: 'border-green-500/20' },
    orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', border: 'border-orange-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', border: 'border-red-500/20' },
  };
  const c = colors[color] || colors.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`card border ${c.border} hover:scale-[1.02] transition-transform cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
          {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={22} className={c.icon} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Badge / Status ───────────────────────────────────────────────
export function StatusBadge({ estado }) {
  const map = {
    PENDIENTE:   { cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', label: 'Pendiente' },
    EN_PROCESO:  { cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30', label: 'En Proceso' },
    COMPLETADO:  { cls: 'bg-green-500/15 text-green-400 border border-green-500/30', label: 'Completado' },
    CANCELADO:   { cls: 'bg-red-500/15 text-red-400 border border-red-500/30', label: 'Cancelado' },
    APROBADA:    { cls: 'bg-green-500/15 text-green-400 border border-green-500/30', label: 'Aprobada' },
    RECHAZADA:   { cls: 'bg-red-500/15 text-red-400 border border-red-500/30', label: 'Rechazada' },
  };
  const s = map[estado] || { cls: 'bg-slate-500/15 text-slate-400', label: estado };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function PrioridadBadge({ prioridad }) {
  const map = {
    BAJA:    'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    NORMAL:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    ALTA:    'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    URGENTE: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  return <span className={`badge ${map[prioridad] || ''}`}>{prioridad}</span>;
}

// ─── Loading spinner ──────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="animate-spin text-brand-primary" />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Spinner size={32} />
        <p className="text-slate-400 text-sm mt-3">Cargando...</p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-500" />
      </div>
      <h3 className="text-white font-semibold text-lg">{title}</h3>
      {description && <p className="text-slate-400 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
        <button onClick={onConfirm} disabled={loading} className="btn-danger text-sm">
          {loading ? <Spinner size={14} /> : null}
          Confirmar
        </button>
      </div>
    </Modal>
  );
}

// ─── Search input ─────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 py-2.5 text-sm"
      />
    </div>
  );
}
