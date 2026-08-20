'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  total: number;
  active: number;
  inactive: number;
  expiringSoon: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then((clients: Array<{ isActive: boolean; expiresAt: string | null }>) => {
        const now = new Date();
        const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setStats({
          total: clients.length,
          active: clients.filter(c => c.isActive).length,
          inactive: clients.filter(c => !c.isActive).length,
          expiringSoon: clients.filter(c =>
            c.expiresAt && new Date(c.expiresAt) <= soon && new Date(c.expiresAt) >= now
          ).length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Clientes', value: stats.total, color: '#3b82f6', icon: '👥', href: '/admin/clients' },
    { label: 'Ativos', value: stats.active, color: '#22c55e', icon: '✅', href: '/admin/clients' },
    { label: 'Inativos', value: stats.inactive, color: '#e50914', icon: '❌', href: '/admin/clients' },
    { label: 'Expirando em 7d', value: stats.expiringSoon, color: '#f59e0b', icon: '⏰', href: '/admin/clients' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#666', margin: '6px 0 0', fontSize: '0.9rem' }}>Visao geral do Center Play</p>
      </div>

      {loading ? (
        <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>Carregando...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {cards.map(card => (
              <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = card.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{card.icon}</div>
                  <div style={{ color: card.color, fontSize: '2.2rem', fontWeight: 900, lineHeight: '1' }}>{card.value}</div>
                  <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '6px' }}>{card.label}</div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '28px' }}>
            <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 20px' }}>Acoes Rapidas</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/admin/clients" style={{ background: '#e50914', color: '#fff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                + Adicionar Cliente
              </Link>
              <Link href="/admin/settings" style={{ background: '#1a1a1a', color: '#ccc', border: '1px solid #333', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                Configuracoes
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
