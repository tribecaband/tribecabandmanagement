// Script para probar el envío del formulario EventModal
console.log('🧪 Iniciando prueba de envío de formulario...');

// Función para simular el envío del formulario
function testFormSubmit() {
  console.log('🔍 Buscando formulario en el DOM...');
  
  // Buscar el formulario
  const form = document.querySelector('form');
  if (!form) {
    console.error('❌ No se encontró ningún formulario en la página');
    return;
  }
  
  console.log('✅ Formulario encontrado:', form);
  
  // Buscar el botón de guardar
  const saveButton = document.querySelector('button[type="submit"]');
  if (!saveButton) {
    console.error('❌ No se encontró el botón de guardar');
    return;
  }
  
  console.log('✅ Botón de guardar encontrado:', saveButton);
  console.log('🔍 Texto del botón:', saveButton.textContent);
  console.log('🔍 Estado del botón (disabled):', saveButton.disabled);
  
  // Verificar si hay errores de validación visibles
  const errorMessages = document.querySelectorAll('.text-red-500');
  console.log('🔍 Mensajes de error encontrados:', errorMessages.length);
  errorMessages.forEach((error, index) => {
    console.log(`   Error ${index + 1}:`, error.textContent);
  });
  
  // Verificar campos requeridos
  const requiredFields = form.querySelectorAll('input[required], select[required]');
  console.log('🔍 Campos requeridos encontrados:', requiredFields.length);
  
  let hasEmptyRequired = false;
  requiredFields.forEach((field, index) => {
    const isEmpty = !field.value || field.value.trim() === '';
    console.log(`   Campo ${index + 1} (${field.name || field.id || 'sin nombre'}):`, {
      value: field.value,
      isEmpty: isEmpty,
      type: field.type
    });
    if (isEmpty) hasEmptyRequired = true;
  });
  
  console.log('🔍 ¿Hay campos requeridos vacíos?', hasEmptyRequired);
  
  // Intentar hacer clic en el botón
  console.log('🖱️ Simulando clic en el botón de guardar...');
  
  // Agregar listener temporal para capturar eventos
  const originalSubmit = form.onsubmit;
  form.addEventListener('submit', function(e) {
    console.log('🚀 ¡Evento submit capturado!', e);
    console.log('🔍 Evento preventDefault llamado:', e.defaultPrevented);
  }, { once: true });
  
  // Simular clic
  saveButton.click();
  
  // Esperar un momento y verificar logs
  setTimeout(() => {
    console.log('⏰ Verificando logs después de 2 segundos...');
    console.log('🔍 Estado final del botón (disabled):', saveButton.disabled);
  }, 2000);
}

// Ejecutar la prueba
testFormSubmit();

console.log('🧪 Script de prueba completado.');

// Instrucciones para usar este script:
// 1. Abre la aplicación en http://localhost:5173/
// 2. Haz clic en un evento para abrir el modal de edición
// 3. Abre la consola del navegador (F12)
// 4. Copia y pega este código en la consola
// 5. Presiona Enter para ejecutar
// 6. Observa los logs para diagnosticar el problema