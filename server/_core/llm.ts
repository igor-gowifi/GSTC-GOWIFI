/**
 * LLM helper - Resilient to missing configuration
 */
export async function invokeLLM(params: any): Promise<any> {
  console.log('[LLM] Invoke requested but feature is disabled or not configured');
  return {
    id: 'disabled',
    created: Date.now(),
    model: 'disabled',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: 'Recurso de IA não configurado neste ambiente independente.',
      },
      finish_reason: 'stop'
    }]
  };
}
