# Documento de Requisitos del Producto - TriBeCa

## 1. Visión General del Producto

TriBeCa es una plataforma web para la gestión integral de eventos musicales que permite a las empresas organizadoras llevar un control completo de toda la información relevante de forma práctica y visual. La plataforma facilita la organización de eventos con diferentes formatos de banda, gestión financiera, asignación de músicos y seguimiento de estados.

La plataforma resuelve la necesidad de centralizar la información de eventos musicales, automatizar cálculos financieros y proporcionar una interfaz intuitiva para la gestión diaria de eventos.

## 2. Características Principales

### 2.1 Roles de Usuario

| Rol | Método de Registro | Permisos Principales |
|-----|-------------------|---------------------|
| Admin | Creado por otro admin | Gestión completa: crear, editar, eliminar eventos y usuarios |
| User | Creado por admin con contraseña temporal | Solo visualización de eventos |

### 2.2 Módulo de Características

Nuestra plataforma de gestión de eventos musicales consta de las siguientes páginas principales:

1. **Dashboard Integrado**: calendario mensual (lado izquierdo), lista de eventos con filtros (lado derecho), modal/sidebar para crear y editar eventos
2. **Gestión de Usuarios**: administración de usuarios y permisos (solo admins)
3. **Gestión de Canciones**: listado de canciones disponibles para la banda con funcionalidad de búsqueda y adición mediante API de Deezer
4. **Login/Registro**: autenticación y cambio de contraseña inicial

### 2.3 Detalles de Páginas

| Nombre de Página | Nombre del Módulo | Descripción de Características |
|------------------|-------------------|--------------------------------|
| Dashboard Integrado | Calendario | Mostrar eventos del mes actual con navegación mensual en panel izquierdo |
| Dashboard Integrado | Lista de Eventos | Panel derecho con lista filtrable y expandible de eventos |
| Dashboard Integrado | Filtros y Búsqueda | Filtrar por próximos/pasados, tipo de evento, mes; buscar por nombre/ubicación |
| Dashboard Integrado | Modal de Evento | Modal/sidebar para crear, editar y ver detalles completos de eventos |
| Dashboard Integrado | Datos Básicos | Capturar nombre, fecha/hora, ubicación, contacto, comentarios en modal |
| Dashboard Integrado | Información Financiera | Gestionar caché, anticipo, IVA, estado de factura, alta del evento |
| Dashboard Integrado | Gestión de Músicos | Asignar músicos principales y sustitutos por instrumento |
| Dashboard Integrado | Cálculos Automáticos | Calcular formato de banda y desglose de IVA automáticamente |
| Dashboard Integrado | Acciones Rápidas | Editar, eliminar, WhatsApp directo desde lista (según permisos) |
| Gestión de Usuarios | Lista de Usuarios | Mostrar usuarios con estado activo/inactivo y roles |
| Gestión de Usuarios | Crear Usuario | Formulario para crear usuarios con permisos específicos |
| Gestión de Usuarios | Gestión de Permisos | Asignar y modificar permisos individuales de usuarios |
| Gestión de Canciones | Lista de Canciones | Mostrar listado completo de canciones disponibles para la banda con información detallada |
| Gestión de Canciones | Búsqueda Deezer | Campo de autocomplete conectado a API gratuita de Deezer para buscar canciones |
| Gestión de Canciones | Agregar Canción | Seleccionar canciones de resultados de Deezer y agregarlas al listado de la banda |
| Gestión de Canciones | Gestión de Repertorio | Organizar, filtrar y gestionar el repertorio completo de canciones |
| Login | Autenticación | Validar credenciales y gestionar sesiones |
| Login | Cambio de Contraseña | Forzar cambio de contraseña temporal en primer acceso |

## 3. Proceso Principal

**Flujo de Admin:**
El administrador accede al dashboard integrado donde ve el calendario (izquierda) y lista de eventos (derecha). Puede crear nuevos eventos abriendo el modal desde el botón de acción rápida, editar eventos existentes haciendo clic en la lista, gestionar usuarios desde el menú de navegación, y administrar el repertorio de canciones mediante la búsqueda en Deezer y gestión del listado.

