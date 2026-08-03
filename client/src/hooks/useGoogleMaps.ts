import { useCallback } from 'react';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
}

interface DistanceResult {
  distance: {
    value: number; // meters
    text: string; // formatted distance
  };
  duration: {
    value: number; // seconds
    text: string; // formatted duration
  };
}

export const useGoogleMaps = () => {
  // Geocode an address to coordinates
  const geocodeAddress = useCallback(
    async (address: string): Promise<GeocodeResult | null> => {
      return new Promise((resolve) => {
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API not loaded');
          resolve(null);
          return;
        }

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            resolve({
              latitude: result.geometry.location.lat(),
              longitude: result.geometry.location.lng(),
              address: result.formatted_address,
            });
          } else {
            console.error('Geocoding error:', status);
            resolve(null);
          }
        });
      });
    },
    []
  );

  // Calculate distance between two coordinates
  const calculateDistance = useCallback(
    async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number }
    ): Promise<DistanceResult | null> => {
      return new Promise((resolve) => {
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API not loaded');
          resolve(null);
          return;
        }

        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
            destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (status === 'OK' && response && response.rows.length > 0) {
              const element = response.rows[0].elements[0];
              if (element.status === 'OK') {
                resolve({
                  distance: {
                    value: element.distance.value,
                    text: element.distance.text,
                  },
                  duration: {
                    value: element.duration.value,
                    text: element.duration.text,
                  },
                });
              } else {
                console.error('Distance calculation error:', element.status);
                resolve(null);
              }
            } else {
              console.error('Distance Matrix error:', status);
              resolve(null);
            }
          }
        );
      });
    },
    []
  );

  // Calculate distances between multiple origins and destinations
  const calculateDistances = useCallback(
    async (
      origins: Array<{ lat: number; lng: number }>,
      destinations: Array<{ lat: number; lng: number }>
    ): Promise<DistanceResult[][] | null> => {
      return new Promise((resolve) => {
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API not loaded');
          resolve(null);
          return;
        }

        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: origins.map((o) => new window.google.maps.LatLng(o.lat, o.lng)),
            destinations: destinations.map((d) => new window.google.maps.LatLng(d.lat, d.lng)),
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (status === 'OK' && response) {
              const results: DistanceResult[][] = [];
              response.rows.forEach((row) => {
                const rowResults: DistanceResult[] = [];
                row.elements.forEach((element) => {
                  if (element.status === 'OK') {
                    rowResults.push({
                      distance: {
                        value: element.distance.value,
                        text: element.distance.text,
                      },
                      duration: {
                        value: element.duration.value,
                        text: element.duration.text,
                      },
                    });
                  }
                });
                results.push(rowResults);
              });
              resolve(results);
            } else {
              console.error('Distance Matrix error:', status);
              resolve(null);
            }
          }
        );
      });
    },
    []
  );

  return {
    geocodeAddress,
    calculateDistance,
    calculateDistances,
  };
};


