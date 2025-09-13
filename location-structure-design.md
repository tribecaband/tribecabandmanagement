# Diseño de Estructura de Ubicación

## Estructura JSON Propuesta

```typescript
interface LocationData {
  // Datos básicos para mostrar
  formatted_address: string;           // "Calle Mayor 123, 28001 Madrid, España"

  // Coordenadas para mapas y funcionalidad avanzada
  coordinates: {
    lat: number;                      // 40.4168
    lng: number;                      // -3.7038
  };

  // Componentes de dirección para búsquedas y filtros
  address_components: {
    street_number?: string;           // "123"
    route?: string;                   // "Calle Mayor"
    locality?: string;                // "Madrid"
    administrative_area_level_2?: string; // "Madrid"
    administrative_area_level_1?: string; // "Comunidad de Madrid"
    country?: string;                 // "España"
    postal_code?: string;             // "28001"
  };

  // Metadatos de Google Places
  place_id: string;                   // "ChIJd7ArKVQoQg0R_Q6pF7VqVk0"
  place_types: string[];              // ["establishment", "point_of_interest"]

  // Información adicional
  name?: string;                      // "Teatro Real"
  vicinity?: string;                  // Área cercana para contexto

  // Metadatos del sistema
  created_at: string;                 // Timestamp de cuando se guardó
  source: 'google_places' | 'manual'; // Origen de los datos
}
```

## Ventajas de esta estructura:

1. **Compatibilidad con Google Maps**: Coordenadas listas para usar
2. **Flexibilidad de búsqueda**: Componentes separados para filtros
3. **Escalabilidad**: Preparado para mapas y funcionalidades avanzadas
4. **Fallbacks**: Múltiples formas de mostrar la ubicación
5. **Trazabilidad**: Metadatos para auditoría

## Migración de datos existentes:

Los eventos con location como string se convertirán usando geocoding inverso cuando sea posible.