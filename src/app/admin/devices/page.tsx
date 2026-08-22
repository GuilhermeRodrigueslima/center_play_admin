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
    
    // 2. M3U / HLS / SSIPTV Curto: /p/USERNAME/PASSWORD/m3u
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

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Medidor de latência e velocidade dos servidores
  const [latencies, setLatencies] = useState<Record<string, { latencyMs: number; statusCategory: string; error?: string }>>({});
  const [testingLatency, setTestingLatency] = useState(false);

  // Modal Ativar / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [m3uInput, setM3uInput] = useState('');
  const [m3uSuccess, setM3uSuccess] = useState(false);
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

  const testAllServers = async () => {
    setTestingLatency(true);
    const newLatencies: Record<string, any> = { ...latencies };
    const uniqueUrls = Array.from(new Set(devices.map((d) => d.xtreamUrl).filter(Boolean))) as string[];

    for (const u of uniqueUrls) {
      try {
        const res = await fetch('/api/server-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: u }),
        });
        const data = await res.json();
        newLatencies[u] = data;
      } catch (_) {
        newLatencies[u] = { online: false, latencyMs: 6000, statusCategory: 'down', error: 'Falha' };
      }
    }
    setLatencies(newLatencies);
    setTestingLatency(false);
  };

  const handleM3uChange = (val: string) => {
    setM3uInput(val);
    const parsed = parseM3uLink(val);
    if (parsed && parsed.username && parsed.password) {
      setForm((prev) => ({
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

  const openAddModal = () => {
    setEditingDevice(null);
    setM3uInput('');
    setM3uSuccess(false);
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
    setM3uInput('');
    setM3uSuccess(false);
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
    <div className="w-full">
      {/* Header & Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Ativação por MAC Address</h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            Gerencie Smart TVs e TV Boxes estilo IBO Player com medidor de latência.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={testAllServers}
            disabled={testingLatency || devices.length === 0}
            className="flex-1 md:flex-none bg-[#1e293b] border border-[#3b82f6] text-[#60a5fa] hover:bg-[#3b82f6]/20 px-3.5 py-2.5 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all"
          >
            {testingLatency ? '⏳ Testando...' : '⚡ Testar Latência'}
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setBulkModalOpen(true)}
              className="bg-[#222] border border-[#444] text-white px-3.5 py-2.5 rounded-lg font-bold text-xs md:text-sm"
            >
              🔄 Massa ({selectedIds.length})
            </button>
          )}

          <button
            onClick={openAddModal}
            className="flex-1 md:flex-none bg-[#e50914] hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/30 transition-all"
          >
            ➕ Ativar Novo MAC
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="🔍 Buscar por MAC, Nome ou Usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-md px-4 py-3 bg-[#161616] border border-[#2e2e2e] rounded-xl text-white text-sm focus:outline-none focus:border-[#e50914] transition-colors"
        />
      </div>

      {/* Visão Mobile: Lista de Cards Elegantes (Zero Zoom Necessário!) */}
      <div className="md:hidden space-y-3.5 mb-8">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando dispositivos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm bg-[#141414] rounded-xl border border-[#222]">
            Nenhum dispositivo encontrado. Quando o cliente abrir o app, o MAC aparecerá aqui automaticamente!
          </div>
        ) : (
          filtered.map((d) => {
            const isActivated = Boolean(d.xtreamUrl && d.username && d.password);
            const serverLat = d.xtreamUrl ? latencies[d.xtreamUrl] : null;

            return (
              <div
                key={d.id}
                className="bg-[#141414] border border-[#222] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-black text-[#e50914] text-base">{d.macAddress}</div>
                    <div className="text-xs text-gray-400 font-medium">{d.name || 'Sem nome atribuído'}</div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(d)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      d.isActive
                        ? 'bg-green-950/40 text-green-400 border-green-600/40'
                        : 'bg-red-950/40 text-red-400 border-red-600/40'
                    }`}
                  >
                    {d.isActive ? '● Ativo' : '● Bloqueado'}
                  </button>
                </div>

                <div className="bg-[#1a1a1a] rounded-lg p-2.5 text-xs space-y-1 text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Key:</span>
                    <span className="font-mono text-gray-300">{d.deviceKey}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status IPTV:</span>
                    {isActivated ? (
                      <span className="text-green-400 font-bold">{d.username}</span>
                    ) : (
                      <span className="text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        Aguardando Lista
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Servidor:</span>
                    <span className="font-mono text-[11px] truncate max-w-[180px] text-gray-400">
                      {d.xtreamUrl || '-'}
                    </span>
                  </div>
                  {serverLat && (
                    <div className="pt-1 flex justify-end">
                      {serverLat.statusCategory === 'excellent' && (
                        <span className="text-green-400 text-[10px] font-bold bg-green-950/40 px-2 py-0.5 rounded border border-green-800/40">
                          🟢 {serverLat.latencyMs}ms (Rápido)
                        </span>
                      )}
                      {serverLat.statusCategory === 'good' && (
                        <span className="text-yellow-400 text-[10px] font-bold bg-yellow-950/40 px-2 py-0.5 rounded border border-yellow-800/40">
                          🟡 {serverLat.latencyMs}ms (Normal)
                        </span>
                      )}
                      {serverLat.statusCategory === 'slow' && (
                        <span className="text-orange-400 text-[10px] font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-800/40">
                          🔴 {serverLat.latencyMs}ms (Lento)
                        </span>
                      )}
                      {serverLat.statusCategory === 'down' && (
                        <span className="text-red-400 text-[10px] font-bold bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
                          ❌ Offline
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEditModal(d)}
                    className="flex-1 bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isActivated ? '✏️ Trocar / Editar' : '⚡ Ativar Lista'}
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="bg-[#222] hover:bg-red-950/60 text-red-400 border border-[#333] px-3 py-2 rounded-lg text-xs"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Visão Desktop: Tabela Completa */}
      <div className="hidden md:block bg-[#141414] rounded-xl border border-[#222] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#1a1a1a] border-b border-[#282828] text-gray-400">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={selectAll}
                />
              </th>
              <th className="p-4">MAC Address / Key</th>
              <th className="p-4">Cliente / Aparelho</th>
              <th className="p-4">Credenciais IPTV</th>
              <th className="p-4">Servidor / Latência</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Carregando dispositivos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Nenhum dispositivo encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((d) => {
                const isActivated = Boolean(d.xtreamUrl && d.username && d.password);
                const serverLat = d.xtreamUrl ? latencies[d.xtreamUrl] : null;

                return (
                  <tr key={d.id} className="hover:bg-[#181818]/60 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.id)}
                        onChange={() => toggleSelect(d.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-mono font-bold text-[#e50914]">{d.macAddress}</div>
                      <div className="text-xs text-gray-500">Key: {d.deviceKey}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{d.name || 'Sem nome'}</div>
                      <div className="text-xs text-gray-500">{d.notes || 'Sem observações'}</div>
                    </td>
                    <td className="p-4">
                      {isActivated ? (
                        <div>
                          <span className="text-green-400 font-bold">{d.username}</span>
                          <span className="text-gray-500 text-xs"> (senha vinculada)</span>
                        </div>
                      ) : (
                        <span className="text-amber-400 text-xs bg-amber-950/40 px-2.5 py-1 rounded">
                          Aguardando Lista
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 text-xs font-mono">
                      <div>{d.xtreamUrl || '-'}</div>
                      {serverLat && (
                        <div className="mt-1">
                          {serverLat.statusCategory === 'excellent' && (
                            <span className="text-green-400 font-bold bg-green-950/40 px-2 py-0.5 rounded">
                              🟢 {serverLat.latencyMs}ms (Rápido)
                            </span>
                          )}
                          {serverLat.statusCategory === 'good' && (
                            <span className="text-yellow-400 font-bold bg-yellow-950/40 px-2 py-0.5 rounded">
                              🟡 {serverLat.latencyMs}ms (Normal)
                            </span>
                          )}
                          {serverLat.statusCategory === 'slow' && (
                            <span className="text-orange-400 font-bold bg-orange-950/40 px-2 py-0.5 rounded">
                              🔴 {serverLat.latencyMs}ms (Lento)
                            </span>
                          )}
                          {serverLat.statusCategory === 'down' && (
                            <span className="text-red-400 font-bold bg-red-950/40 px-2 py-0.5 rounded">
                              ❌ Offline
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(d)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          d.isActive
                            ? 'bg-green-950/40 text-green-400 border-green-600/40'
                            : 'bg-red-950/40 text-red-400 border-red-600/40'
                        }`}
                      >
                        {d.isActive ? 'Ativo' : 'Bloqueado'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(d)}
                          className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
                        >
                          {isActivated ? '✏️ Trocar / Editar' : '⚡ Ativar Lista'}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="bg-[#222] hover:bg-red-950/60 text-red-400 border border-[#333] px-2.5 py-1.5 rounded-lg text-xs"
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

      {/* Modal Ativar / Editar (Totalmente Responsivo) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-[#161616] border border-[#333] rounded-2xl p-5 md:p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl my-auto">
            <h2 className="text-lg md:text-xl font-bold mb-4">
              {editingDevice ? `Configurar MAC: ${editingDevice.macAddress}` : 'Cadastrar Novo Dispositivo'}
            </h2>

            {/* Ativação Rápida M3U */}
            <div className="bg-green-950/20 border border-green-600/30 rounded-xl p-3.5 mb-4">
              <div className="text-green-400 font-bold text-xs mb-2 flex items-center gap-1.5">
                <span>⚡ Ativação Rápida por Link M3U / HLS / SSIPTV:</span>
              </div>
              <input
                type="text"
                placeholder="Cole o link M3U aqui..."
                value={m3uInput}
                onChange={(e) => handleM3uChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#111] border border-green-600/50 rounded-lg text-white text-xs md:text-sm focus:outline-none"
              />
              {m3uSuccess && (
                <div className="mt-2 text-green-400 text-xs font-bold">
                  ✓ Link identificado! Servidor, usuário e senha preenchidos abaixo.
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">MAC Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="00:1A:79:B4:C2:8A"
                    value={form.macAddress}
                    onChange={(e) => setForm({ ...form, macAddress: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#222] border border-[#444] rounded-lg text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Device Key</label>
                  <input
                    type="text"
                    value={form.deviceKey}
                    onChange={(e) => setForm({ ...form, deviceKey: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#222] border border-[#444] rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome do Cliente / TV</label>
                <input
                  type="text"
                  placeholder="ex: João - Sala"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#222] border border-[#444] rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">URL do Servidor Xtream *</label>
                <input
                  type="text"
                  required
                  placeholder="http://servidor.pro"
                  value={form.xtreamUrl}
                  onChange={(e) => setForm({ ...form, xtreamUrl: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#222] border border-[#444] rounded-lg text-white text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Usuário IPTV *</label>
                  <input
                    type="text"
                    required
                    placeholder="usuario"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#222] border border-[#444] rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Senha IPTV *</label>
                  <input
                    type="text"
                    required
                    placeholder="senha"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#222] border border-[#444] rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Vencimento</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#222] border border-[#444] rounded-lg text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-[#333] hover:bg-[#444] text-gray-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#e50914] hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-900/30 transition-all"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-[#161616] border border-[#333] rounded-2xl p-5 md:p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-2">Alterar URL em Massa ({selectedIds.length} selecionados)</h2>
            <p className="text-gray-400 text-xs mb-4">
              Todos os dispositivos selecionados terão sua URL de servidor atualizada instantaneamente.
            </p>
            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nova URL do Servidor</label>
                <input
                  type="text"
                  required
                  placeholder="http://novo-servidor.pro"
                  value={bulkUrl}
                  onChange={(e) => setBulkUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#222] border border-[#444] rounded-lg text-white text-sm font-mono"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 bg-[#333] text-gray-300 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#e50914] text-white rounded-lg text-sm font-bold"
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
