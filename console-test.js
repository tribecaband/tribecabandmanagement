// Script simplificado para diagnosticar el problema del formulario
// INSTRUCCIONES:
// 1. Abre http://localhost:5173/ en el navegador
// 2. Haz clic en un evento para abrir el modal de edición
// 3. Abre la consola del navegador (F12)
// 4. Copia y pega este código
// 5. Presiona Enter

console.log('🧪 === DIAGNÓSTICO RÁPIDO DEL FORMULARIO ===');

// Buscar el formulario
const form = document.querySelector('form');
if (!form) {
  console.log('❌ No hay formulario abierto. Abre el modal de edición primero.');
} else {
  console.log('✅ Formulario encontrado');
  
  // Verificar campos requeridos
  const requiredFields = [
    { name: 'title', selector: 'input[name="title"]' },
    { name: 'contact_person', selector: 'input[name="contact_person"]' },
    { name: 'contact_phone', selector: 'input[name="contact_phone"]' },
    { name: 'date', selector: 'input[type="date"]' },
    { name: 'time', selector: 'input[type="time"]' },
    { name: 'venue', selector: 'input[name="venue"]' },
    { name: 'base_amount', selector: 'input[name="base_amount"]' }
  ];
  
  console.log('🔍 === VERIFICANDO CAMPOS ===');
  let hasEmptyFields = false;
  
  requiredFields.forEach(({ name, selector }) => {
    const field = form.querySelector(selector);
    if (field) {
      const isEmpty = !field.value || field.value.trim() === '';
      console.log(`${isEmpty ? '❌' : '✅'} ${name}: "${field.value}"`);
      if (isEmpty) hasEmptyFields = true;
    } else {
      console.log(`❓ ${name}: Campo no encontrado`);
    }
  });
  
  // Verificar validez del formulario
  const isValid = form.checkValidity();
  console.log('🔍 Formulario válido:', isValid);
  
  if (hasEmptyFields) {
    console.log('⚠️ HAY CAMPOS VACÍOS - El formulario no se enviará');
    console.log('💡 SOLUCIÓN: Llenar todos los campos requeridos');
  } else if (!isValid) {
    console.log('⚠️ FORMULARIO INVÁLIDO - Verificar errores de validación');
  } else {
    console.log('✅ Formulario válido, probando envío...');
    
    // Capturar logs de onSubmit
    console.log('🎯 MONITOREANDO LOGS DE onSubmit...');
    console.log('💡 Busca logs que empiecen con "🚀 EventModal onSubmit"');
    
    // Intentar envío
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn && !submitBtn.disabled) {
      console.log('🖱️ Haciendo clic en Guardar...');
      submitBtn.click();
      console.log('✅ Clic realizado. Revisa los logs de onSubmit arriba.');
    } else {
      console.log('❌ Botón de guardar no disponible');
    }
  }
}

console.log('🧪 === FIN DEL DIAGNÓSTICO ===');