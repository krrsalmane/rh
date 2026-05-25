import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import { authApi } from '@/features/auth/api';

const loginSchema = z.object({
  email: z.string().min(1, 'L\'email est requis').email('Format d\'email invalide'),
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await authApi.login({
        email: data.email.trim(),
        password: data.password,
      });
      const { accessToken, user } = response.data;
      dispatch(
        setCredentials({
          user,
          role: user.role,
          accessToken,
          companyId: user.companyId ?? '',
        })
      );
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(
        axiosErr.response?.data?.message ||
          'Email ou mot de passe incorrect. Veuillez réessayer.'
      );
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-2/5 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary-800/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Brand */}
          <div className="mb-14">
            <img 
              src="/assets/images/mayagroup-logo.png" 
              alt="Maya HR" 
              className="h-24 object-contain"
            />
          </div>

          <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
            Plateforme RH
            <br />
            <span className="text-primary-400">intelligente</span>
          </h2>
          <p className="text-slate-400 text-base mb-10">
            Gérez vos ressources humaines en toute simplicité.
          </p>

          <ul className="space-y-4">
            {[
              'Gestion des employés',
              'Documents & Contrats',
              'Congés & Absences',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-primary-400" />
                </div>
                <span className="text-slate-300 text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-slate-600 text-xs">Maya HR Platform · v1.0</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <img 
              src="/assets/images/mayagroup-logo.png" 
              alt="Maya HR" 
              className="h-10 object-contain"
            />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Connexion</h1>
            <p className="text-slate-500 text-sm">Bienvenue sur votre espace RH</p>
          </div>

          {/* Error banner */}
          {serverError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@hrms.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                    ${errors.email
                      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-200 bg-slate-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:bg-white'
                    }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                    ${errors.password
                      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-200 bg-slate-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:bg-white'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Maya HR Platform · © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};
