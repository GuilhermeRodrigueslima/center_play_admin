'use client';
import { useState, useEffect } from 'react';

export default function TrendingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'vod' | 'series'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = filterType === 'all' ? '/api/content/trending?limit=100' : `/api/content/trending?type=${filterType}&limit=100`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setItems(d);
        else setItems([]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterType]);

  return (
    <div className="max-w-6xl w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>🔥</span> Conteúdos Mais Assistidos (Top Views)
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            Métricas em tempo real de reprodução de filmes e séries por todos os seus clientes.
          </p>
        </div>

        <div className="flex bg-[#1f1f1f] p-1 rounded-xl border border-[#333]">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all' ? 'bg-[#e50914] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('vod')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'vod' ? 'bg-[#e50914] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            🎬 Filmes
          </button>
          <button
            onClick={() => setFilterType('series')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'series' ? 'bg-[#e50914] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            📺 Séries
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm">Carregando métricas de audiência...</div>
      ) : items.length === 0 ? (
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-12 text-center text-gray-400 text-sm">
          Nenhuma visualização registrada ainda. Conforme os clientes derem play no app, os dados aparecerão aqui em tempo real!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-[#141414] border border-[#222] hover:border-[#444] rounded-2xl p-4 flex gap-3 items-center shadow-md relative overflow-hidden group"
            >
              {/* Badge Rank */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                  index === 0
                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                    : index === 1
                    ? 'bg-slate-300 text-black shadow-md'
                    : index === 2
                    ? 'bg-amber-700 text-white shadow-md'
                    : 'bg-[#222] text-gray-400'
                }`}
              >
                #{index + 1}
              </div>

              {/* Poster se existir */}
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-12 h-16 object-cover rounded-lg bg-[#222] shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-16 rounded-lg bg-[#222] flex items-center justify-center text-gray-500 shrink-0">
                  {item.type === 'vod' ? '🎬' : '📺'}
                </div>
              )}

              {/* Detalhes */}
              <div className="min-w-0 flex-1">
                <h3 className="text-white text-sm font-bold truncate group-hover:text-[#e50914] transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#222] text-gray-300">
                    {item.type === 'vod' ? 'Filme' : 'Série'}
                  </span>
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                    <span>🔥</span> {item.viewCount} {item.viewCount === 1 ? 'play' : 'plays'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-0.5 truncate">
                  Último: {new Date(item.lastViewedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
