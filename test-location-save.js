// Script para probar el guardado de ubicación en EventModal
console.log('🧪 === PRUEBA DE GUARDADO DE UBICACIÓN ===');

// Función para probar el flujo completo
function testLocationSave() {
  console.log('🔍 Paso 1: Buscando eventos en el dashboard...');
  
  // Buscar el primer evento
  const firstEvent = document.querySelector('[class*="bg-white"][class*="rounded-lg"][class*="shadow"]');
  if (!firstEvent) {
    console.log('❌ No se encontraron eventos en el dashboard');
    console.log('💡 Asegúrate de estar en la página principal con eventos');
    return;
  }
  
  console.log('✅ Evento encontrado, abriendo modal...');
  
  // Hacer clic en el evento para abrir el modal
  firstEvent.click();
  
  setTimeout(() => {
    console.log('🔍 Paso 2: Verificando que el modal se abrió...');
    
    const modal = document.querySelector('[class*="fixed inset-0"]');
    if (!modal) {
      console.log('❌ Modal no se abrió');
      return;
    }
    
    console.log('✅ Modal abierto');
    
    // Buscar el campo de ubicación
    const locationInput = document.querySelector('input[placeholder*="ubicación"], input[placeholder*="location"], input[placeholder*="dirección"]');
    if (!locationInput) {
      console.log('❌ Campo de ubicación no encontrado');
      console.log('🔍 Buscando todos los inputs...');
      const allInputs = document.querySelectorAll('input');
      allInputs.forEach((input, index) => {
        console.log(`   Input ${index}: placeholder="${input.placeholder}", value="${input.value}"`);
      });
      return;
    }
    
    console.log('✅ Campo de ubicación encontrado:', locationInput.placeholder);
    
    // Simular escritura en el campo de ubicación
    console.log('🔍 Paso 3: Escribiendo en el campo de ubicación...');
    locationInput.focus();
    locationInput.value = 'Madrid';
    
    // Disparar eventos de input
    locationInput.dispatchEvent(new Event('input', { bubbles: true }));
    locationInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('✅ Texto escrito en el campo');
    
    // Esperar a que aparezcan las sugerencias
    setTimeout(() => {
      console.log('🔍 Paso 4: Buscando sugerencias...');
      
      const suggestions = document.querySelectorAll('[class*="suggestion"], [class*="cursor-pointer"], li[role="option"]');
      console.log(`🔍 Sugerencias encontradas: ${suggestions.length}`);
      
      if (suggestions.length === 0) {
        console.log('❌ No se encontraron sugerencias');
        console.log('💡 Verifica que la API de Geoapify esté funcionando');
        
        // Intentar enviar el formulario sin seleccionar ubicación
        console.log('🔍 Intentando enviar formulario sin ubicación seleccionada...');
        testFormSubmit();
        return;
      }
      
      console.log('✅ Sugerencias encontradas, seleccionando la primera...');
      
      // Hacer clic en la primera sugerencia
      suggestions[0].click();
      
      console.log('✅ Sugerencia seleccionada');
      
      // Esperar un momento y luego enviar el formulario
      setTimeout(() => {
        console.log('🔍 Paso 5: Enviando formulario...');
        testFormSubmit();
      }, 1000);
      
    }, 2000); // Esperar 2 segundos para las sugerencias
    
  }, 1500); // Esperar 1.5 segundos para que se abra el modal
}

// Función para probar el envío del formulario
function testFormSubmit() {
  console.log('🔍 Buscando formulario y botón de guardar...');
  
  const form = document.querySelector('form');
  if (!form) {
    console.log('❌ Formulario no encontrado');
    return;
  }
  
  const submitBtn = form.querySelector('button[type="submit"]');
  if (!submitBtn) {
    console.log('❌ Botón de guardar no encontrado');
    return;
  }
  
  console.log('✅ Formulario y botón encontrados');
  console.log('🔍 Estado del botón:', submitBtn.disabled ? 'Deshabilitado' : 'Habilitado');
  console.log('🔍 Texto del botón:', submitBtn.textContent?.trim());
  
  if (submitBtn.disabled) {
    console.log('❌ El botón está deshabilitado, verificando errores de validación...');
    
    const errors = document.querySelectorAll('.text-red-500, [class*="error"]');
    console.log(`🔍 Errores encontrados: ${errors.length}`);
    errors.forEach((error, index) => {
      console.log(`   Error ${index + 1}: ${error.textContent}`);
    });
    
    return;
  }
  
  console.log('🚀 Haciendo clic en "Guardar Evento"...');
  console.log('📋 OBSERVA LOS LOGS QUE APARECERÁN A CONTINUACIÓN:');
  console.log('   - Busca logs que empiecen con "🚀 EventModal onSubmit"');
  console.log('   - Verifica el valor de "📍 LocationData actual"');
  console.log('   - Revisa los "📍 Location data que se enviará"');
  
  // Capturar el evento submit
  let submitCaptured = false;
  form.addEventListener('submit', (e) => {
    submitCaptured = true;
    console.log('✅ Evento submit capturado');
  }, { once: true });
  
  // Hacer clic en el botón
  submitBtn.click();
  
  // Verificar después de un momento
  setTimeout(() => {
    if (submitCaptured) {
      console.log('✅ El formulario se envió correctamente');
      console.log('💡 Revisa los logs de "🚀 EventModal onSubmit" arriba');
    } else {
      console.log('❌ El formulario no se envió');
      console.log('💡 Puede haber errores de validación o JavaScript');
    }
  }, 2000);
}

// Ejecutar la prueba
testLocationSave();

console.log('💡 Esta prueba simulará:');
console.log('   1. Abrir un evento existente');
console.log('   2. Escribir en el campo de ubicación');
console.log('   3. Seleccionar una sugerencia');
console.log('   4. Enviar el formulario');
console.log('   5. Mostrar los logs de depuración');
console.log('\n🔍 Observa los logs que aparecerán...');