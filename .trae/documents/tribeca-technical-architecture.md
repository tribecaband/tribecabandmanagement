# Documento de Arquitectura Técnica - TriBeCa

## 1. Diseño de Arquitectura

```mermaid
graph TD
    A[Navegador del Usuario] --> B[Aplicación Frontend React]
    B --> C[SDK de Supabase]
    B --> H[API de Deezer]
    C --> D[Servicios de Supabase]
    
    subgraph "Capa Frontend"
        B
    end
    
    subgraph "Capa de Servicios (Proporcionada por Supabase)"
        D
        E[Autenticación]
        F[Base de Datos PostgreSQL]
        G[Políticas RLS]
    end
    
    subgraph "Servicios Externos"
        H
    end
    
    D --> E
    D --> F
    D --> G
```

## 2. Descripción de Tecnologías

- **Frontend**: React@18 + TailwindCSS@3 + Vite + React Router + React Hook Form
- **Backend**: Supabase (BaaS completo)
- **Base de Datos**: Supabase PostgreSQL
- **Autenticación**: Supabase Auth
- **APIs Externas**: Deezer API (búsqueda de canciones)
- **Librerías adicionales**: React Calendar, Lucide React (iconos), React Hot Toast, Axios (peticiones HTTP)

## 3. Definiciones de Rutas

| Ruta | Propósito |
|------|----------|
| / | Dashboard integrado con calendario (izquierda), lista de eventos (derecha) y modal para gestión |
| /login | Página de inicio de sesión y cambio de contraseña |
| /users | Gestión de usuarios (solo admins) |
| /users/new | Formulario para crear nuevo usuario (solo admins) |
| /songs | Gestión de canciones con listado de repertorio y búsqueda en Deezer |

## 4. Definiciones de API

### 4.1 API Principal

**Autenticación de usuarios**
```
POST /auth/v1/token
```

Request:
| Nombre del Parámetro | Tipo | Requerido | Descripción |
|---------------------|------|-----------|-------------|
| email | string | true | Email del usuario |
| password | string | true | Contraseña del usuario |

Response:
| Nombre del Parámetro | Tipo | Descripción |
|---------------------|------|-------------|
| access_token | string | Token de acceso JWT |
| user | object | Información del usuario |

**Gestión de eventos**
```
GET /rest/v1/events
POST /rest/v1/events
PATCH /rest/v1/events?id=eq.{id}
DELETE /rest/v1/events?id=eq.{id}
```

**Gestión de usuarios**
```
GET /rest/v1/profiles
POST /rest/v1/profiles
PATCH /rest/v1/profiles?id=eq.{id}
```

**Gestión de canciones**
```
GET /rest/v1/songs
POST /rest/v1/songs
DELETE /rest/v1/songs?id=eq.{id}
```

**API Externa de Deezer**
```
GET https://api.deezer.com/search?q={query}&type=track
```

Request:
| Nombre del Parámetro | Tipo | Requerido | Descripción |
|---------------------|------|-----------|-------------|
| q | string | true | Término de búsqueda (título, artista, etc.) |
| type | string | true | Tipo de búsqueda (track para canciones) |
| limit | number | false | Número máximo de resultados (por defecto 25) |

Response:
| Nombre del Parámetro | Tipo | Descripción |
|---------------------|------|-------------|
| data | array | Array de canciones encontradas |
| total | number | Total de resultados disponibles |

Ejemplo de evento:
```json
{
  "name": "Boda García-López",
  "event_date": "2024-06-15T19:00:00Z",
  "location": "Hotel Majestic",
  "contact_name": "María García",
  "contact_phone": "+34666123456",
  "cache_amount": 1500.00,
  "cache_includes_iva": true,
  "advance_amount": 500.00,
  "advance_includes_iva": true,
  "invoice_status": "advance",
  "is_active": true,
  "event_types": ["boda"],
  "musicians": {
    "voz": "julio",
    "guitarra": "santi",
    "bajo": "pablo",
    "bateria": "javi"
  }
}
```

