export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-[#141414] border border-[#333] p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <div className="text-5xl font-black text-red-600 tracking-widest mb-2">CENTER PLAY</div>
        <p className="text-gray-400 mb-8">Painel de administracao IPTV</p>
        <div className="flex flex-col gap-4">
          <a href="/admin" className="bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition">
            Acessar Painel
          </a>
        </div>
        <p className="text-gray-600 text-xs mt-6">Gerencie clientes, URL global e configuracoes do app.</p>
      </div>
    </div>
  );
}
