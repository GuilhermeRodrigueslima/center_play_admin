'use client';
import { useEffect, useState, useCallback } from 'react';

interface Client {
  id: string;
  username: string;
  password: string;
  name: string | null;
  xtreamUrl: string;
  isActive: boolean;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  username: '', password: '', name: '', xtreamUrl: 'http://observacaoonline.pro', expiresAt: '', notes: '', isActive: true,
};

// Parser inteligente para qualquer link M3U / HLS / SSIPTV
function parseM3uLink(rawUrl: string) {
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `http://${trimmed}`);
    const hostUrl = `${parsed.protocol}//${parsed.host}`;
    
    // 1. M3U / HLS Completo: get.php?username=XXX&password=YYY...
    if (parsed.searchParams.has('username') && parsed.searchParams.has('password')) {
      return {
        xtreamUrl: hostUrl,
        username: parsed.searchParams.get('username') || '',
        password: parsed.searchParams.get('password') || '',
      };
    }
    
    // 2. M3U / HLS / SSIPTV Curto: /p/USERNAME/PASSWORD/m3u ou /hls ou /ssiptv
    const pMatch = parsed.pathname.match(/\/p\/([^\/]+)\/([^\/]+)/i);
    if (pMatch && pMatch[1] && pMatch[2]) {
      return {
        xtreamUrl: hostUrl,
        username: pMatch[1],
        password: pMatch[2],
      };
    }
    
    // 3. Streams diretos: /live/USERNAME/PASSWORD/123.m3u8
    const liveMatch = parsed.pathname.match(/\/(?:live|movie|series)\/([^\/]+)\/([^\/]+)/i);
    if (liveMatch && liveMatch[1] && liveMatch[2]) {
      return {
        xtreamUrl: hostUrl,
        username: liveMatch[1],
        password: liveMatch[2],
      };
    }
  } catch (e) {
    console.error('Error parsing M3U link:', e);
  }
  return null;
}

function Badge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: '20px',
      fontSize: '0.75rem', fontWeight: 700,
      background: active ? '#166534' : '#7f1d1d',
      color: active ? '#4ade80' : '#f87171',
    }}>
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#1a1a1a',
  border: '1px solid #333', borderRadius: '8px', color: '#fff',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { color: '#aaa', fontSize: '0.82rem', display: 'block', marginBottom: '5px' };
const btnRed: React.CSSProperties = {
  background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px',
  padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
};
const btnGray: React.CSSProperties = {
  background: '#1a1a1a', color: '#ccc', border: '1px solid #333', borderRadius: '8px',
  padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
};

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid #333', borderRadius: '14px', padding: '32px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

function ModalTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 24px' }}>{children}</h2>;
}

