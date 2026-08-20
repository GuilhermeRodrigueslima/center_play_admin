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
  username: '', password: '', name: '', xtreamUrl: '', expiresAt: '', notes: '', isActive: true,
};

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
      setClients(data);
    } catch {
      showToast('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? clients.filter(c =>
      c.username.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
    ) : clients);
  }, [search, clients]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  };

  const handleAdd = async () => {
    if (!addForm.username || !addForm.password || !addForm.xtreamUrl) {
      showToast('Preencha usuario, senha e URL'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, expiresAt: addForm.expiresAt || null }),
      });
      if (!res.ok) { const d = await res.json(); showToast(d.error || 'Erro'); return; }
      showToast('Cliente criado!');
      setShowAddModal(false);
      setAddForm({ ...EMPTY_FORM });
      loadClients();
    } finally { setSaving(false); }
  };

  const openEdit = (c: Client) => {
    setEditClient(c);
    setEditForm({
      username: c.username, password: c.password, name: c.name || '',
      xtreamUrl: c.xtreamUrl, isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      notes: c.notes || '',
    });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editClient) return;
    setSaving(true);
    try {
      const res = await fetch('/api/clients/' + editClient.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, expiresAt: editForm.expiresAt || null }),
      });
      if (!res.ok) { const d = await res.json(); showToast(d.error || 'Erro'); return; }
      showToast('Atualizado!');
      setShowEditModal(false);
      loadClients();
    } finally { setSaving(false); }
  };

  const toggleActive = async (c: Client) => {
    await fetch('/api/clients/' + c.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    loadClients();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;
    await fetch('/api/clients/' + id, { method: 'DELETE' });
    showToast('Excluido!');
    loadClients();
  };

  const handleBulkUpdate = async () => {
    if (!bulkUrl) { showToast('Digite a nova URL'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/clients/bulk-update-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), xtreamUrl: bulkUrl }),
      });
      const d = await res.json();
      showToast(d.updated + ' clientes atualizados!');
      setShowBulkModal(false);
      setBulkUrl('');
      setSelected(new Set());
      loadClients();
    } finally { setSaving(false); }
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#22c55e', color: '#fff', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, zIndex: 999, fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Clientes</h1>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: '0.88rem' }}>
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={btnRed}>+ Novo Cliente</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...inputStyle, width: '280px', flex: 'none' }}
          placeholder="Buscar por nome ou usuario..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={selectAll} style={btnGray}>
          {selected.size === filtered.length && filtered.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}
        </button>
        {selected.size > 0 && (
          <button onClick={() => setShowBulkModal(true)}
            style={{ ...btnRed, background: '#7c3aed' }}>
            Mudar URL em Massa ({selected.size})
          </button>
        )}
        {selected.size > 0 && (
          <span style={{ color: '#666', fontSize: '0.85rem' }}>{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>
            {search ? 'Nenhum cliente encontrado para essa busca' : 'Nenhum cliente cadastrado'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  <th style={{ color: '#555', padding: '14px 16px', textAlign: 'left', width: '40px' }}></th>
                  <th style={{ color: '#555', padding: '14px 16px', textAlign: 'left' }}>Nome / Usuario</th>
                  <th style={{ color: '#555', padding: '14px 16px', textAlign: 'left' }}>Senha</th>
                  <th style={{ color: '#555', padding: '14px 16px', textAlign: 'left' }}>URL Xtream</th>
                  <th style={{ color: '#555', padding: '14px 16px', textAlign: 'left' }}>Status</th>
                  <th style={{ color: '#555', padding: '14px 16px', textAlign: 'left' }}>Expira</th>
                  <th style={{ color: '#555', padding: '14px 16px', textAlign: 'center' }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}
                    style={{ borderBottom: '1px solid #1a1a1a', background: selected.has(c.id) ? '#180a0a' : 'transparent' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#e50914' }} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{c.name || '—'}</div>
                      <div style={{ color: '#666', fontSize: '0.8rem' }}>@{c.username}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#888', fontFamily: 'monospace' }}>{c.password}</td>
                    <td style={{ padding: '12px 16px', color: '#888', maxWidth: '180px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.xtreamUrl}>
                        {c.xtreamUrl}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><Badge active={c.isActive} /></td>
                    <td style={{ padding: '12px 16px', color: '#888', whiteSpace: 'nowrap' }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => openEdit(c)}
                          style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          Editar
                        </button>
                        <button onClick={() => toggleActive(c)}
                          style={{ background: c.isActive ? '#92400e' : '#166534', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          {c.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => handleDelete(c.id)}
                          style={{ background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <ModalTitle>Novo Cliente</ModalTitle>
          <FormField label="Usuario *" value={addForm.username} onChange={v => setAddForm(f => ({ ...f, username: v }))} placeholder="usuario123" />
          <FormField label="Senha *" value={addForm.password} onChange={v => setAddForm(f => ({ ...f, password: v }))} placeholder="senha123" />
          <FormField label="Nome" value={addForm.name} onChange={v => setAddForm(f => ({ ...f, name: v }))} placeholder="Joao Silva" />
          <FormField label="URL Xtream *" value={addForm.xtreamUrl} onChange={v => setAddForm(f => ({ ...f, xtreamUrl: v }))} placeholder="http://provedor.com:80" />
          <FormField label="Expira em" value={addForm.expiresAt} onChange={v => setAddForm(f => ({ ...f, expiresAt: v }))} type="date" />
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Notas</label>
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observacoes..." />
          </div>
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="addActive" checked={addForm.isActive}
              onChange={e => setAddForm(f => ({ ...f, isActive: e.target.checked }))}
              style={{ width: '16px', height: '16px', accentColor: '#e50914' }} />
            <label htmlFor="addActive" style={{ color: '#aaa', fontSize: '0.88rem' }}>Conta ativa</label>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddModal(false)} style={btnGray} disabled={saving}>Cancelar</button>
            <button onClick={handleAdd} style={btnRed} disabled={saving}>{saving ? 'Salvando...' : 'Criar Cliente'}</button>
          </div>
        </ModalOverlay>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editClient && (
        <ModalOverlay onClose={() => setShowEditModal(false)}>
          <ModalTitle>Editar: {editClient.name || editClient.username}</ModalTitle>
          <FormField label="Usuario" value={editForm.username} onChange={v => setEditForm(f => ({ ...f, username: v }))} />
          <FormField label="Senha" value={editForm.password} onChange={v => setEditForm(f => ({ ...f, password: v }))} />
          <FormField label="Nome" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
          <FormField label="URL Xtream" value={editForm.xtreamUrl} onChange={v => setEditForm(f => ({ ...f, xtreamUrl: v }))} />
          <FormField label="Expira em" value={editForm.expiresAt} onChange={v => setEditForm(f => ({ ...f, expiresAt: v }))} type="date" />
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Notas</label>
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="editActive" checked={editForm.isActive}
              onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
              style={{ width: '16px', height: '16px', accentColor: '#e50914' }} />
            <label htmlFor="editActive" style={{ color: '#aaa', fontSize: '0.88rem' }}>Conta ativa</label>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowEditModal(false)} style={btnGray} disabled={saving}>Cancelar</button>
            <button onClick={handleEdit} style={btnRed} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </ModalOverlay>
      )}

      {/* BULK URL MODAL */}
      {showBulkModal && (
        <ModalOverlay onClose={() => setShowBulkModal(false)}>
          <ModalTitle>Mudar URL em Massa</ModalTitle>
          <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: '20px' }}>
            Aplicar nova URL para <strong style={{ color: '#fff' }}>{selected.size}</strong> cliente{selected.size !== 1 ? 's' : ''} selecionado{selected.size !== 1 ? 's' : ''}.
          </p>
          <FormField label="Nova URL Xtream" value={bulkUrl} onChange={setBulkUrl} placeholder="http://novo-provedor.com:80" />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button onClick={() => setShowBulkModal(false)} style={btnGray} disabled={saving}>Cancelar</button>
            <button onClick={handleBulkUpdate} style={{ ...btnRed, background: '#7c3aed' }} disabled={saving}>
              {saving ? 'Aplicando...' : 'Aplicar a Todos'}
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
