import { useState } from 'react';
import { filterAndSortNearbyTechnicians, TecnicoComDistancia } from '@/services/technicianSearchService';

export function useNearbyTechnicians() {
  const [nearbyTecnicos, setNearbyTecnicos] = useState<TecnicoComDistancia[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTechnicians = async (
    allTechnicians: any[], 
    targetCoords: { lat: number; lng: number }, 
    limit: number = 5
  ) => {
    setIsSearching(true);
    try {
      // Passa o limite de 5 técnicos
      const results = filterAndSortNearbyTechnicians(allTechnicians, targetCoords, limit);
      setNearbyTecnicos(results);
    } catch (error) {
      console.error('Erro ao buscar técnicos próximos:', error);
      setNearbyTecnicos([]);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    nearbyTecnicos,
    isSearching,
    searchTechnicians,
  };
}