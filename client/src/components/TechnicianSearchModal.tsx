import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, Phone, Building2, CheckCircle2 } from 'lucide-react';

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
  distanciaKm?: number; // Propriedade vinda do serviço centralizado
  distancia?: number;   // Mantido para compatibilidade legada
  latitude?: number;
  longitude?: number;
}

interface TechnicianSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTechnician: (technician: Technician) => void;
  technicians?: Technician[];
  isLoading?: boolean;
  currentTechnicianId?: string;
}

export function TechnicianSearchModal({
  isOpen,
  onClose,
  onSelectTechnician,
  technicians = [],
  isLoading = false,
  currentTechnicianId,
}: TechnicianSearchModalProps) {
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');

  const sortedTechnicians = useMemo(() => {
    // Trava de segurança: garante que technicians é um array iterável antes de espalhar
    if (!technicians || !Array.isArray(technicians)) {
      return [];
    }

    const sorted = [...technicians];
    
    if (sortBy === 'rating') {
      sorted.sort((a, b) => {
        const ratingA = parseFloat(String(a.tec_avaliacao)) || 0;
        const ratingB = parseFloat(String(b.tec_avaliacao)) || 0;
        return ratingB - ratingA;
      });
    } else {
      sorted.sort((a, b) => {
        const distA = a.distanciaKm ?? a.distancia ?? Infinity;
        const distB = b.distanciaKm ?? b.distancia ?? Infinity;
        return distA - distB;
      });
    }
    
    return sorted;
  }, [technicians, sortBy]);

  const handleSelectTechnician = (technician: Technician) => {
    onSelectTechnician(technician);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Técnico</DialogTitle>
          <DialogDescription>Escolha um técnico para atribuir à solicitação</DialogDescription>
        </DialogHeader>

        {/* Tabs for sorting */}
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'distance' | 'rating')}>
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

          <TabsContent value="distance" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="text-center py-8">Carregando técnicos...</div>
            ) : sortedTechnicians.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum técnico encontrado
              </div>
            ) : (
              sortedTechnicians.map((technician) => (
                <TechnicianCard
                  key={technician.id}
                  technician={technician}
                  isSelected={currentTechnicianId === technician.id}
                  onSelect={() => handleSelectTechnician(technician)}
                  sortBy="distance"
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="rating" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="text-center py-8">Carregando técnicos...</div>
            ) : sortedTechnicians.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum técnico encontrado
              </div>
            ) : (
              sortedTechnicians.map((technician) => (
                <TechnicianCard
                  key={technician.id}
                  technician={technician}
                  isSelected={currentTechnicianId === technician.id}
                  onSelect={() => handleSelectTechnician(technician)}
                  sortBy="rating"
                />
              ))
            )}
          </TabsContent>
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

function TechnicianCard({ technician, isSelected, onSelect, sortBy }: TechnicianCardProps) {
  const rating = parseFloat(String(technician.tec_avaliacao)) || 0;
  
  // Prioriza distanciaKm e faz fallback para distancia se existir
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
            {distance !== undefined ? `${distance.toFixed(1)} km` : 'N/A'}
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