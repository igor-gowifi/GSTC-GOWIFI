import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, Phone, Building2, CheckCircle2, Search } from 'lucide-react';

interface Technician {
  id: string;
  tec_nome: string;
  tec_telefone: string;
  tec_empresa_parceira: string;
  tec_avaliacao: number | string;
  tec_rua: string;
  tec_numero: string;
  tec_bairro: string;
  tec_cidade: string;
  tec_uf: string;
  distanciaKm?: number;
  distancia?: number;
  latitude?: number;
  longitude?: number;
}

interface TechnicianSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTechnician: (technician: Technician) => void;
  technicians?: Technician[];      // Lista de técnicos próximos
  allTechnicians?: Technician[];   // Lista completa sem filtro geográfico
  isLoading?: boolean;
  currentTechnicianId?: string;
}

export function TechnicianSearchModal({
  isOpen,
  onClose,
  onSelectTechnician,
  technicians = [],
  allTechnicians = [],
  isLoading = false,
  currentTechnicianId,
}: TechnicianSearchModalProps) {
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');
  const [searchTerm, setSearchTerm] = useState('');

  const sortedTechnicians = useMemo(() => {
    // Se digitou algo na busca, pesquisa na base completa (allTechnicians)
    const query = searchTerm.trim().toLowerCase();
    
    if (query !== '') {
      const sourceList = allTechnicians.length > 0 ? allTechnicians : technicians;
      return sourceList.filter(
        (tec) =>
          tec.tec_nome?.toLowerCase().includes(query) ||
          tec.tec_telefone?.toLowerCase().includes(query) ||
          tec.tec_empresa_parceira?.toLowerCase().includes(query) ||
          tec.tec_cidade?.toLowerCase().includes(query) ||
          tec.tec_uf?.toLowerCase().includes(query)
      );
    }

    // Se a busca estiver vazia, utiliza a lista por proximidade e aplica a ordenação selecionada
    const listToOrder = [...technicians];

    if (sortBy === 'rating') {
      listToOrder.sort((a, b) => {
        const ratingA = parseFloat(String(a.tec_avaliacao)) || 0;
        const ratingB = parseFloat(String(b.tec_avaliacao)) || 0;
        return ratingB - ratingA;
      });
    } else {
      listToOrder.sort((a, b) => {
        const distA = a.distanciaKm ?? a.distancia ?? Infinity;
        const distB = b.distanciaKm ?? b.distancia ?? Infinity;
        return distA - distB;
      });
    }

    return listToOrder;
  }, [technicians, allTechnicians, sortBy, searchTerm]);

  const handleSelectTechnician = (technician: Technician) => {
    onSelectTechnician(technician);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Selecionar Técnico</DialogTitle>
          <DialogDescription>Escolha um técnico para atribuir à solicitação</DialogDescription>
        </DialogHeader>

        {/* Input de Busca */}
        <div className="relative my-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone, cidade ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs e Lista */}
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'distance' | 'rating')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="distance">
              <MapPin className="w-4 h-4 mr-2" />
              Mais Próximos
            </TabsTrigger>
            <TabsTrigger value="rating">
              <Star className="w-4 h-4 mr-2" />
              Maior Avaliação
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {isLoading ? (
              <div className="text-center py-8">Carregando técnicos...</div>
            ) : sortedTechnicians.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum técnico encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTechnicians.map((technician) => (
                  <TechnicianCard
                    key={technician.id}
                    technician={technician}
                    isSelected={currentTechnicianId === technician.id}
                    onSelect={() => handleSelectTechnician(technician)}
                    sortBy={sortBy}
                  />
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface TechnicianCardProps {
  technician: Technician;
  isSelected: boolean;
  onSelect: () => void;
  sortBy: 'distance' | 'rating';
}

function TechnicianCard({ technician, isSelected, onSelect }: TechnicianCardProps) {
  const rating = parseFloat(String(technician.tec_avaliacao)) || 0;
  const distance = technician.distanciaKm ?? technician.distancia;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{technician.tec_nome}</h3>
            {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{technician.tec_telefone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>{technician.tec_empresa_parceira}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                {technician.tec_rua}, {technician.tec_numero} - {technician.tec_bairro},{' '}
                {technician.tec_cidade} - {technician.tec_uf}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{rating.toFixed(2)}</span>
          </div>

          <Badge variant="secondary">
            {distance !== undefined && distance !== Infinity ? `${distance.toFixed(1)} km` : 'N/A'}
          </Badge>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            Selecionar
          </Button>
        </div>
      </div>
    </Card>
  );
}