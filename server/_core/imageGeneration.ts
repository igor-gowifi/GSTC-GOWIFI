/**
 * Image generation helper - Resilient to missing configuration
 */
export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  console.log('[ImageGen] Generation requested but feature is disabled or not configured');
  return {
    url: undefined,
  };
}
