import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EquipamentosHistoricoProps {
  tecnicoId: string;
}

export function EquipamentosHistorico({ tecnicoId }: EquipamentosHistoricoProps) {
  const [historico, setHistorico] = useState<any[]>([]);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const { data: historicoData, isLoading } = trpc.tecnicos.equipamentos.historico.useQuery(
    { tecnicoId }
  );

  const updateReturnMutation = trpc.tecnicos.equipamentos.updateReturnStatus.useMutation({
    onSuccess: () => {
      toast.success('Status de devolução atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  useEffect(() => {
    if (historicoData) {
      setHistorico(historicoData);
    }
  }, [historicoData]);

  const handleToggleDevolvido = async (id: string, currentStatus: boolean) => {
    setUpdatingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    try {
      await updateReturnMutation.mutateAsync({
        historicoId: id,
        devolvido: !currentStatus,
      });

      setHistorico(prev =>
        prev.map(item =>
          item.id === id ? { ...item, tec_equip_devolvido: !currentStatus } : item
        )
      );
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, string> = {
      criado: '✅ Criado',
      atualizado: '🔄 Atualizado',
      removido: '❌ Removido',
    };
    return labels[acao] || acao;
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ap: 'Access Point (AP)',
      rb: 'RouterBoard (RB)',
      switch: 'Switch',
    };
    return labels[tipo] || tipo;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!historico || historico.length === 0) {
    return (
      <Card className="p-6 bg-gray-50">
        <p className="text-gray-600 text-center">Nenhum histórico de equipamentos</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Histórico de Equipamentos</h3>
      {historico.map(item => (
        <Card key={item.id} className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-800">
                  {getTipoLabel(item.tec_equip_tipo)}
                </span>
                <span className="text-sm text-gray-600">{getAcaoLabel(item.tec_equip_acao)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Nome:</span>
                  <p className="font-medium">{item.tec_equip_nome}</p>
                </div>
                {item.tec_equip_modelo && (
                  <div>
                    <span className="text-gray-600">Modelo:</span>
                    <p className="font-medium">{item.tec_equip_modelo}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Quantidade:</span>
                  <p className="font-medium">{item.tec_equip_quantidade}</p>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <p className="font-medium">{formatDate(item.tec_equip_data_acao)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs text-gray-600 font-semibold">Devolvido</label>
                <Checkbox
                  checked={item.tec_equip_devolvido || false}
                  onCheckedChange={() =>
                    handleToggleDevolvido(item.id, item.tec_equip_devolvido || false)
                  }
                  disabled={updatingIds.has(item.id)}
                  className="w-5 h-5"
                />
                {updatingIds.has(item.id) && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
              </div>
            </div>
          </div>

          {item.tec_equip_devolvido && (
            <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 px-3 py-2 rounded">
              <p className="text-sm text-green-700 font-medium">✓ Equipamento devolvido</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
