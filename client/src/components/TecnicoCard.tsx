import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, Loader2 } from 'lucide-react';
import { Tecnico } from '@/types';
import { trpc } from '@/lib/trpc';
import { useMemo } from 'react';

interface TecnicoCardProps {
  tecnico: Tecnico;
  onView?: (tecnico: Tecnico) => void;
  onDelete?: (id: string) => void;
}

export default function TecnicoCard({
  tecnico,
  onView,
  onDelete
}: TecnicoCardProps) {
  const { data: equipamentos = [], isLoading } = trpc.equipamentos.historicoByTecnico.useQuery({
    tecnicoId: tecnico.id,
  });

  const renderEvaluation = (rating: number) => {
    if (!rating || rating === 0) return '-';
    return rating.toFixed(2);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // Agrupar equipamentos por nome
  const equipamentosAgrupados = useMemo(() => {
    const grupos: { [key: string]: any[] } = {};
    equipamentos.forEach((eq: any) => {
      const nome = eq.equipamento_nome || 'Outro';
      if (!grupos[nome]) {
        grupos[nome] = [];
      }
      grupos[nome].push(eq);
    });
    return grupos;
  }, [equipamentos]);

  // Mostrar apenas os últimos 3 equipamentos
  const MAX_EQUIPAMENTOS = 3;
  const equipamentosExibidos = useMemo(() => {
    const todos = Object.entries(equipamentosAgrupados);
    return todos.slice(-MAX_EQUIPAMENTOS);
  }, [equipamentosAgrupados]);

  const totalEquipamentos = Object.keys(equipamentosAgrupados).length;
  const equipamentosOcultos = Math.max(0, totalEquipamentos - MAX_EQUIPAMENTOS);

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm md:text-base">{tecnico.tecNome}</h3>
            <p className="text-xs text-muted-foreground mt-1">{tecnico.tecEmpresaParceira || '-'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-600">{renderEvaluation(tecnico.tecAvaliacao || 0)}</span>
            <span className="text-xs text-muted-foreground">/5.0</span>
          </div>
        </div>

        {/* Details Grid - Full Width */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs md:text-sm">
          <div>
            <span className="text-muted-foreground block text-xs font-medium">Telefone</span>
            <p className="font-medium truncate">{tecnico.tecTelefone || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs font-medium">CPF</span>
            <p className="font-medium truncate">{tecnico.tecCPF || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs font-medium">RG</span>
            <p className="font-medium truncate">{tecnico.tecRG || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs font-medium">CEP</span>
            <p className="font-medium truncate">{tecnico.tecCEP || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs font-medium">Bairro</span>
            <p className="font-medium truncate">{tecnico.tecBairro || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs font-medium">Cidade</span>
            <p className="font-medium truncate">{tecnico.tecCidade || '-'}</p>
          </div>
        </div>

        {/* Address Row */}
        <div>
          <span className="text-muted-foreground block text-xs font-medium">Endereco</span>
          <p className="font-medium text-xs md:text-sm truncate">
            {tecnico.tecRua && tecnico.tecNumero
              ? `${tecnico.tecRua}, ${tecnico.tecNumero} - ${tecnico.tecCidade}`
              : '-'}
          </p>
        </div>

        {/* Equipment Section */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground block text-xs font-medium">Equipamentos ({totalEquipamentos})</span>
              {equipamentosOcultos > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium">+{equipamentosOcultos}</span>
              )}
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Carregando...
              </div>
            ) : totalEquipamentos === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum equipamento</p>
            ) : (
              <div className="space-y-2">
                {equipamentosExibidos.map(([nome, items]) => (
                  <div key={nome} className="text-xs">
                    <p className="font-semibold text-gray-700">{nome} ({items.length})</p>
                    <div className="ml-2 space-y-2">
                      {items.map((eq: any, idx: number) => (
                        <div key={idx} className="text-gray-600 border-l-2 border-gray-300 pl-2 py-1">
                          <p>Modelo: {eq.equipamento_modelo || '-'}</p>
                          <p>ID Estoque: {eq.equipamento_id_estoque || '-'}</p>
                          <p className={`font-medium ${eq.status === 'emprestado' ? 'text-orange-600' : eq.status === 'usado_em_cliente' ? 'text-blue-600' : 'text-green-600'}`}>
                            {eq.status === 'emprestado' ? 'Emprestado' : eq.status === 'usado_em_cliente' ? 'Usado em Cliente' : 'Devolvido'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Saida: {formatDateTime(eq.data_saida)}</p>
                          {eq.data_devolucao && (
                            <p className="text-xs text-gray-500">Devolucao: {formatDateTime(eq.data_devolucao)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {equipamentosOcultos > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => onView?.(tecnico)}
                  >
                    Ver todos os {totalEquipamentos} equipamentos
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Observations */}
          <div>
            <span className="text-muted-foreground block text-xs font-medium">Observacoes</span>
            <p className="font-medium text-xs truncate">{tecnico.tecObservacoes || '-'}</p>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={() => onView?.(tecnico)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-red-600 hover:text-red-700"
            onClick={() => onDelete?.(tecnico.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Deletar
          </Button>
        </div>
      </div>
    </Card>
  );
}
