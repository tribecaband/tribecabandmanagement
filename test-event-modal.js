// Script completo para probar el EventModal
// INSTRUCCIONES:
// 1. Asegúrate de que http://localhost:5173/ esté abierto
// 2. Abre la consola del navegador (F12)
// 3. Copia y pega este código completo
// 4. Presiona Enter

console.log('🧪 === PRUEBA COMPLETA DEL EVENT MODAL ===');

// PASO 1: Verificar que hay eventos en la página
const eventCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-sm');
console.log('🔍 Eventos encontrados:', eventCards.length);

if (eventCards.length === 0) {
  console.log('❌ No se encontraron eventos. Verifica que la página esté cargada.');
} else {
  console.log('✅ Eventos encontrados, continuando...');
  
  // PASO 2: Hacer clic en el primer evento para abrir el modal
  const firstEvent = eventCards[0];
  console.log('🖱️ Haciendo clic en el primer evento...');
  
  // Buscar el botón de editar específicamente
  const editButton = firstEvent.querySelector('button[title="Editar evento"]');
  
  if (editButton) {
    console.log('✅ Botón de editar encontrado');
    editButton.click();
    
    // PASO 3: Esperar a que se abra el modal y verificar
    setTimeout(() => {
      console.log('🔍 === VERIFICANDO MODAL ===');
      
      const modal = document.querySelector('[class*="fixed inset-0"]');
      const form = document.querySelector('form');
      
      console.log('Modal abierto:', !!modal);
      console.log('Formulario encontrado:', !!form);
      
      if (!modal || !form) {
        console.log('❌ PROBLEMA: Modal o formulario no encontrado');
        console.log('💡 Verifica que el clic en el evento funcione correctamente');
        return;
      }
      
      console.log('✅ Modal abierto correctamente, analizando formulario...');
      
      // PASO 4: Verificar que el formulario se llene con datos del evento
      const fields = {
        title: form.querySelector('input[name="title"], input[placeholder*="Título"]'),
        contact_person: form.querySelector('input[name="contact_person"], input[placeholder*="contacto"]'),
        contact_phone: form.querySelector('input[name="contact_phone"], input[type="tel"]'),
        date: form.querySelector('input[type="date"]'),
        time: form.querySelector('input[type="time"]'),
        venue: form.querySelector('input[name="venue"], input[placeholder*="lugar"]'),
        base_amount: form.querySelector('input[name="base_amount"], input[placeholder="0.00"]')
      };
      
      console.log('🔍 === DATOS DEL FORMULARIO ===');
      let allFieldsValid = true;
      let emptyFields = [];
      
      Object.entries(fields).forEach(([fieldName, field]) => {
        if (field) {
          const value = field.value;
          const isEmpty = !value || value.trim() === '';
          const isValid = field.checkValidity();
          
          console.log(`${isEmpty ? '⚠️' : '✅'} ${fieldName}:`, {
            valor: value,
            vacio: isEmpty,
            valido: isValid,
            mensaje: field.validationMessage
          });
          
          if (isEmpty) {
            emptyFields.push(fieldName);
            allFieldsValid = false;
          }
          if (!isValid) {
            allFieldsValid = false;
          }
        } else {
          console.log(`❌ ${fieldName}: Campo no encontrado`);
          allFieldsValid = false;
        }
      });
      
      // PASO 5: Verificar botón de guardar
      const submitBtn = form.querySelector('button[type="submit"]');
      console.log('🔍 === BOTÓN DE GUARDAR ===');
      console.log('Botón encontrado:', !!submitBtn);
      console.log('Texto del botón:', submitBtn?.textContent?.trim());
      console.log('Deshabilitado:', submitBtn?.disabled);
      
      // PASO 6: Diagnóstico y recomendaciones
      console.log('🔍 === DIAGNÓSTICO ===');
      
      if (emptyFields.length > 0) {
        console.log('❌ PROBLEMA ENCONTRADO: Campos vacíos');
        console.log('   Campos vacíos:', emptyFields);
        console.log('💡 CAUSA PROBABLE: El formulario no se está llenando con los datos del evento');
        console.log('💡 SOLUCIÓN: Verificar la función handleEventClick en Dashboard.tsx');
      } else if (!allFieldsValid) {
        console.log('❌ PROBLEMA ENCONTRADO: Errores de validación');
        console.log('💡 CAUSA PROBABLE: Datos inválidos en los campos');
      } else {
        console.log('✅ Todos los campos están llenos y válidos');
        
        // PASO 7: Probar el envío del formulario
        console.log('🔍 === PROBANDO ENVÍO ===');
        
        let submitTriggered = false;
        const submitHandler = (e) => {
          submitTriggered = true;
          console.log('🚀 ¡SUBMIT CAPTURADO!');
          console.log('   Evento:', e.type);
          console.log('   Prevented:', e.defaultPrevented);
        };
        
        form.addEventListener('submit', submitHandler, { once: true });
        
        if (submitBtn && !submitBtn.disabled) {
          console.log('🖱️ Haciendo clic en Guardar...');
          submitBtn.click();
          
          setTimeout(() => {
            if (submitTriggered) {
              console.log('✅ El evento submit se disparó correctamente');
              console.log('💡 Si el evento no se guarda, el problema está en la función onSubmit');
            } else {
              console.log('❌ El evento submit NO se disparó');
              console.log('💡 Verificar validación del formulario o errores de JavaScript');
            }
          }, 1000);
        } else {
          console.log('❌ No se puede hacer clic en el botón de guardar');
        }
      }
      
    }, 1500); // Esperar 1.5 segundos para que se abra el modal
    
  } else {
    console.log('❌ No se encontró el botón de editar');
    console.log('💡 Intentando hacer clic directamente en la tarjeta del evento...');
    
    // Fallback: hacer clic en la tarjeta completa
    firstEvent.click();
    
    setTimeout(() => {
      const modal = document.querySelector('[class*="fixed inset-0"]');
      if (modal) {
        console.log('✅ Modal abierto con clic en tarjeta');
      } else {
        console.log('❌ Modal no se abrió. Verificar handleEventClick en Dashboard.tsx');
      }
    }, 1500);
  }
}

console.log('🧪 === PRUEBA INICIADA ===');
console.log('💡 Revisa los logs que aparecerán en los próximos segundos...');