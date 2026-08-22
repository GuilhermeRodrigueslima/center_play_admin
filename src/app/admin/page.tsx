'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
}

export default function AdminDashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/device')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDevices(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.isActive && d.xtreamUrl && (!d.expiresAt || new Date(d.expiresAt) >= now)).length;
  const waitingList = devices.filter((d) => !d.xtreamUrl || !d.username).length;
  const expiringSoon = devices.filter((d) => d.expiresAt && new Date(d.expiresAt) <= soon && new Date(d.expiresAt) >= now).length;
  const expired = devices.filter((d) => d.expiresAt && new Date(d.expiresAt) < now).length;

  const cards = [
    { label: 'Total Aparelhos (MACs)', value: totalDevices, color: '#3b82f6', icon: '📺', href: '/admin/devices' },
    { label: 'Aparelhos Ativos', value: activeDevices, color: '#22c55e', icon: '⚡', href: '/admin/devices' },
    { label: 'Aguardando Lista', value: waitingList, color: '#eab308', icon: '⏳', href: '/admin/devices' },
    { label: 'Vencendo em 7 dias', value: expiringSoon, color: '#f97316', icon: '⏰', href: '/admin/devices' },
    { label: 'Vencidos / Expirados', value: expired, color: '#ef4444', icon: '🚫', href: '/admin/devices' },
  ];

  const getExpiryBadge = (expiresAt: string | null) => {
    if (!expiresAt) {
      return <span className="text-gray-500 text-xs">Sem validade definida</span>;
    }
    const expDate = new Date(expiresAt);
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-950/80 text-red-400 border border-red-800">
          🚫 Vencido há {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'dia' : 'dias'} ({expDate.toLocaleDateString('pt-BR')})
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800 animate-pulse">
          ⏰ Vence em {diffDays} {diffDays === 1 ? 'dia' : 'dias'} ({expDate.toLocaleDateString('pt-BR')})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
        ✅ Vence em {diffDays} dias ({expDate.toLocaleDateString('pt-BR')})
      </span>
    );
  };

  return (
    <div className="max-w-6xl w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>📊</span> Dashboard Geral
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            Monitoramento de conexões, aparelhos conectados e controle de validades em tempo real.
          </p>
        </div>

        <Link
          href="/admin/devices"
          className="bg-[#e50914] hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2"
        >
          <span>📺</span> Gerenciar Ativações MAC
        </Link>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-[#141414] border border-[#222] hover:border-[#444] rounded-2xl p-4 transition-all shadow-md group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                Ver →
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white" style={{ color: c.color }}>
                {loading ? '...' : c.value}
              </div>
              <div className="text-gray-400 text-xs font-semibold mt-0.5 truncate">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Tabela de Validades e Status dos Aparelhos */}
      <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 md:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <span>🗓️</span> Controle de Validade dos Aparelhos
          </h2>
          <span className="text-xs text-gray-400">{devices.length} cadastrados</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando informações de validades...</div>
        ) : devices.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Nenhum aparelho conectado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#222] text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Aparelho / MAC</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Validade da Assinatura</th>
                  <th className="pb-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {devices.map((d) => {
                  const hasCreds = Boolean(d.xtreamUrl && d.username);
                  return (
                    <tr key={d.id} className="hover:bg-[#1a1a1a]/60 transition-colors">
                      <td className="py-3.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>📺</span> {d.name || 'Smart TV / TV Box'}
                        </div>
                        <div className="font-mono text-xs text-gray-400 mt-0.5">{d.macAddress}</div>
                      </td>
                      <td className="py-3.5">
                        {hasCreds ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ⚡ Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800 animate-pulse">
                            ⏳ Aguardando Lista
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">{getExpiryBadge(d.expiresAt)}</td>
                      <td className="py-3.5 text-right">
                        <Link
                          href="/admin/devices"
                          className="bg-[#222] hover:bg-[#e50914] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-block"
                        >
                          {hasCreds ? '✏️ Editar' : '⚡ Ativar'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
