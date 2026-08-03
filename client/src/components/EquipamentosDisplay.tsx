import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Package, Wifi, Radio, Share2 } from 'lucide-react';

interface Equipamento {
  tec_equip_id_estoque: string;
  tec_equip_nome: string;
  tec_equip_modelo: string;
  tec_equip_tipo: 'ap' | 'rb' | 'switch';
  tec_equip_pendente: boolean;
  tec_equip_data_retirada?: string;
  tec_equip_data_devolucao?: string;
}

interface EquipamentosDisplayProps {
  equipamentos?: string | Equipamento[];
}

export function EquipamentosDisplay({ equipamentos }: EquipamentosDisplayProps) {
  // Parse equipamentos if it's a string
  let parsedEquipamentos: Equipamento[] = [];
  
  if (typeof equipamentos === 'string' && equipamentos) {
    try {
      parsedEquipamentos = JSON.parse(equipamentos);
    } catch (e) {
      return (
        <div className="text-xs text-muted-foreground">
          Nenhum equipamento registrado
        </div>
      );
    }
  } else if (Array.isArray(equipamentos)) {
    parsedEquipamentos = equipamentos;
  }

  if (!parsedEquipamentos || parsedEquipamentos.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        Nenhum equipamento registrado
      </div>
    );
  }

  // Group equipamentos by type
  const equipamentosPorTipo = {
    ap: parsedEquipamentos.filter(e => e.tec_equip_tipo === 'ap'),
    rb: parsedEquipamentos.filter(e => e.tec_equip_tipo === 'rb'),
    switch: parsedEquipamentos.filter(e => e.tec_equip_tipo === 'switch')
  };

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'ap':
        return <Wifi className="w-4 h-4" />;
      case 'rb':
        return <Radio className="w-4 h-4" />;
      case 'switch':
        return <Share2 className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'ap':
        return 'Access Point';
      case 'rb':
        return 'RouterBoard';
      case 'switch':
        return 'Switch';
      default:
        return tipo;
    }
  };

  const renderEquipamentoCard = (equip: Equipamento) => (
    <div key={`${equip.tec_equip_tipo}-${equip.tec_equip_id_estoque}`} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-border transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-muted-foreground">
            {getIconForType(equip.tec_equip_tipo)}
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {equip.tec_equip_id_estoque}
          </span>
        </div>
        <p className="text-sm font-medium truncate">{equip.tec_equip_nome}</p>
        <p className="text-xs text-muted-foreground truncate">{equip.tec_equip_modelo}</p>
      </div>
      <div className="ml-2">
        <Badge 
          variant={equip.tec_equip_pendente ? 'default' : 'secondary'}
          className="text-xs whitespace-nowrap"
        >
          {equip.tec_equip_pendente ? 'Pendente' : 'Devolvido'}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Access Points */}
      {equipamentosPorTipo.ap.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold">Access Points ({equipamentosPorTipo.ap.length})</h4>
          </div>
          <div className="space-y-2">
            {equipamentosPorTipo.ap.map(renderEquipamentoCard)}
          </div>
        </div>
      )}

      {/* RouterBoards */}
      {equipamentosPorTipo.rb.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-orange-600" />
            <h4 className="text-sm font-semibold">RouterBoards ({equipamentosPorTipo.rb.length})</h4>
          </div>
          <div className="space-y-2">
            {equipamentosPorTipo.rb.map(renderEquipamentoCard)}
          </div>
        </div>
      )}

      {/* Switches */}
      {equipamentosPorTipo.switch.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-semibold">Switches ({equipamentosPorTipo.switch.length})</h4>
          </div>
          <div className="space-y-2">
            {equipamentosPorTipo.switch.map(renderEquipamentoCard)}
          </div>
        </div>
      )}
    </div>
  );
}
