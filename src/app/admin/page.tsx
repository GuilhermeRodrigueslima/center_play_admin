'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalClients: number;
  activeClients: number;
  totalDevices: number;
  activeDevices: number;
  expiringSoon: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activeClients: 0,
    totalDevices: 0,
    activeDevices: 0,
    expiringSoon: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then((r) => r.json()),
      fetch('/api/device').then((r) => r.json()),
    ])
      .then(([clients, devices]) => {
        const now = new Date();
        const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const safeClients = Array.isArray(clients) ? clients : [];
        const safeDevices = Array.isArray(devices) ? devices : [];

        setStats({
          totalClients: safeClients.length,
          activeClients: safeClients.filter((c: any) => c.isActive).length,
          totalDevices: safeDevices.length,
          activeDevices: safeDevices.filter((d: any) => d.isActive).length,
          expiringSoon: safeClients.filter(
            (c: any) => c.expiresAt && new Date(c.expiresAt) <= soon && new Date(c.expiresAt) >= now
          ).length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Smart TVs / MACs', value: stats.totalDevices, color: '#e50914', icon: '📺', href: '/admin/devices' },
    { label: 'Aparelhos Ativos', value: stats.activeDevices, color: '#22c55e', icon: '⚡', href: '/admin/devices' },
    { label: 'Total Clientes IPTV', value: stats.totalClients, color: '#3b82f6', icon: '👥', href: '/admin/clients' },
    { label: 'Clientes Ativos', value: stats.activeClients, color: '#10b981', icon: '✅', href: '/admin/clients' },
    { label: 'Vencendo em 7 dias', value: stats.expiringSoon, color: '#f59e0b', icon: '⏰', href: '/admin/clients' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#888', margin: '6px 0 0', fontSize: '0.9rem' }}>Visão geral do Center Play em tempo real</p>
      </div>

      {loading ? (
        <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>Carregando estatísticas...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '36px' }}>
            {cards.map((card) => (
              <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#141414',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    padding: '22px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = card.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#222';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{card.icon}</div>
                  <div style={{ color: card.color, fontSize: '2.2rem', fontWeight: 900, lineHeight: '1' }}>{card.value}</div>
                  <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '6px' }}>{card.label}</div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 18px' }}>Ações Rápidas</h2>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                href="/admin/devices"
                style={{
                  background: '#e50914',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📺 Ativar TV por MAC / QR Code
              </Link>
              <Link
                href="/admin/devices"
                style={{
                  background: '#1e293b',
                  color: '#60a5fa',
                  border: '1px solid #3b82f6',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ⚡ Testar Velocidade dos Servidores
              </Link>
              <Link
                href="/admin/clients"
                style={{
                  background: '#222',
                  color: '#fff',
                  border: '1px solid #333',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                👥 Gerenciar Clientes M3U
              </Link>
              <Link
                href="/admin/settings"
                style={{
                  background: '#1a1a1a',
                  color: '#ccc',
                  border: '1px solid #333',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                ⚙️ Configurações Globais
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
