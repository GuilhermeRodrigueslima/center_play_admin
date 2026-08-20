'use client';

import { useState, useEffect } from 'react';

interface Device {
  id: string;
  macAddress: string;
  deviceKey: string;
  name: string | null;
  xtreamUrl: string | null;
  username: string | null;
  password: string | null;
  isActive: boolean;
  expiresAt: string | null;
  lastSeenAt: string | null;
  notes: string | null;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Modal Ativar / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form, setForm] = useState({
    macAddress: '',
    deviceKey: '',
    name: '',
    xtreamUrl: 'http://observacaoonline.pro',
    username: '',
    password: '',
    expiresAt: '',
    notes: '',
  });

  // Modal Massa
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkUrl, setBulkUrl] = useState('');

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/device');
      const data = await res.json();
      if (Array.isArray(data)) setDevices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMac = params.get('mac');
      const urlKey = params.get('key');
      if (urlMac) {
        setSearch(urlMac);
        setForm((prev) => ({
          ...prev,
          macAddress: urlMac,
          deviceKey: urlKey || prev.deviceKey,
        }));
        setModalOpen(true);
      }
    }
  }, []);

  const openAddModal = () => {
    setEditingDevice(null);
    setForm({
      macAddress: '',
      deviceKey: Math.floor(100000 + Math.random() * 900000).toString(),
      name: '',
      xtreamUrl: 'http://observacaoonline.pro',
      username: '',
      password: '',
      expiresAt: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (d: Device) => {
    setEditingDevice(d);
    setForm({
      macAddress: d.macAddress,
      deviceKey: d.deviceKey,
      name: d.name || '',
      xtreamUrl: d.xtreamUrl || 'http://observacaoonline.pro',
      username: d.username || '',
      password: d.password || '',
      expiresAt: d.expiresAt ? d.expiresAt.split('T')[0] : '',
      notes: d.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.macAddress.trim()) return alert('Informe o MAC Address');

    try {
      if (editingDevice) {
        await fetch(`/api/device/${editingDevice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      fetchDevices();
    } catch (e) {
      alert('Erro ao salvar dispositivo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este dispositivo?')) return;
    await fetch(`/api/device/${id}`, { method: 'DELETE' });
    fetchDevices();
  };

  const handleToggleActive = async (d: Device) => {
    await fetch(`/api/device/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !d.isActive }),
    });
    fetchDevices();
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUrl.trim()) return alert('Digite a nova URL');
    await fetch('/api/device/bulk-update-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, xtreamUrl: bulkUrl }),
    });
    setBulkModalOpen(false);
    setSelectedIds([]);
    fetchDevices();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((d) => d.id));
  };

  const filtered = devices.filter(
    (d) =>
      d.macAddress.toLowerCase().includes(search.toLowerCase()) ||
      (d.name && d.name.toLowerCase().includes(search.toLowerCase())) ||
      (d.username && d.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Ativação por MAC Address</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Gerencie dispositivos estilo IBO Player. O cliente abre o app e você ativa remotamente pelo MAC.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setBulkModalOpen(true)}
              style={{ background: '#333', border: '1px solid #555', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🔄 Mudar URL em Massa ({selectedIds.length})
            </button>
          )}
          <button
            onClick={openAddModal}
            style={{ background: '#e50914', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ➕ Ativar Novo MAC
          </button>
        </div>
      </div>

      {/* Busca */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por MAC Address, Nome ou Usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '12px 16px', background: '#161616', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' }}
        />
      </div>

      {/* Tabela de Dispositivos */}
      <div style={{ background: '#141414', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#1b1b1b', borderBottom: '1px solid #282828', color: '#aaa' }}>
              <th style={{ padding: '14px 16px', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={selectAll}
                />
              </th>
              <th style={{ padding: '14px 16px' }}>MAC Address / Key</th>
              <th style={{ padding: '14px 16px' }}>Cliente / Aparelho</th>
              <th style={{ padding: '14px 16px' }}>Credenciais IPTV</th>
              <th style={{ padding: '14px 16px' }}>Servidor URL</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                  Carregando dispositivos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  Nenhum dispositivo encontrado. Quando um cliente abrir o app, o MAC aparecerá aqui automaticamente!
                </td>
              </tr>
            ) : (
              filtered.map((d) => {
                const isActivated = Boolean(d.xtreamUrl && d.username && d.password);
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.id)}
                        onChange={() => toggleSelect(d.id)}
                      />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#e50914', fontSize: '0.95rem' }}>
                        {d.macAddress}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#777' }}>
                        Key: {d.deviceKey}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>{d.name || 'Sem nome'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{d.notes || 'Sem observações'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {isActivated ? (
                        <div>
                          <span style={{ color: '#0f0', fontWeight: 'bold' }}>{d.username}</span>
                          <span style={{ color: '#666', fontSize: '0.8rem' }}> (senha vinculada)</span>
                        </div>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.8rem', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                          Aguardando Lista
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#999', fontSize: '0.85rem' }}>
                      {d.xtreamUrl || '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleToggleActive(d)}
                        style={{
                          background: d.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: d.isActive ? '#22c55e' : '#ef4444',
                          border: `1px solid ${d.isActive ? '#22c55e' : '#ef4444'}`,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        {d.isActive ? 'Ativo' : 'Bloqueado'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(d)}
                          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                          {isActivated ? '✏️ Editar' : '⚡ Ativar Lista'}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          style={{ background: '#333', color: '#ef4444', border: '1px solid #444', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ativar / Editar */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#161616', border: '1px solid #333', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '520px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.3rem' }}>
              {editingDevice ? `Configurar MAC: ${editingDevice.macAddress}` : 'Cadastrar Novo Dispositivo'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>MAC Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 00:1A:79:B4:C2:8A"
                    value={form.macAddress}
                    onChange={(e) => setForm({ ...form, macAddress: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Device Key</label>
                  <input
                    type="text"
                    value={form.deviceKey}
                    onChange={(e) => setForm({ ...form, deviceKey: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Nome do Cliente / Identificação</label>
                <input
                  type="text"
                  placeholder="ex: João - Smart TV Sala"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>URL do Servidor Xtream *</label>
                <input
                  type="text"
                  required
                  placeholder="http://seu-servidor.pro"
                  value={form.xtreamUrl}
                  onChange={(e) => setForm({ ...form, xtreamUrl: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Usuário IPTV *</label>
                  <input
                    type="text"
                    required
                    placeholder="usuario"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Senha IPTV *</label>
                  <input
                    type="text"
                    required
                    placeholder="senha"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Data de Vencimento</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ background: '#333', color: '#ccc', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#e50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  💾 Salvar e Ativar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alterar URL em Massa */}
      {bulkModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#161616', border: '1px solid #333', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '460px' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.2rem' }}>Alterar URL em Massa ({selectedIds.length} selecionados)</h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '16px' }}>
              Todos os dispositivos selecionados terão sua URL de servidor atualizada instantaneamente.
            </p>
            <form onSubmit={handleBulkUpdate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Nova URL do Servidor Xtream</label>
                <input
                  type="text"
                  required
                  placeholder="http://novo-servidor.pro"
                  value={bulkUrl}
                  onChange={(e) => setBulkUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  style={{ background: '#333', color: '#ccc', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#e50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Atualizar Todos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
