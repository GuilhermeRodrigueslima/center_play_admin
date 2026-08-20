'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [xtreamUrl, setXtreamUrl] = useState('');
  const [globalMessage, setGlobalMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [toastOk, setToastOk] = useState(true);

  const showToast = (msg: string, ok = true) => {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setXtreamUrl(d.xtreamUrl || '');
        setGlobalMessage(d.globalMessage || '');
      })
      .catch(() => showToast('Erro ao carregar configuracoes', false))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xtreamUrl, globalMessage: globalMessage || null }),
      });
      if (res.ok) {
        showToast('Configuracoes salvas com sucesso!');
      } else {
        showToast('Erro ao salvar', false);
      }
    } catch {
      showToast('Erro de conexao', false);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', background: '#1a1a1a',
    border: '1px solid #333', borderRadius: '10px', color: '#fff',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  if (loading) return (
    <div style={{ color: '#666', textAlign: 'center', padding: '80px', fontSize: '1rem' }}>Carregando...</div>
  );

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: toastOk ? '#22c55e' : '#e50914', color: '#fff', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, zIndex: 999, fontSize: '0.9rem' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Configuracoes</h1>
        <p style={{ color: '#666', margin: '6px 0 0', fontSize: '0.9rem' }}>Configuracoes gerais do servidor IPTV</p>
      </div>

      <div style={{ maxWidth: '640px' }}>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '14px', padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid #222' }}>
            Servidor Xtream Codes
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              URL Padrao do Servidor *
            </label>
            <input
              type="text"
              style={inputStyle}
              value={xtreamUrl}
              onChange={e => setXtreamUrl(e.target.value)}
              placeholder="http://seu-provedor.com:80"
              onFocus={e => (e.target.style.borderColor = '#e50914')}
              onBlur={e => (e.target.style.borderColor = '#333')}
            />
            <p style={{ color: '#555', fontSize: '0.78rem', margin: '8px 0 0' }}>
              Esta URL e retornada ao app Flutter no login. Permanece oculta dos clientes.
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Mensagem Global (opcional)
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              value={globalMessage}
              onChange={e => setGlobalMessage(e.target.value)}
              placeholder="Ex: Manutencao programada para sabado as 02:00..."
              onFocus={e => (e.target.style.borderColor = '#e50914')}
              onBlur={e => (e.target.style.borderColor = '#333')}
            />
            <p style={{ color: '#555', fontSize: '0.78rem', margin: '8px 0 0' }}>
              Exibida para todos os usuarios do app. Deixe em branco para ocultar.
            </p>
          </div>

          <button
            onClick={save}
            disabled={saving}
            style={{ background: saving ? '#555' : '#e50914', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px 32px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}
          >
            {saving ? 'Salvando...' : 'Salvar Configuracoes'}
          </button>
        </div>

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '14px', padding: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: '0 0 16px' }}>Endpoint de Autenticacao</h2>
          <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '12px' }}>
            Configure o app Flutter para usar este endpoint:
          </p>
          <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#4ade80' }}>
            POST /api/auth/app
          </div>
          <p style={{ color: '#555', fontSize: '0.78rem', margin: '10px 0 0' }}>
            Body: username + password  |  Retorna: xtreamUrl
          </p>
        </div>
      </div>
    </div>
  );
}
