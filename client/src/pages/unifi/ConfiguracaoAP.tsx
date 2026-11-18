import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export const ConfiguracaoAP: React.FC = () => {
  const [agencia, setAgencia] = useState('');
  const [uf, setUf] = useState('SP');
  const [nomeAgencia, setNomeAgencia] = useState('');
  const [nomeFormatado, setNomeFormatado] = useState('');
  const [isNomeEditadoManualmente, setIsNomeEditadoManualmente] = useState(false);

  const [qtdAps, setQtdAps] = useState(1);
  const [macs, setMacs] = useState<string[]>(['']);
  const [logs, setLogs] = useState<string[]>([]);

  // Atualiza dinamicamente a regra default: XXXX_UF_NOME DA AGENCIA
  useEffect(() => {
    if (!isNomeEditadoManualmente) {
      const parts = [agencia || 'XXXX', uf.toUpperCase(), nomeAgencia.toUpperCase().trim()]
        .filter(Boolean)
        .join('_');
      setNomeFormatado(parts);
    }
  }, [agencia, uf, nomeAgencia, isNomeEditadoManualmente]);

  // Ajusta a quantidade de inputs de MACs com base no número de APs selecionado
  const handleQtdApsChange = (val: number) => {
    const num = Math.max(1, val);
    setQtdAps(num);
    setMacs((prev) => {
      const updated = [...prev];
      if (num > updated.length) {
        while (updated.length < num) updated.push('');
      } else {
        updated.length = num;
      }
      return updated;
    });
  };

  const handleMacChange = (index: number, value: string) => {
    const updated = [...macs];
    updated[index] = value.toUpperCase();
    setMacs(updated);
  };

  const provisionMutation = trpc.unifi.provisionAgency.useMutation({
    onSuccess: (data) => setLogs(data.logs),
    onError: (error) => setLogs((prev) => [...prev, `❌ ERRO: ${error.message}`]),
  });

  const handleExecute = () => {
    setLogs([]);
    provisionMutation.mutate({
      agencia,
      nomeFormatado,
      macs: macs.map((m) => m.trim()),
    });
  };

  const isFormValid =
    agencia.length === 4 &&
    nomeFormatado.length > 0 &&
    macs.every((m) => /^([0-9A-FA-F]{2}[:-]){5}([0-9A-FA-F]{2})$/.test(m.trim()));

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <h2 className="text-xl font-bold">Provisionamento Rápido de Agência (UniFi)</h2>
        </div>
      </div>

      {/* FORMULÁRIO PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Agência (XXXX)
          </label>
          <input
            type="text"
            maxLength={4}
            value={agencia}
            onChange={(e) => setAgencia(e.target.value.replace(/\D/g, ''))}
            placeholder="1234"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">UF</label>
          <input
            type="text"
            maxLength={2}
            value={uf}
            onChange={(e) => setUf(e.target.value.toUpperCase())}
            placeholder="SP"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Nome da Agência
          </label>
          <input
            type="text"
            value={nomeAgencia}
            onChange={(e) => setNomeAgencia(e.target.value)}
            placeholder="CENTRO"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* CAMPO DE NOME EDITÁVEL DA AGÊNCIA / AP */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-semibold uppercase text-slate-400">
            Nomenclatura Padrão do AP (Editável)
          </label>
          {isNomeEditadoManualmente && (
            <button
              onClick={() => setIsNomeEditadoManualmente(false)}
              className="text-xs text-blue-400 hover:underline"
            >
              Restaurar Padrão Auto
            </button>
          )}
        </div>
        <input
          type="text"
          value={nomeFormatado}
          onChange={(e) => {
            setIsNomeEditadoManualmente(true);
            setNomeFormatado(e.target.value);
          }}
          className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-mono rounded-lg px-4 py-2 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* QUANTIDADE DE APs E MACs */}
      <div className="mb-6 p-4 bg-slate-950/40 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-xs font-semibold uppercase text-slate-400">
            Quantidade de APs na Agência
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQtdApsChange(qtdAps - 1)}
              className="px-3 py-1 bg-slate-800 rounded text-slate-300 font-bold hover:bg-slate-700"
            >
              -
            </button>

            <span className="font-mono text-lg px-3">{qtdAps}</span>

            <button
              type="button"
              onClick={() => handleQtdApsChange(qtdAps + 1)}
              className="px-3 py-1 bg-slate-800 rounded text-slate-300 font-bold hover:bg-slate-700"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {macs.map((mac, idx) => {
            const apLabel = qtdAps > 1 ? ` AP${String(idx + 1).padStart(2, '0')}` : '';
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-28">
                  {`AP ${idx + 1}:`}
                </span>
                <input
                  type="text"
                  value={mac}
                  onChange={(e) => handleMacChange(idx, e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-xs text-slate-500 font-mono hidden md:inline">
                  ➔ {nomeFormatado || 'XXXX_UF_NOME'}{apLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRÉVIA DAS CONFIGURAÇÕES */}
      <div className="bg-slate-950/80 rounded-lg p-4 border border-slate-800/80 mb-6 font-mono text-sm space-y-1">
        <div className="text-slate-400 text-xs font-bold mb-2 flex items-center gap-1">
          <span>🔮</span> PRÉVIA DAS CONFIGURAÇÕES:
        </div>
        <p>• AP Group: <span className="text-amber-400">{agencia ? `ag_${agencia}` : 'ag_XXXX'}</span> ({macs.length} MACs)</p>
        <p>• SSID Principal: <span className="text-blue-400">{agencia ? `${agencia}_Bradesco` : 'XXXX_Bradesco'}</span></p>
        <p>• SSID Gerência: <span className="text-emerald-400">{agencia ? `${agencia} Gerencia` : 'XXXX Gerencia'}</span></p>
      </div>

      {/* CONSOLE DE LOGS */}
      {(provisionMutation.isLoading || logs.length > 0) && (
        <div className="bg-black/90 rounded-lg p-4 border border-slate-800 mb-6 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="text-slate-300">{log}</div>
          ))}
          {provisionMutation.isLoading && (
            <div className="text-blue-400 animate-pulse">⏳ Aplicando configurações na controladora UniFi...</div>
          )}
        </div>
      )}

      {/* AÇÕES */}
      <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
        <button
          type="button"
          disabled={!isFormValid || provisionMutation.isLoading}
          onClick={handleExecute}
          className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            isFormValid && !provisionMutation.isLoading
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          ⚡ Aplicar na Controladora
        </button>
      </div>
    </div>
  );
};

export default ConfiguracaoAP;