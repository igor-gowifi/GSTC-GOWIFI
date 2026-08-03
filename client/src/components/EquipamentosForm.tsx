import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Check, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Equipamento {
  tec_equip_id_estoque: string; // Internal stock ID
  tec_equip_tipo: 'ap' | 'rb' | 'switch';
  tec_equip_nome: string;
  tec_equip_modelo?: string;
  tec_equip_devolvido?: boolean;
}

interface EquipamentosFormProps {
  tecnicoId?: string;
  onEquipamentosChange?: (equipamentos: Equipamento[]) => void;
}

export function EquipamentosForm({ tecnicoId, onEquipamentosChange }: EquipamentosFormProps) {
  const [equipamentos, setEquipamentos] = useState<Record<string, Equipamento[]>>({
    ap: [],
    rb: [],
    switch: [],
  });
  const [checkboxes, setCheckboxes] = useState({
    ap: false,
    rb: false,
    switch: false,
  });

  const { data: equipamentosCarregados } = trpc.tecnicos.equipamentos.list.useQuery(
    { tecnicoId: tecnicoId || '' },
    { enabled: !!tecnicoId }
  );

  useEffect(() => {
    if (equipamentosCarregados && equipamentosCarregados.length > 0) {
      const agrupado: Record<string, Equipamento[]> = {
        ap: [],
        rb: [],
        switch: [],
      };

      equipamentosCarregados.forEach((eq: any) => {
        const tipo = eq.tec_equip_tipo as 'ap' | 'rb' | 'switch';
        agrupado[tipo].push({
          tec_equip_id_estoque: eq.tec_equip_id_estoque || '',
          tec_equip_tipo: tipo,
          tec_equip_nome: eq.tec_equip_nome,
          tec_equip_modelo: eq.tec_equip_modelo,
          tec_equip_devolvido: eq.tec_equip_devolvido || false,
        });
      });

      setEquipamentos(agrupado);
      setCheckboxes({
        ap: agrupado.ap.length > 0,
        rb: agrupado.rb.length > 0,
        switch: agrupado.switch.length > 0,
      });
    }
  }, [equipamentosCarregados]);

  const addEquipamento = (tipo: 'ap' | 'rb' | 'switch') => {
    const novo: Equipamento = {
      tec_equip_id_estoque: '',
      tec_equip_tipo: tipo,
      tec_equip_nome: '',
      tec_equip_modelo: '',
      tec_equip_devolvido: false,
    };
    setEquipamentos(prev => ({
      ...prev,
      [tipo]: [...prev[tipo], novo],
    }));
  };

  const updateEquipamento = (
    tipo: 'ap' | 'rb' | 'switch',
    index: number,
    campo: keyof Equipamento,
    valor: any
  ) => {
    const novoList = [...equipamentos[tipo]];
    novoList[index] = { ...novoList[index], [campo]: valor };
    setEquipamentos({ ...equipamentos, [tipo]: novoList });
    notifyChange();
  };

  const toggleDevolvido = (tipo: 'ap' | 'rb' | 'switch', index: number) => {
    const novoList = [...equipamentos[tipo]];
    novoList[index] = { 
      ...novoList[index], 
      tec_equip_devolvido: !novoList[index].tec_equip_devolvido 
    };
    setEquipamentos({ ...equipamentos, [tipo]: novoList });
    notifyChange();
  };

  const removeEquipamento = (tipo: 'ap' | 'rb' | 'switch', index: number) => {
    const novoList = equipamentos[tipo].filter((_, i) => i !== index);
    setEquipamentos({ ...equipamentos, [tipo]: novoList });
    notifyChange();
  };

  const notifyChange = () => {
    if (onEquipamentosChange) {
      const flattened = Object.entries(equipamentos)
        .flatMap(([tipo, lista]) =>
          lista.map(item => ({
            tec_equip_id_estoque: item.tec_equip_id_estoque,
            tec_equip_tipo: tipo as 'ap' | 'rb' | 'switch',
            tec_equip_nome: item.tec_equip_nome,
            tec_equip_modelo: item.tec_equip_modelo || '',
            tec_equip_devolvido: item.tec_equip_devolvido || false,
          }))
        )
        .filter(item => item.tec_equip_nome.trim() && item.tec_equip_id_estoque.trim());
      onEquipamentosChange(flattened);
    }
  };

  const renderTipoEquipamento = (tipo: 'ap' | 'rb' | 'switch', label: string) => (
    <div className="mb-6">
      <label className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={checkboxes[tipo]}
          onChange={(e) => {
            setCheckboxes({ ...checkboxes, [tipo]: e.target.checked });
            if (!e.target.checked) {
              setEquipamentos(prev => ({ ...prev, [tipo]: [] }));
              notifyChange();
            }
          }}
          className="w-4 h-4"
        />
        <span className="font-semibold text-gray-700">{label}</span>
      </label>

      {checkboxes[tipo] && (
        <Card className="p-4 bg-gray-50">
          <Button
            type="button"
            onClick={() => addEquipamento(tipo)}
            className="mb-4 gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar {label}
          </Button>

          <div className="space-y-3">
            {equipamentos[tipo].map((item, index) => (
              <div key={`${tipo}-${index}`} className="flex gap-2 items-end bg-white p-3 rounded border">
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-gray-600">ID Estoque</label>
                  <Input
                    placeholder="ID do estoque"
                    value={item.tec_equip_id_estoque}
                    onChange={(e) =>
                      updateEquipamento(tipo, index, 'tec_equip_id_estoque', e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-gray-600">Nome</label>
                  <Input
                    placeholder="Nome do equipamento"
                    value={item.tec_equip_nome}
                    onChange={(e) =>
                      updateEquipamento(tipo, index, 'tec_equip_nome', e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-gray-600">Modelo</label>
                  <Input
                    placeholder="Modelo"
                    value={item.tec_equip_modelo || ''}
                    onChange={(e) =>
                      updateEquipamento(tipo, index, 'tec_equip_modelo', e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => toggleDevolvido(tipo, index)}
                  variant={item.tec_equip_devolvido ? 'default' : 'outline'}
                  size="sm"
                  title={item.tec_equip_devolvido ? 'Marcar como não devolvido' : 'Marcar como devolvido'}
                  className="gap-1"
                >
                  {item.tec_equip_devolvido ? (
                    <>
                      <Check className="w-4 h-4" />
                      Devolvido
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Pendente
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => removeEquipamento(tipo, index)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="equipamentos-section">
      <h3 className="text-lg font-semibold mb-4">Equipamentos do Técnico</h3>
      {renderTipoEquipamento('ap', 'Access Point (AP)')}
      {renderTipoEquipamento('rb', 'RouterBoard (RB)')}
      {renderTipoEquipamento('switch', 'Switch')}
    </div>
  );
}