function FormField({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} style={inputStyle} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const [m3uInput, setM3uInput] = useState('');
  const [m3uSuccess, setM3uSuccess] = useState(false);

  const [addForm, setAddForm] = useState({ ...EMPTY_FORM });
  const [editForm, setEditForm] = useState({ username: '', password: '', name: '', xtreamUrl: '', expiresAt: '', notes: '', isActive: true });
  const [bulkUrl, setBulkUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch {
      showToast('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(clients);
    } else {
      const q = search.toLowerCase();
      setFiltered(clients.filter(c =>
        c.username.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q))
      ));
    }
  }, [search, clients]);

  const handleM3uAddChange = (val: string) => {
    setM3uInput(val);
    const parsed = parseM3uLink(val);
    if (parsed && parsed.username && parsed.password) {
      setAddForm(prev => ({
        ...prev,
        xtreamUrl: parsed.xtreamUrl,
        username: parsed.username,
        password: parsed.password,
      }));
      setM3uSuccess(true);
    } else {
      setM3uSuccess(false);
    }
  };

  const handleM3uEditChange = (val: string) => {
    setM3uInput(val);
    const parsed = parseM3uLink(val);
    if (parsed && parsed.username && parsed.password) {
      setEditForm(prev => ({
        ...prev,
        xtreamUrl: parsed.xtreamUrl,
        username: parsed.username,
        password: parsed.password,
      }));
      setM3uSuccess(true);
    } else {
      setM3uSuccess(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.username || !addForm.password || !addForm.xtreamUrl) {
      showToast('Preencha os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) throw new Error();
      setShowAddModal(false);
      setAddForm({ ...EMPTY_FORM });
      setM3uInput('');
      setM3uSuccess(false);
      showToast('Cliente criado com sucesso!');
      loadClients();
    } catch {
      showToast('Erro ao criar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClient) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${editClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      setShowEditModal(false);
      setEditClient(null);
      setM3uInput('');
      setM3uSuccess(false);
      showToast('Cliente atualizado!');
      loadClients();
    } catch {
      showToast('Erro ao atualizar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      showToast('Cliente excluído');
      loadClients();
    } catch {
      showToast('Erro ao excluir cliente');
    }
  };

  const handleToggleActive = async (client: Client) => {
    try {
      await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...client, isActive: !client.isActive }),
      });
      loadClients();
    } catch {
      showToast('Erro ao alterar status');
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/clients/bulk-update-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), xtreamUrl: bulkUrl.trim() }),
      });
      if (!res.ok) throw new Error();
      setShowBulkModal(false);
      setBulkUrl('');
      setSelected(new Set());
      showToast('URLs atualizadas em massa!');
      loadClients();
    } catch {
      showToast('Erro ao atualizar em massa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#e50914', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, zIndex: 999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Gerenciador de Clientes</h1>
          <p style={{ color: '#666', fontSize: '0.85rem', margin: '4px 0 0' }}>{clients.length} cliente(s) cadastrado(s)</p>
        </div>
        <div className="mobile-stack" style={{ display: 'flex', gap: '10px', width: typeof window !== 'undefined' && window.innerWidth <= 768 ? '100%' : 'auto' }}>
          {selected.size > 0 && (
            <button onClick={() => setShowBulkModal(true)} className="mobile-full" style={{ ...btnGray, borderColor: '#e50914', color: '#fff' }}>
              Massa ({selected.size})
            </button>
          )}
          <button onClick={() => { setM3uInput(''); setM3uSuccess(false); setAddForm({ ...EMPTY_FORM }); setShowAddModal(true); }} className="mobile-full" style={btnRed}>
            + Novo Cliente
          </button>
        </div>
      </div>

      {/* Busca */}
      <div style={{ marginBottom: '18px' }}>
        <input
          type="text"
          placeholder="Buscar por nome ou usuário..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: '360px' }}
        />
      </div>

      {/* Visão Mobile: Cards Elegantes */}
      <div className="md:hidden space-y-3.5 mb-8">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm bg-[#141414] rounded-xl border border-[#222]">
            Nenhum cliente encontrado
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="bg-[#141414] border border-[#222] rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-white text-base">{c.username}</div>
                  <div className="text-xs text-gray-400 font-medium">{c.name || 'Sem nome'}</div>
                </div>
                <button onClick={() => handleToggleActive(c)}>
                  <Badge active={c.isActive} />
                </button>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-2.5 text-xs space-y-1 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-500">Servidor:</span>
                  <span className="font-mono text-[11px] truncate max-w-[180px] text-gray-400">{c.xtreamUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vencimento:</span>
                  <span>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : 'Sem validade'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditClient(c);
                    setEditForm({
                      username: c.username, password: c.password,
                      name: c.name || '', xtreamUrl: c.xtreamUrl,
                      expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
                      notes: c.notes || '', isActive: c.isActive,
                    });
                    setM3uInput('');
                    setM3uSuccess(false);
                    setShowEditModal(true);
                  }}
                  className="flex-1 bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="bg-[#222] hover:bg-red-950/60 text-red-400 border border-[#333] px-3 py-2 rounded-lg text-xs"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Visão Desktop: Tabela Completa */}
      <div className="hidden md:block table-container" style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', color: '#ccc', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222', background: '#161616', textAlign: 'left' }}>
              <th style={{ padding: '14px 16px', width: '36px' }}>
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={selectAll} />
              </th>
              <th style={{ padding: '14px 16px', color: '#888', fontWeight: 600 }}>USUÁRIO</th>
              <th style={{ padding: '14px 16px', color: '#888', fontWeight: 600 }}>NOME</th>
              <th style={{ padding: '14px 16px', color: '#888', fontWeight: 600 }}>URL XTREAM</th>
              <th style={{ padding: '14px 16px', color: '#888', fontWeight: 600 }}>STATUS</th>
              <th style={{ padding: '14px 16px', color: '#888', fontWeight: 600 }}>VENCIMENTO</th>
              <th style={{ padding: '14px 16px', color: '#888', fontWeight: 600, textAlign: 'right' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Nenhum cliente encontrado</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '14px 16px' }}>
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                </td>
                <td style={{ padding: '14px 16px', color: '#fff', fontWeight: 700 }}>{c.username}</td>
                <td style={{ padding: '14px 16px' }}>{c.name || '-'}</td>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#888' }}>{c.xtreamUrl}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button onClick={() => handleToggleActive(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Badge active={c.isActive} />
                  </button>
                </td>
                <td style={{ padding: '14px 16px', color: '#888' }}>
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      setEditClient(c);
                      setEditForm({
                        username: c.username, password: c.password,
                        name: c.name || '', xtreamUrl: c.xtreamUrl,
                        expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
                        notes: c.notes || '', isActive: c.isActive,
                      });
                      setM3uInput('');
                      setM3uSuccess(false);
                      setShowEditModal(true);
                    }}
                    style={{ ...btnGray, padding: '6px 12px', fontSize: '0.8rem', marginRight: '6px' }}
                  >
                    Editar
                  </button>
                  <button onClick={() => handleDelete(c.id)} style={{ ...btnGray, padding: '6px 10px', fontSize: '0.8rem', color: '#f87171' }}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add */}
      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <ModalTitle>Novo Cliente</ModalTitle>

          {/* Parser M3U */}
          <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.82rem', marginBottom: '5px' }}>
              ⚡ Ativação Rápida por Link M3U / HLS / SSIPTV:
            </div>
            <input
              type="text"
              placeholder="Cole o link M3U aqui..."
              value={m3uInput}
              onChange={e => handleM3uAddChange(e.target.value)}
              style={{ ...inputStyle, border: '1px solid #22c55e', fontSize: '0.82rem' }}
            />
            {m3uSuccess && (
              <div style={{ marginTop: '5px', color: '#22c55e', fontSize: '0.75rem', fontWeight: 'bold' }}>
                ✓ Link identificado! Campos preenchidos automaticamente.
              </div>
            )}
          </div>

          <form onSubmit={handleAdd}>
            <FormField label="Usuário *" value={addForm.username} onChange={v => setAddForm({ ...addForm, username: v })} placeholder="usuario" />
            <FormField label="Senha *" value={addForm.password} onChange={v => setAddForm({ ...addForm, password: v })} type="text" placeholder="senha" />
            <FormField label="Nome do Cliente" value={addForm.name} onChange={v => setAddForm({ ...addForm, name: v })} placeholder="ex: João Silva" />
            <FormField label="URL do Servidor Xtream *" value={addForm.xtreamUrl} onChange={v => setAddForm({ ...addForm, xtreamUrl: v })} placeholder="http://servidor.pro" />
            <FormField label="Data de Vencimento" value={addForm.expiresAt} onChange={v => setAddForm({ ...addForm, expiresAt: v })} type="date" />
            <FormField label="Observações" value={addForm.notes} onChange={v => setAddForm({ ...addForm, notes: v })} placeholder="Plano mensal, etc." />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={btnGray}>Cancelar</button>
              <button type="submit" disabled={saving} style={btnRed}>{saving ? 'Salvando...' : 'Criar Cliente'}</button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Modal Edit */}
      {showEditModal && (
        <ModalOverlay onClose={() => setShowEditModal(false)}>
          <ModalTitle>Editar Cliente</ModalTitle>

          {/* Parser M3U */}
          <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.82rem', marginBottom: '5px' }}>
              ⚡ Ativação Rápida por Link M3U / HLS / SSIPTV:
            </div>
            <input
              type="text"
              placeholder="Cole o link M3U para substituir..."
              value={m3uInput}
              onChange={e => handleM3uEditChange(e.target.value)}
              style={{ ...inputStyle, border: '1px solid #22c55e', fontSize: '0.82rem' }}
            />
            {m3uSuccess && (
              <div style={{ marginTop: '5px', color: '#22c55e', fontSize: '0.75rem', fontWeight: 'bold' }}>
                ✓ Link identificado! Campos preenchidos automaticamente.
              </div>
            )}
          </div>

          <form onSubmit={handleEdit}>
            <FormField label="Usuário *" value={editForm.username} onChange={v => setEditForm({ ...editForm, username: v })} />
            <FormField label="Senha *" value={editForm.password} onChange={v => setEditForm({ ...editForm, password: v })} type="text" />
            <FormField label="Nome do Cliente" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
            <FormField label="URL do Servidor Xtream *" value={editForm.xtreamUrl} onChange={v => setEditForm({ ...editForm, xtreamUrl: v })} />
            <FormField label="Data de Vencimento" value={editForm.expiresAt} onChange={v => setEditForm({ ...editForm, expiresAt: v })} type="date" />
            <FormField label="Observações" value={editForm.notes} onChange={v => setEditForm({ ...editForm, notes: v })} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button type="button" onClick={() => setShowEditModal(false)} style={btnGray}>Cancelar</button>
              <button type="submit" disabled={saving} style={btnRed}>{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Modal Bulk */}
      {showBulkModal && (
        <ModalOverlay onClose={() => setShowBulkModal(false)}>
          <ModalTitle>Mudar URL em Massa</ModalTitle>
          <p style={{ color: '#888', fontSize: '0.88rem', margin: '0 0 20px' }}>
            Atualizando URL para <strong>{selected.size}</strong> cliente(s) selecionado(s).
          </p>
          <form onSubmit={handleBulkUpdate}>
            <FormField label="Nova URL Xtream *" value={bulkUrl} onChange={setBulkUrl} placeholder="http://novo-servidor.pro" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button type="button" onClick={() => setShowBulkModal(false)} style={btnGray}>Cancelar</button>
              <button type="submit" disabled={saving} style={btnRed}>{saving ? 'Atualizando...' : 'Atualizar Todos'}</button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}
