/**
 * Data API helper - Resilient to missing configuration
 */
export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  options: DataApiCallOptions = {}
): Promise<unknown> {
  console.log(`[DataAPI] Call to ${apiId} requested but feature is disabled or not configured`);
  return {};
}
