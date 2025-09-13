# Configuración de Geoapify API

Este proyecto ahora utiliza Geoapify API en lugar de Nominatim para mejorar la búsqueda de direcciones con números específicos (como "Avenida Donostiarra 17").

## ¿Por qué Geoapify?

- **Mejor soporte para direcciones con números**: Geoapify tiene mejor precisión para encontrar direcciones específicas con números de casa
- **Plan gratuito generoso**: 3,000 requests por día sin tarjeta de crédito <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>
- **Datos confiables**: Utiliza múltiples fuentes de datos incluyendo OpenStreetMap, OpenAddresses, y más <mcreference link="https://www.geoapify.com/geocoding-api/" index="4">4</mcreference>
- **Fácil de usar**: API simple y bien documentada <mcreference link="https://www.geoapify.com/" index="2">2</mcreference>

## Pasos para obtener tu API Key gratuita

### 1. Registro en Geoapify

1. Ve a [geoapify.com](https://www.geoapify.com/) <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>
2. Haz clic en "Sign Up" en la esquina superior derecha
3. Haz clic en "Create an account" e ingresa:
   - Tu dirección de email
   - Una contraseña
   - Otra información requerida
4. **No se requiere tarjeta de crédito** <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>

### 2. Verificación de email

1. Revisa tu bandeja de entrada para un email de verificación de `noreply@myprojects.geoapify.com`
2. Haz clic en el enlace de verificación en el email
3. **Nota**: Puedes crear un proyecto sin verificar el email si no lo recibes <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>

### 3. Crear un proyecto y obtener API Key

1. Una vez logueado, ve a la página "My Projects"
2. Haz clic en "Create a project" <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>
3. **Tu primera API key se generará automáticamente** <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>
4. Copia la API key generada

### 4. Configurar en el proyecto

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Reemplaza `your_geoapify_api_key_here` con tu API key real:
   ```
   VITE_GEOAPIFY_API_KEY=tu_api_key_aqui
   ```
3. Guarda el archivo
4. Reinicia el servidor de desarrollo si está corriendo

## Límites del plan gratuito

- **3,000 requests por día** <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>
- Uso comercial permitido <mcreference link="https://www.geoapify.com/" index="2">2</mcreference>
- Sin restricciones en el almacenamiento de resultados <mcreference link="https://www.geoapify.com/" index="2">2</mcreference>

## Características mejoradas

Con Geoapify API, el autocompletado de ubicaciones ahora:

- ✅ Encuentra direcciones específicas con números (ej: "Avenida Donostiarra 17")
- ✅ Proporciona niveles de confianza para cada resultado
- ✅ Soporta múltiples idiomas
- ✅ Maneja direcciones con errores tipográficos
- ✅ Retorna información estructurada de direcciones

## Solución de problemas

### El botón "Register" está deshabilitado
- Asegúrate de que tu navegador esté actualizado
- Desactiva extensiones del navegador que puedan interferir con reCAPTCHA
- Intenta desde una red o dispositivo diferente <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>

### No recibo el email de verificación
- Revisa tu carpeta de spam
- El email puede tardar unas horas
- Puedes crear un proyecto sin verificar el email <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>

## Recursos adicionales

- [Documentación de Geoapify](https://apidocs.geoapify.com/) <mcreference link="https://apidocs.geoapify.com/" index="5">5</mcreference>
- [API Playground](https://www.geoapify.com/maps-api/) - Prueba las APIs sin registro <mcreference link="https://www.geoapify.com/maps-api/" index="3">3</mcreference>
- [Guía de inicio](https://www.geoapify.com/get-started-with-maps-api/) <mcreference link="https://www.geoapify.com/get-started-with-maps-api/" index="1">1</mcreference>