/**
 * Geocoding helper with retry logic and fallback to simplified address
 */
export async function geocodeAddressWithRetry(
  address: string,
  maxRetries: number = 3
): Promise<{ lat: string; lon: string } | null> {
  console.log('[Geocoding] Function called with address:', address);
  let retries = maxRetries;
  let isSimplified = false;
  
  while (retries > 0) {
    try {
      const encodedAddress = encodeURIComponent(address);
      console.log('[Geocoding] Attempting to geocode:', address, 'retries left:', retries);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'GoWiFiApp/1.0 (gowifi.com.br)',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('[Geocoding] Response status:', response.status, 'ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Geocoding] Response data length:', data?.length);
        
        if (data && Array.isArray(data) && data.length > 0) {
          const result = {
            lat: String(data[0].lat),
            lon: String(data[0].lon)
          };
          console.log('[Geocoding] Success:', result);
          return result;
        } else {
          // If no results with full address and haven't tried simplified yet, try without neighborhood
          if (!isSimplified && retries === maxRetries) {
            console.log('[Geocoding] No results with full address, trying simplified version...');
            isSimplified = true;
            // Extract just street, number, city, state
            const parts = address.split(',').map(p => p.trim());
            if (parts.length >= 3) {
              // Keep: street, number, city, state (skip neighborhood)
              const simplifiedAddress = [parts[0], parts[1], parts[parts.length - 2], parts[parts.length - 1]].join(', ');
              address = simplifiedAddress;
              console.log('[Geocoding] Simplified address:', simplifiedAddress);
              // Continue to next iteration with simplified address
              continue;
            }
          }
          
          console.warn('[Geocoding] No results found for address:', address);
          return null;
        }
      } else {
        console.warn('[Geocoding] API returned status:', response.status);
        retries--;
        if (retries > 0) {
          console.log('[Geocoding] Retrying... (' + retries + ' attempts left)');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('[Geocoding] Error:', error);
      retries--;
      if (retries > 0) {
        console.log('[Geocoding] Retrying after error... (' + retries + ' attempts left)');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.error('[Geocoding] Failed after', maxRetries, 'attempts, returning null');
  return null;
}
