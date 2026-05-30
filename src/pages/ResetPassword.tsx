import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast, profile, user, updateProfile } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }
    setLoading(true);
    
    // 1. Update auth password
    const { error: authError } = await supabase.auth.updateUser({
      password: password.trim(),
    });

    if (authError) {
      setLoading(false);
      showToast(authError.message, 'error');
      return;
    }

    // 2. Update profile must_change_password flag
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('user_id', user.id);

      if (profileError) {
        setLoading(false);
        showToast('Error al actualizar el perfil', 'error');
        return;
      }
      
      // Update local context profile
      updateProfile({ ...profile, must_change_password: false });
      showToast('Contraseña actualizada correctamente', 'success');
      navigate('/dashboard', { replace: true });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#020617]">
      {/* Ambient background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[100px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glass card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-5"
            >
              <ShieldCheck className="text-white" size={32} strokeWidth={1.5} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-2xl font-bold tracking-tight text-white text-center"
            >
              Seguridad de la Cuenta
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-sm text-slate-400 mt-2 font-medium text-center"
            >
              Por favor, configurá una nueva contraseña para continuar.
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  strokeWidth={1.5}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                    transition-all duration-200"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" strokeWidth={1.5} />
                  Actualizando...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
