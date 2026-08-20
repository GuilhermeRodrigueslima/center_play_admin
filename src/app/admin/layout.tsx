import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Center Play - Admin',
  description: 'Painel Administrativo Center Play',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0a', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '220px', minHeight: '100vh', background: '#111', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 50 }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #222' }}>
          <div style={{ color: '#e50914', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '1px' }}>CENTER PLAY</div>
          <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '2px', letterSpacing: '2px', textTransform: 'uppercase' }}>Admin Panel</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📊</span> Dashboard
          </Link>
          <Link href="/admin/clients" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>
            <span style={{ fontSize: '1.1rem' }}>👥</span> Clientes
          </Link>
          <Link href="/admin/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚙️</span> Configurações
          </Link>
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #222', color: '#444', fontSize: '0.75rem' }}>
          Center Play v1.0
        </div>
      </aside>
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
