// Script de prueba para verificar el clic en sugerencias de Geoapify
// Ejecutar en la consola del navegador después de abrir el modal de evento

console.log('🔍 INICIANDO PRUEBA DE CLIC EN GEOAPIFY');
console.log('==========================================');

// Función para probar la selección de ubicación
function testGeoapifyClick() {
  console.log('\n🎯 PASO 1: Verificando elementos del DOM');
  
  // Buscar el input de ubicación
  const locationInput = document.querySelector('input[placeholder*="ubicación"]');
  if (!locationInput) {
    console.error('❌ No se encontró el input de ubicación');
    return;
  }
  console.log('✅ Input de ubicación encontrado:', locationInput);
  
  console.log('\n🎯 PASO 2: Simulando búsqueda');
  
  // Limpiar y enfocar el input
  locationInput.value = '';
  locationInput.focus();
  
  // Simular escritura
  const searchTerm = 'honky';
  locationInput.value = searchTerm;
  
  // Disparar eventos
  locationInput.dispatchEvent(new Event('input', { bubbles: true }));
  locationInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  console.log(`✅ Búsqueda simulada para: "${searchTerm}"`);
  console.log('⏳ Esperando respuesta de Geoapify...');
  
  // Esperar a que aparezcan las sugerencias
  setTimeout(() => {
    console.log('\n🎯 PASO 3: Verificando sugerencias');
    
    const suggestions = document.querySelectorAll('[class*="hover:bg-gray-50"][class*="cursor-pointer"]');
    console.log(`📋 Sugerencias encontradas: ${suggestions.length}`);
    
    if (suggestions.length > 0) {
      console.log('✅ Sugerencias disponibles');
      
      // Obtener la primera sugerencia
      const firstSuggestion = suggestions[0];
      const suggestionText = firstSuggestion.textContent;
      
      console.log('\n🎯 PASO 4: Probando eventos de clic');
      console.log(`🖱️ Intentando hacer clic en: "${suggestionText}"`);
      
      // Probar diferentes tipos de eventos
      console.log('\n📝 Probando onMouseDown...');
      firstSuggestion.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      
      setTimeout(() => {
        console.log('\n📝 Probando onClick...');
        firstSuggestion.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        
        setTimeout(() => {
          console.log('\n🎯 PASO 5: Verificando resultado');
          console.log('📍 Valor actual del input:', locationInput.value);
          
          // Verificar si las sugerencias se cerraron
          const remainingSuggestions = document.querySelectorAll('[class*="hover:bg-gray-50"][class*="cursor-pointer"]');
          console.log(`📋 Sugerencias restantes: ${remainingSuggestions.length}`);
          
          if (locationInput.value.includes('Honky Tonk') || locationInput.value.includes('Calle de Covarrubias')) {
            console.log('✅ ¡ÉXITO! La selección funcionó correctamente');
          } else {
            console.log('❌ La selección no funcionó. El input no se actualizó.');
          }
        }, 500);
      }, 500);
    } else {
      console.log('❌ No se encontraron sugerencias');
      console.log('💡 Posibles causas:');
      console.log('   - API key no configurada');
      console.log('   - Error en la respuesta de Geoapify');
      console.log('   - Problema de conectividad');
    }
  }, 3000); // Esperar 3 segundos para la respuesta de la API
}

// Función para verificar la estructura de datos
function checkDataStructure() {
  console.log('\n🔧 VERIFICANDO ESTRUCTURA DE DATOS');
  console.log('===================================');
  
  // Interceptar console.log para capturar los datos de ubicación
  const originalLog = console.log;
  let locationDataCaptured = null;
  
  console.log = function(...args) {
    if (args[0] && args[0].includes && args[0].includes('📊 Datos procesados antes de enviar:')) {
      locationDataCaptured = args[1];
      console.log('🎯 Datos de ubicación capturados:', locationDataCaptured);
      
      // Verificar estructura
      const expectedFields = ['name', 'source', 'place_id', 'created_at', 'coordinates', 'place_types', 'formatted_address', 'address_components'];
      const hasAllFields = expectedFields.every(field => locationDataCaptured && locationDataCaptured.hasOwnProperty(field));
      
      if (hasAllFields) {
        console.log('✅ Estructura de datos correcta');
        console.log('📋 Campos verificados:', expectedFields.join(', '));
      } else {
        console.log('❌ Estructura de datos incorrecta');
        console.log('📋 Campos faltantes:', expectedFields.filter(field => !locationDataCaptured || !locationDataCaptured.hasOwnProperty(field)));
      }
    }
    originalLog.apply(console, args);
  };
  
  console.log('✅ Interceptor de datos configurado');
}

// Función principal
function runFullTest() {
  console.log('\n🚀 EJECUTANDO PRUEBA COMPLETA');
  console.log('==============================');
  
  // Verificar que el modal esté abierto
  const modal = document.querySelector('[role="dialog"]');
  if (!modal) {
    console.log('⚠️ Modal no encontrado. Instrucciones:');
    console.log('   1. Abre un evento para editar o crea uno nuevo');
    console.log('   2. Ejecuta runFullTest() nuevamente');
    return;
  }
  
  console.log('✅ Modal encontrado');
  
  // Configurar interceptor de datos
  checkDataStructure();
  
  // Ejecutar prueba de clic
  testGeoapifyClick();
}

// Exportar funciones
window.testGeoapifyClick = testGeoapifyClick;
window.checkDataStructure = checkDataStructure;
window.runFullTest = runFullTest;

console.log('\n🛠️ FUNCIONES DISPONIBLES:');
console.log('   • runFullTest() - Ejecuta prueba completa');
console.log('   • testGeoapifyClick() - Prueba solo el clic');
console.log('   • checkDataStructure() - Verifica estructura de datos');
console.log('\n💡 Ejecuta runFullTest() para empezar');

// Auto-ejecutar si el modal está abierto
if (document.querySelector('[role="dialog"]')) {
  console.log('\n🎯 Modal detectado, ejecutando prueba automáticamente...');
  setTimeout(runFullTest, 1000);
} else {
  console.log('\n💡 Abre el modal de evento y ejecuta runFullTest()');
}