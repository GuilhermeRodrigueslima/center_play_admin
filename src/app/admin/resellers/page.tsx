'use client';

import { useEffect, useState } from 'react';

interface Reseller { id: string; username: string; name: string | null; isActive: boolean; notes: string | null; createdAt: string; }

export default function ResellersPage() {
  const [items, setItems] = useState<Reseller[]>([]);
  const [form, setForm] = useState({ username: '', password: '', name: '', notes: '' });
  const [message, setMessage] = useState('');

  const load = async () => {
    const res = await fetch('/api/resellers');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('');
    const res = await fetch('/api/resellers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || 'Erro ao criar'); return; }
    setForm({ username: '', password: '', name: '', notes: '' }); setMessage('Revendedor criado com sucesso'); load();
  };

  const toggle = async (item: Reseller) => {
    await fetch(`/api/resellers/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !item.isActive }) });
    load();
  };

  return (
    <div className="max-w-5xl w-full">
      <div className="mb-6"><h1 className="text-2xl md:text-3xl font-black">Revendedores</h1><p className="text-gray-400 text-sm mt-1">Apenas o master pode criar acessos. Cada revendedor vê somente os próprios clientes.</p></div>
      <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-5">
        <form onSubmit={create} className="bg-[#141414] border border-[#2d124d] rounded-2xl p-5 space-y-3 h-fit">
          <h2 className="font-bold text-white">Novo acesso</h2>
          <input required minLength={3} placeholder="Usuário" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full p-3 rounded-lg bg-[#0d0d0d] border border-[#333] text-white" />
          <input required minLength={6} type="password" placeholder="Senha inicial" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full p-3 rounded-lg bg-[#0d0d0d] border border-[#333] text-white" />
          <input placeholder="Nome/empresa" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-3 rounded-lg bg-[#0d0d0d] border border-[#333] text-white" />
          <textarea placeholder="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full p-3 rounded-lg bg-[#0d0d0d] border border-[#333] text-white" />
          <button className="w-full py-3 rounded-lg bg-[#a855f7] font-bold">Criar revendedor</button>
          {message && <p className="text-sm text-purple-300">{message}</p>}
        </form>
        <div className="space-y-3">
          {items.map(item => <div key={item.id} className="bg-[#141414] border border-[#222] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><div className="font-bold text-white">{item.name || item.username}</div><div className="text-sm text-gray-400">Usuário: {item.username}</div><div className="text-xs text-gray-500">Criado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}</div></div>
            <button onClick={() => toggle(item)} className={`px-4 py-2 rounded-lg text-sm font-bold ${item.isActive ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}>{item.isActive ? 'Ativo — bloquear' : 'Bloqueado — ativar'}</button>
          </div>)}
          {items.length === 0 && <div className="p-8 text-gray-500 bg-[#141414] rounded-2xl">Nenhum revendedor criado.</div>}
        </div>
      </div>
    </div>
  );
}
