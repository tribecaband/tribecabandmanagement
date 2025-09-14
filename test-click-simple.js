// Script simple para probar el clic en Geoapify
console.log('🔍 PRUEBA SIMPLE DE CLIC EN GEOAPIFY');
console.log('=====================================');

// Función para probar el clic
function testClick() {
  // 1. Buscar el input
  const input = document.querySelector('input[placeholder*="ubicación"]');
  if (!input) {
    console.log('❌ Input no encontrado');
    return;
  }
  
  console.log('✅ Input encontrado');
  
  // 2. Escribir "honky"
  input.focus();
  input.value = 'honky';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  
  console.log('✅ Búsqueda iniciada para "honky"');
  
  // 3. Esperar y hacer clic
  setTimeout(() => {
    const suggestions = document.querySelectorAll('[data-suggestion="true"]');
    console.log(`📋 Sugerencias encontradas: ${suggestions.length}`);
    
    if (suggestions.length > 0) {
      console.log('🖱️ Haciendo clic en la primera sugerencia...');
      suggestions[0].click();
      
      // Verificar resultado
      setTimeout(() => {
        console.log('📍 Valor del input después del clic:', input.value);
        const remainingSuggestions = document.querySelectorAll('[data-suggestion="true"]');
        console.log(`📋 Sugerencias restantes: ${remainingSuggestions.length}`);
        
        if (input.value.includes('Honky Tonk')) {
          console.log('✅ ¡ÉXITO! El clic funcionó');
        } else {
          console.log('❌ El clic no funcionó');
        }
      }, 1000);
    } else {
      console.log('❌ No hay sugerencias para hacer clic');
    }
  }, 3000);
}

// Exportar función
window.testClick = testClick;

console.log('💡 Ejecuta testClick() para probar');

// Auto-ejecutar si hay modal
if (document.querySelector('[role="dialog"]')) {
  console.log('🎯 Modal detectado, ejecutando en 2 segundos...');
  setTimeout(testClick, 2000);
}