Ejemplo de canción:
```json
{
  "id": "uuid-cancion",
  "title": "Bohemian Rhapsody",
  "artist": "Queen",
  "album": "A Night at the Opera",
  "duration": 355,
  "deezer_id": "3135556",
  "preview_url": "https://cdns-preview-d.dzcdn.net/stream/...",
  "album_cover": "https://api.deezer.com/album/302127/image",
  "added_by": "uuid-usuario",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 5. Modelo de Datos

### 5.1 Definición del Modelo de Datos

```mermaid
erDiagram
    PROFILES ||--o{ EVENTS : creates
    PROFILES ||--o{ SONGS : adds
    EVENTS ||--o{ EVENT_MUSICIANS : has
    MUSICIANS ||--o{ EVENT_MUSICIANS : assigned_to
    MUSICIANS ||--o{ MUSICIAN_SUBSTITUTES : has_substitute
    MUSICIANS ||--o{ MUSICIAN_SUBSTITUTES : is_substitute_for

    PROFILES {
        uuid id PK
        string email
        string full_name
        string role
        jsonb permissions
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    EVENTS {
        uuid id PK
        string name
        timestamp event_date
        string location
        string contact_name
        string contact_phone
        text comments
        decimal cache_amount
        boolean cache_includes_iva
        decimal advance_amount
        boolean advance_includes_iva
        string invoice_status
        boolean is_active
        string[] event_types
        jsonb musicians
        string band_format
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    MUSICIANS {
        uuid id PK
        string name
        string instrument
        boolean is_main
        timestamp created_at
    }
    
    EVENT_MUSICIANS {
        uuid id PK
        uuid event_id FK
        uuid musician_id FK
        string role
        timestamp created_at
    }
    
    MUSICIAN_SUBSTITUTES {
        uuid id PK
        uuid main_musician_id FK
        uuid substitute_musician_id FK
        timestamp created_at
    }
    
    SONGS {
        uuid id PK
        string title
        string artist
        string album
        integer duration
        string deezer_id
        string preview_url
        string album_cover
        uuid added_by FK
        timestamp created_at
    }
```

### 5.2 Lenguaje de Definición de Datos

**Tabla de Perfiles (profiles)**
```sql
-- Crear tabla de perfiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    permissions JSONB DEFAULT '{"create": false, "edit": false, "delete": false}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de eventos
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    comments TEXT,
    cache_amount DECIMAL(10,2) NOT NULL,
    cache_includes_iva BOOLEAN DEFAULT false,
    advance_amount DECIMAL(10,2) DEFAULT 0,
    advance_includes_iva BOOLEAN DEFAULT false,
    invoice_status VARCHAR(20) DEFAULT 'no' CHECK (invoice_status IN ('no', 'yes', 'advance')),
    is_active BOOLEAN DEFAULT true,
    event_types TEXT[] DEFAULT '{}',
    musicians JSONB DEFAULT '{}',
    band_format VARCHAR(20),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de músicos
CREATE TABLE musicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    instrument VARCHAR(50) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de músicos por evento
CREATE TABLE event_musicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    musician_id UUID REFERENCES musicians(id),
    role VARCHAR(20) DEFAULT 'main' CHECK (role IN ('main', 'substitute')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de sustitutos
CREATE TABLE musician_substitutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_musician_id UUID REFERENCES musicians(id),
    substitute_musician_id UUID REFERENCES musicians(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de canciones
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL,
    album VARCHAR(200),
    duration INTEGER, -- Duración en segundos
    deezer_id VARCHAR(50) UNIQUE,
    preview_url TEXT,
    album_cover TEXT,
    added_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active ON profiles(is_active);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_added_by ON songs(added_by);
CREATE INDEX idx_songs_deezer_id ON songs(deezer_id);

-- Políticas RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE musician_substitutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Permisos básicos
GRANT SELECT ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT SELECT ON events TO anon;
GRANT ALL PRIVILEGES ON events TO authenticated;
GRANT SELECT ON musicians TO anon;
GRANT ALL PRIVILEGES ON musicians TO authenticated;
GRANT ALL PRIVILEGES ON event_musicians TO authenticated;
GRANT ALL PRIVILEGES ON musician_substitutes TO authenticated;
GRANT SELECT ON songs TO anon;
GRANT ALL PRIVILEGES ON songs TO authenticated;

-- Datos iniciales
INSERT INTO musicians (name, instrument, is_main) VALUES
('Julio', 'voz', true),
('Santi', 'guitarra', true),
('Pablo', 'bajo', true),
('Javi', 'bateria', true);

INSERT INTO profiles (email, full_name, role, permissions, is_active) VALUES
('admin@tribeca.com', 'Administrador TriBeCa', 'admin', '{"create": true, "edit": true, "delete": true}', true);

-- Datos iniciales de canciones de ejemplo
INSERT INTO songs (title, artist, album, duration, deezer_id, preview_url, album_cover) VALUES
('Bohemian Rhapsody', 'Queen', 'A Night at the Opera', 355, '3135556', 'https://cdns-preview-d.dzcdn.net/stream/c-deda7fa9316d9e9e880d2c6207e92260-8.mp3', 'https://api.deezer.com/album/302127/image'),
('Hotel California', 'Eagles', 'Hotel California', 391, '14808965', 'https://cdns-preview-d.dzcdn.net/stream/c-d1c5f5c5c5c5c5c5c5c5c5c5c5c5c5c5-8.mp3', 'https://api.deezer.com/album/1652248/image'),
('Sweet Child O Mine', 'Guns N Roses', 'Appetite for Destruction', 356, '1109731', 'https://cdns-preview-d.dzcdn.net/stream/c-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6-8.mp3', 'https://api.deezer.com/album/119606/image');
```