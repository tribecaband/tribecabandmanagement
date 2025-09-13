# Implementación del Campo de Ubicación en Eventos

## 1. Resumen de la Solución

Para cumplir con los requisitos de almacenamiento de datos de ubicación, se propone la siguiente implementación, que aprovecha la estructura `JSONB` en la base de datos y se integra con la API de Google Places en el frontend.

### Tipo de Dato: `JSONB`

El campo `location` en la tabla `events` será de tipo `JSONB`. Este tipo de dato es ideal para almacenar datos semi-estructurados y complejos como los que devuelve la API de Google Places.

**Ventajas:**
- **Flexibilidad:** Permite almacenar toda la información relevante de la ubicación sin necesidad de crear múltiples columnas.
- **Escalabilidad:** Fácil de extender en el futuro si se necesita almacenar más información.
- **Rendimiento:** PostgreSQL ofrece operadores e índices específicos para `JSONB` que permiten consultas eficientes.

### Estructura del `JSONB`

El objeto `JSONB` almacenado en el campo `location` tendrá la siguiente estructura:

```json
{
  "place_id": "ChIJgUbEo8cfqokR5lP9_h_6CRo",
  "formatted_address": "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
  "coordinates": {
    "lat": 37.4224764,
    "lng": -122.0842499
  },
  "address_components": [
    { "long_name": "1600", "short_name": "1600", "types": ["street_number"] },
    { "long_name": "Amphitheatre Parkway", "short_name": "Amphitheatre Pkwy", "types": ["route"] },
    { "long_name": "Mountain View", "short_name": "Mountain View", "types": ["locality", "political"] },
    // ... más componentes
  ],
  "place_types": ["establishment", "point_of_interest"],
  "created_at": "2023-10-27T10:00:00Z",
  "source": "google_places_api"
}
```

**Campos Clave:**
- `place_id`: Identificador único de Google. Útil para evitar duplicados y para interactuar con otras APIs de Google.
- `formatted_address`: La dirección completa en formato de texto.
- `coordinates`: Objeto con `lat` y `lng`. Esencial para mapas y cálculos de distancia.
- `address_components`: Array con los componentes de la dirección (calle, ciudad, país, etc.).
- `place_types`: Categorías del lugar (ej. "restaurant", "music_venue").
- `created_at`: Timestamp de cuándo se guardó la ubicación.
- `source`: Origen del dato (ej. "google_places_api", "manual").

## 2. Cumplimiento de Requisitos

### Almacenamiento de Datos Completos
El formato `JSONB` permite guardar toda la información necesaria para mostrar en el listado de eventos, incluyendo el nombre del lugar, la dirección y la ciudad.

### Apertura en Google Maps
Con la `formatted_address` y las `coordinates`, se puede construir fácilmente una URL para abrir la ubicación en Google Maps:

```
https://www.google.com/maps/search/?api=1&query=formatted_address
// O con coordenadas
https://www.google.com/maps/search/?api=1&query=lat,lng
// O con place_id
https://www.google.com/maps/search/?api=1&query=place_id:ChIJgUbEo8cfqokR5lP9_h_6CRo
```

### Futura Implementación de Mapa
La inclusión de `coordinates` y el uso de un índice espacial (GIST) en la base de datos (como ya está en `add-location-field.sql`) son la base para una futura implementación de un mapa. Se podrán realizar consultas geográficas eficientes como "buscar todos los eventos en un radio de 10km".

## 3. Próximos Pasos

1.  **Actualizar Tipos de TypeScript:** Modificar `src/types/database.ts` para que el campo `location` en el tipo `Event` refleje la estructura `JSONB` definida.
2.  **Integrar en el Frontend:**
    -   **EventModal:** Asegurarse de que el `EventModal` recibe el objeto de ubicación completo del componente `LocationAutocomplete` y lo envía al crear/actualizar un evento.
    -   **EventCard/EventList:** Modificar los componentes que muestran la información del evento para que muestren la dirección formateada y la conviertan en un enlace a Google Maps.
