'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/trending', label: 'Mais Assistidos', icon: '🔥' },
    { href: '/admin/devices', label: 'Ativação MAC', icon: '📺' },
    { href: '/admin/clients', label: 'Clientes', icon: '👥' },
    { href: '/admin/settings', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0a0a0a] text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Desktop & Drawer Mobile */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#121212] border-r border-[#222] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-[#222] flex items-center justify-between">
          <div>
            <div className="text-[#e50914] text-xl font-black tracking-wider">CENTER PLAY</div>
            <div className="text-[#777] text-[10px] tracking-widest uppercase font-semibold">Painel Admin</div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white p-2 text-xl"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#e50914] text-white shadow-lg shadow-red-900/30'
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#222] text-[#666] text-xs text-center">
          Center Play v2.0 • Pro Edition
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* Header Mobile */}
        <header className="md:hidden h-14 bg-[#121212] border-b border-[#222] flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-white p-2 -ml-2 rounded-md hover:bg-[#222] focus:outline-none"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-[#e50914] font-black text-lg">CENTER PLAY</span>
          </div>
          <Link
            href="/admin/devices"
            className="bg-[#e50914] text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5"
          >
            <span>➕</span> Ativar MAC
          </Link>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>

        {/* Bottom Navigation Bar for Mobile Phones (Thumb-Friendly) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#121212]/95 border-t border-[#222] backdrop-blur-md z-30 flex items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-center ${
                  isActive ? 'text-[#e50914] font-bold' : 'text-gray-400'
                }`}
              >
                <span className="text-xl mb-0.5">{item.icon}</span>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
