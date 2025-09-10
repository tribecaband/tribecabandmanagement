# TriBeCa - Gestión de Eventos Musicales

TriBeCa es una plataforma moderna para la gestión integral de eventos musicales, diseñada específicamente para bandas, músicos y organizadores de eventos.

## 🎵 Características Principales

- **Dashboard Integrado**: Vista unificada con calendario, gestión de eventos y estadísticas
- **Gestión de Eventos**: Creación, edición y seguimiento completo de eventos musicales
- **Cálculos Automáticos**: IVA y formatos de banda calculados automáticamente
- **Sistema de Usuarios**: Roles diferenciados (Admin, Manager, Músico)
- **Gestión Financiera**: Seguimiento de ingresos, gastos y pagos
- **Interfaz Moderna**: Diseño responsive con la paleta de colores TriBeCa

## 🚀 Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS con paleta personalizada
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Iconos**: Lucide React
- **Notificaciones**: React Hot Toast
- **Formularios**: React Hook Form

## 🎨 Paleta de Colores

- **Celeste**: `#2DB2CA` - Color principal
- **Rojo**: `#E58483` - Acentos y alertas
- **Naranja**: `#BDB3A4` - Elementos secundarios
- **Amarillo**: `#FAF9ED` - Fondo principal
- **Blanco**: `#FFFFFF` - Tarjetas y contenido

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── ui/              # Componentes reutilizables
│   ├── layout/          # Layout y navegación
│   ├── dashboard/       # Componentes del dashboard
│   ├── events/          # Componentes de eventos
│   └── users/           # Componentes de usuarios
├── pages/               # Páginas principales
├── hooks/               # Hooks personalizados
├── services/            # Servicios (Supabase, APIs)
├── types/               # Definiciones TypeScript
└── utils/               # Utilidades
```

## 🛠️ Configuración

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env.local
   ```
   Completa las variables de Supabase en `.env.local`

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

## 📋 Variables de Entorno Requeridas

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## 🏗️ Arquitectura

El proyecto sigue una arquitectura simplificada con dashboard integrado:

- **Dashboard Principal**: Unifica calendario, eventos y estadísticas
- **Rutas Protegidas**: Autenticación requerida para acceso
- **Roles de Usuario**: Permisos diferenciados por rol
- **Estado Global**: Gestión de autenticación con Context API

## 📚 Documentación

La documentación completa del proyecto se encuentra en:
- `.trae/documents/tribeca-product-requirements.md`
- `.trae/documents/tribeca-technical-architecture.md`

## 🤝 Contribución

Este proyecto está en desarrollo activo. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
