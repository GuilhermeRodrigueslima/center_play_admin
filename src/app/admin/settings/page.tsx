'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [xtreamUrl, setXtreamUrl] = useState('');
  const [backupUrls, setBackupUrls] = useState('');
  const [globalMessage, setGlobalMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Auto Updater State
  const [releaseForm, setReleaseForm] = useState({
    version: '2.1.0',
    versionCode: 2,
    apkUrl: '',
    changelog: 'Melhorias de desempenho, zapping ultra-rápido de canais e estabilizador de stream ao vivo.',
    isMandatory: false,
  });
  const [savingRelease, setSavingRelease] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then((r) => r.json()),
      fetch('/api/app/update').then((r) => r.json()),
    ])
      .then(([settings, release]) => {
        if (settings) {
          setXtreamUrl(settings.xtreamUrl || '');
          setBackupUrls(settings.backupUrls || '');
          setGlobalMessage(settings.globalMessage || '');
        }
        if (release && release.hasUpdate) {
          setReleaseForm({
            version: release.latestVersion || '2.1.0',
            versionCode: release.versionCode || 2,
            apkUrl: release.apkUrl || '',
            changelog: release.changelog || '',
            isMandatory: release.isMandatory || false,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xtreamUrl,
          backupUrls,
          globalMessage: globalMessage || null,
        }),
      });
      if (res.ok) {
        showToast('Configurações globais salvas com sucesso!');
      } else {
        showToast('Erro ao salvar configurações');
      }
    } catch {
      showToast('Erro de conexão ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseForm.version || !releaseForm.apkUrl) {
      return alert('Preencha a versão e a URL do APK');
    }
    setSavingRelease(true);
    try {
      const res = await fetch('/api/app/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(releaseForm),
      });
      if (res.ok) {
        showToast('Nova versão do APK publicada com sucesso! Os apps receberão o aviso de atualização.');
      } else {
        showToast('Erro ao publicar versão');
      }
    } catch {
      showToast('Erro de conexão ao publicar versão');
    } finally {
      setSavingRelease(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando configurações...</div>;
  }

  return (
    <div className="max-w-4xl w-full">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-6 bg-[#e50914] text-white px-5 py-3 rounded-xl font-bold z-50 shadow-2xl animate-fade-in text-sm">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Configurações do Sistema</h1>
        <p className="text-gray-400 text-xs md:text-sm mt-1">
          Gerencie servidores padrão, proteção contra bloqueios (Failover) e atualizações do APK.
        </p>
      </div>

      <div className="space-y-6">
        {/* Bloco 1: Servidores e Failover Anti-Bloqueio */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 md:p-6 shadow-lg">
          <h2 className="text-base md:text-lg font-bold text-white mb-1 flex items-center gap-2">
            <span>🛡️</span> Servidores IPTV & Multi-DNS (Anti-Bloqueio)
          </h2>
          <p className="text-gray-400 text-xs mb-4">
            Se o servidor principal for bloqueado por operadoras (Claro, Vivo, TIM), o aplicativo migrará automaticamente para os servidores de backup.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Servidor Xtream Padrão *
              </label>
              <input
                type="text"
                required
                value={xtreamUrl}
                onChange={(e) => setXtreamUrl(e.target.value)}
                placeholder="http://servidor-principal.pro"
                className="w-full px-3.5 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-white text-sm font-mono focus:border-[#e50914] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Servidores de Backup / Failover (separados por vírgula)
              </label>
              <input
                type="text"
                value={backupUrls}
                onChange={(e) => setBackupUrls(e.target.value)}
                placeholder="http://backup1.pro, http://backup2.pro"
                className="w-full px-3.5 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-white text-sm font-mono focus:border-[#e50914] outline-none"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Ex: http://servidor2.shop, http://servidor3.xyz
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Mensagem Global de Transmissão (Push OSD)
              </label>
              <textarea
                rows={2}
                value={globalMessage}
                onChange={(e) => setGlobalMessage(e.target.value)}
                placeholder="Ex: Jogos da Champions League disponíveis! Suporte online até as 23h."
                className="w-full px-3.5 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-white text-sm focus:border-[#e50914] outline-none"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Deixe em branco se não quiser exibir nenhum banner de aviso no app dos clientes.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#e50914] hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-900/30 transition-all"
              >
                {saving ? 'Salvando...' : '💾 Salvar Configurações'}
              </button>
            </div>
          </form>
        </div>

        {/* Bloco 2: Gestão do Auto-Atualizador de APK */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 md:p-6 shadow-lg">
          <h2 className="text-base md:text-lg font-bold text-white mb-1 flex items-center gap-2">
            <span>🔄</span> Gerenciador de Atualizações do App (In-App Updater)
          </h2>
          <p className="text-gray-400 text-xs mb-4">
            Cadastre a versão mais recente do APK para que todos os clientes recebam um alerta na tela da TV e atualizem com 1 clique.
          </p>

          <form onSubmit={handleSaveRelease} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nome da Versão (ex: 2.1.0) *
                </label>
                <input
                  type="text"
                  required
                  value={releaseForm.version}
                  onChange={(e) => setReleaseForm({ ...releaseForm, version: e.target.value })}
                  placeholder="2.1.0"
                  className="w-full px-3.5 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-white text-sm font-mono focus:border-[#e50914] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Código da Versão (Version Code inteiro, ex: 2) *
                </label>
                <input
                  type="number"
                  required
                  value={releaseForm.versionCode}
                  onChange={(e) => setReleaseForm({ ...releaseForm, versionCode: parseInt(e.target.value) || 1 })}
                  placeholder="2"
                  className="w-full px-3.5 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-white text-sm font-mono focus:border-[#e50914] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                URL Direta de Download do APK *
              </label>
              <input
                type="text"
                required
                value={releaseForm.apkUrl}
                onChange={(e) => setReleaseForm({ ...releaseForm, apkUrl: e.target.value })}
                placeholder="https://github.com/GuilhermeRodrigueslima/Center_Play/releases/download/v2.1.0/app-release.apk"
                className="w-full px-3.5 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-white text-sm font-mono focus:border-[#e50914] outline-none"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Cole o link direto do GitHub Release ou do seu servidor de arquivos.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Novidades desta versão (Changelog exibido na tela da TV)
              </label>
              <textarea
                rows={2}
                value={releaseForm.changelog}
                onChange={(e) => setReleaseForm({ ...releaseForm, changelog: e.target.value })}
                placeholder="Ex: Novo player ultra rápido, correção no zapping de canais e suporte a TV Box."
                className="w-full px-3.5 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-white text-sm focus:border-[#e50914] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isMandatory"
                checked={releaseForm.isMandatory}
                onChange={(e) => setReleaseForm({ ...releaseForm, isMandatory: e.target.checked })}
                className="rounded border-[#444] text-[#e50914] focus:ring-0"
              />
              <label htmlFor="isMandatory" className="text-xs text-gray-300 cursor-pointer">
                Atualização Obrigatória (bloqueia o app antigo até o usuário atualizar)
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingRelease}
                className="bg-[#2563eb] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/30 transition-all"
              >
                {savingRelease ? 'Publicando...' : '🚀 Publicar Nova Versão do APK'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
