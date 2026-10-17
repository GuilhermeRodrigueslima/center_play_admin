'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor, digite a senha mestra.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        // Redirecionamento completo do navegador para garantir transmissão de cookies
        window.location.href = '/admin';
      } else {
        setError(data.error || 'Senha incorreta.');
      }
    } catch {
      setError('Erro de conexão ao tentar fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(circle at center, #1b0c30 0%, #080311 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="w-full max-w-md bg-[#110620]/90 border border-[#2d124d] p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/30 mb-3 shadow-lg shadow-purple-950/50">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            CENTER <span className="text-[#a855f7]">PLAY</span>
          </h1>
          <p className="text-gray-400 text-xs tracking-wider uppercase mt-1 font-semibold">
            Painel Administrativo
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
              Senha Mestra
            </label>
            <input
              type="password"
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
              className="w-full px-4 py-3 bg-[#1a0a2e] border border-[#3b1764] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/20 transition-all text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs text-center font-medium animate-shake">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Painel</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#2d124d]/60 text-center text-[11px] text-gray-500">
          Acesso restrito ao administrador Center Play
        </div>
      </div>
    </div>
  );
}