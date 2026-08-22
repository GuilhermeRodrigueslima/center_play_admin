'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Fecha a sidebar ao navegar no mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0a', fontFamily: 'sans-serif' }}>
      {/* Overlay para fechar sidebar no mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
        />
      )}

      {/* Sidebar */}
      <aside 
        className="admin-sidebar-transition"
        style={{ 
          width: '240px', 
          minHeight: '100vh', 
          background: '#111', 
          borderRight: '1px solid #222', 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          zIndex: 50,
          transform: typeof window !== 'undefined' && isSidebarOpen ? 'translateX(0)' : (typeof window !== 'undefined' && window.innerWidth <= 768 ? 'translateX(-100%)' : 'translateX(0)')
        }}
      >
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#e50914', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '1px' }}>CENTER PLAY</div>
            <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '2px', letterSpacing: '2px', textTransform: 'uppercase' }}>Admin Panel</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', color: pathname === '/admin' ? '#e50914' : '#ccc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: pathname === '/admin' ? 'bold' : 'normal', background: pathname === '/admin' ? 'rgba(229,9,20,0.05)' : 'transparent' }}>
            <span style={{ fontSize: '1.1rem' }}>📊</span> Dashboard
          </Link>
          <Link href="/admin/devices" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', color: pathname === '/admin/devices' ? '#e50914' : '#ccc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: pathname === '/admin/devices' ? 'bold' : 'normal', background: pathname === '/admin/devices' ? 'rgba(229,9,20,0.05)' : 'transparent' }}>
            <span style={{ fontSize: '1.1rem' }}>📺</span> Ativação por MAC
          </Link>
          <Link href="/admin/clients" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', color: pathname === '/admin/clients' ? '#e50914' : '#ccc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: pathname === '/admin/clients' ? 'bold' : 'normal', background: pathname === '/admin/clients' ? 'rgba(229,9,20,0.05)' : 'transparent' }}>
            <span style={{ fontSize: '1.1rem' }}>👥</span> Clientes (Manual)
          </Link>
          <Link href="/admin/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', color: pathname === '/admin/settings' ? '#e50914' : '#ccc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: pathname === '/admin/settings' ? 'bold' : 'normal', background: pathname === '/admin/settings' ? 'rgba(229,9,20,0.05)' : 'transparent' }}>
            <span style={{ fontSize: '1.1rem' }}>⚙️</span> Configurações
          </Link>
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #222', color: '#444', fontSize: '0.75rem' }}>
          Center Play v1.0 • IBO Mode
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header Mobile */}
        <header className="mobile-header" style={{ 
          height: '60px', 
          background: '#111', 
          borderBottom: '1px solid #222', 
          display: 'none', 
          alignItems: 'center', 
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', marginRight: '16px' }}
          >
            ☰
          </button>
          <div style={{ color: '#e50914', fontSize: '1.1rem', fontWeight: 900 }}>CENTER PLAY</div>
        </header>

        <main className="mobile-full" style={{ 
          marginLeft: '240px', 
          flex: 1, 
          padding: '32px', 
          minHeight: '100vh' 
        }}>
          {children}
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          main.mobile-full { margin-left: 0 !important; padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