**Flujo de Usuario Regular:**
El usuario accede al dashboard integrado para visualizar el calendario y lista de eventos. Puede usar filtros, búsquedas y ver detalles de eventos en el modal, consultar el listado de canciones disponibles, pero no puede modificar información ni acceder a la gestión de usuarios o agregar nuevas canciones.

**Flujo de Gestión de Canciones:**
Los usuarios autorizados pueden acceder a la sección de canciones desde la navegación principal, buscar nuevas canciones usando el autocomplete conectado a la API de Deezer, seleccionar canciones de los resultados y agregarlas al repertorio de la banda. El listado muestra información completa de cada canción incluyendo título, artista, álbum y duración.

```mermaid
graph TD
    A[Login] --> B[Dashboard Integrado]
    B --> C[Modal de Evento]
    C --> D[Crear/Editar Evento]
    C --> E[Ver Detalles]
    B --> F[Gestión de Usuarios]
    F --> G[Crear Usuario]
    B --> J[Gestión de Canciones]
    J --> K[Búsqueda Deezer]
    J --> L[Listado de Canciones]
    K --> M[Agregar Canción]
    E --> H[WhatsApp Contacto]
    B --> I[Filtros y Búsqueda]
```

## 4. Diseño de Interfaz de Usuario

### 4.1 Estilo de Diseño

- **Colores primarios y secundarios**: Celeste (#2DB2CA), Rojo pastel (#E58483), Naranja apagado (#BDB3A4), Amarillo claro (#FAF9ED), Blanco (#FFFFFF)
- **Estilo de botones**: Redondeados con sombras sutiles para efecto moderno
- **Fuente y tamaños preferidos**: Sans-serif moderna, tamaños 14px-16px para texto, 18px-24px para títulos
- **Estilo de layout**: Diseño basado en tarjetas con navegación lateral, header fijo
- **Sugerencias de emojis/iconos**: Iconos minimalistas de línea, emojis musicales (🎵, 🎸, 🥁) para tipos de eventos

### 4.2 Resumen de Diseño de Páginas

| Nombre de Página | Nombre del Módulo | Elementos de UI |
|------------------|-------------------|----------------|
| Dashboard Integrado | Header | Logo TriBeCa, datos de usuario, navegación principal con colores celeste y blanco |
| Dashboard Integrado | Panel Calendario | Grid mensual en lado izquierdo con eventos marcados en rojo pastel, navegación con flechas |
| Dashboard Integrado | Panel Lista | Lista de eventos en lado derecho con tarjetas expandibles y animaciones suaves |
| Dashboard Integrado | Filtros | Barra superior con dropdown y campos de búsqueda, bordes redondeados, colores celeste |
| Dashboard Integrado | Modal de Evento | Modal/sidebar deslizable con inputs de labels flotantes, validación visual |
| Dashboard Integrado | Cálculos en Modal | Secciones destacadas para mostrar totales con IVA en tarjetas amarillo claro |
| Dashboard Integrado | Botones de Acción | Botones flotantes y en lista con colores naranja apagado, iconos claros |
| Gestión de Usuarios | Tabla | Tabla responsive con estados visuales, botones de acción diferenciados por color |
| Gestión de Canciones | Header de Sección | Título "Canciones" con icono musical, botón de búsqueda destacado en celeste |
| Gestión de Canciones | Campo de Búsqueda | Input de autocomplete con icono de búsqueda, dropdown de resultados con animaciones suaves |
| Gestión de Canciones | Resultados Deezer | Tarjetas de canciones con imagen de álbum, título, artista, botón "Agregar" en naranja apagado |
| Gestión de Canciones | Lista de Repertorio | Grid responsive de tarjetas de canciones con información completa, colores amarillo claro para destacar |
| Gestión de Canciones | Tarjeta de Canción | Diseño limpio con imagen, título, artista, álbum, duración, botones de acción con iconos |

### 4.3 Responsividad

La plataforma es desktop-first con adaptación móvil completa. En móvil, la navegación lateral se convierte en menú hamburguesa superior, las tarjetas se apilan verticalmente, y se optimiza la interacción táctil con botones más grandes y espaciado adecuado.