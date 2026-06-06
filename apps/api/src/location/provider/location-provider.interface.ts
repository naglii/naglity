export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Place extends GeoPoint {
  label: string;
}

export interface RouteResult {
  from: Place;
  to: Place;
  distanceKm: number;
  durationMin: number;
  polyline: [number, number][]; // [lat, lng] pairs along the route
}

/**
 * Geocoding + routing behind one interface, exactly like the payments provider.
 * The fake implementation runs offline with deterministic data; a real Google /
 * Mapbox provider slots in here later behind the same contract.
 */
export interface LocationProvider {
  readonly name: string;
  /** Autocomplete: ranked place suggestions for a free-text query. */
  search(query: string): Place[];
  /** Resolve a single label (e.g. a stored job location) to a point. */
  geocode(label: string): Place;
  /** A route between two labels: distance, duration and a drawable polyline. */
  route(from: string, to: string): RouteResult;
}
