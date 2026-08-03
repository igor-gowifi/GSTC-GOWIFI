import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para persistir dados de formulário em localStorage
 * Salva dados automaticamente e restaura ao recarregar
 * Limpa dados quando usuário navega para outro link
 */
export function useFormPersistence<T>(
  storageKey: string,
  initialData: T,
  isOpen: boolean
) {
  const [formData, setFormData] = useState<T>(initialData);

  // Restaurar dados do localStorage ao montar o componente
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          setFormData(JSON.parse(savedData));
        } catch (err) {
          console.error('Erro ao restaurar dados do formulário:', err);
        }
      }
    }
  }, [isOpen, storageKey]);

  // Salvar dados no localStorage sempre que formData mudar
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, isOpen, storageKey]);

  // Função para limpar dados do localStorage
  const clearFormData = useCallback(() => {
    localStorage.removeItem(storageKey);
    setFormData(initialData);
  }, [storageKey, initialData]);

  // Função para resetar para dados iniciais
  const resetFormData = useCallback(() => {
    setFormData(initialData);
    localStorage.removeItem(storageKey);
  }, [storageKey, initialData]);

  return {
    formData,
    setFormData,
    clearFormData,
    resetFormData
  };
}
