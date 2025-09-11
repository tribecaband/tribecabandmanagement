// Script para probar el flujo completo del formulario
// INSTRUCCIONES:
// 1. Abre http://localhost:5173/ en el navegador
// 2. Abre la consola del navegador (F12)
// 3. Copia y pega este código
// 4. Presiona Enter

console.log('🧪 === PRUEBA COMPLETA DEL FORMULARIO ===');

// Función para esperar un elemento
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} no encontrado en ${timeout}ms`));
    }, timeout);
  });
}

// Función principal
async function testEventModal() {
  try {
    console.log('🔍 Paso 1: Buscando eventos en la página...');
    
    // Buscar botón de editar evento
    const editButton = document.querySelector('button[title="Editar evento"], button:has(svg)');
    if (!editButton) {
      console.log('❌ No se encontró botón de editar evento');
      console.log('💡 Asegúrate de que hay eventos en la lista');
      return;
    }
    
    console.log('✅ Botón de editar encontrado, haciendo clic...');
    editButton.click();
    
    console.log('🔍 Paso 2: Esperando que se abra el modal...');
    await waitForElement('form', 3000);
    
    const form = document.querySelector('form');
    console.log('✅ Modal abierto, formulario encontrado');
    
    console.log('🔍 Paso 3: Verificando campos del formulario...');
    
    // Verificar y llenar campos si están vacíos
    const fields = {
      title: { selector: 'input[name="title"]', value: 'Evento de Prueba' },
      contact_person: { selector: 'input[name="contact_person"]', value: 'Juan Pérez' },
      contact_phone: { selector: 'input[name="contact_phone"]', value: '+1234567890' },
      date: { selector: 'input[type="date"]', value: '2024-12-31' },
      time: { selector: 'input[type="time"]', value: '20:00' },
      venue: { selector: 'input[name="venue"]', value: 'Venue de Prueba' },
      base_amount: { selector: 'input[name="base_amount"]', value: '1000' }
    };
    
    let fieldsOk = true;
    
    for (const [fieldName, config] of Object.entries(fields)) {
      const field = form.querySelector(config.selector);
      if (field) {
        if (!field.value || field.value.trim() === '') {
          console.log(`🔧 Llenando campo ${fieldName} con: ${config.value}`);
          field.value = config.value;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          console.log(`✅ Campo ${fieldName} ya tiene valor: ${field.value}`);
        }
      } else {
        console.log(`❌ Campo ${fieldName} no encontrado`);
        fieldsOk = false;
      }
    }
    
    if (!fieldsOk) {
      console.log('❌ Algunos campos no se encontraron, abortando prueba');
      return;
    }
    
    console.log('🔍 Paso 4: Verificando validez del formulario...');
    const isValid = form.checkValidity();
    console.log('Formulario válido:', isValid);
    
    if (!isValid) {
      console.log('❌ Formulario inválido, verificando errores...');
      Object.entries(fields).forEach(([name, config]) => {
        const field = form.querySelector(config.selector);
        if (field && !field.checkValidity()) {
          console.log(`❌ ${name}: ${field.validationMessage}`);
        }
      });
      return;
    }
    
    console.log('🔍 Paso 5: Preparando para capturar logs de onSubmit...');
    console.log('🎯 MONITOREANDO LOGS - Busca mensajes que empiecen con "🚀 EventModal onSubmit"');
    
    // Buscar botón de guardar
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) {
      console.log('❌ Botón de guardar no encontrado');
      return;
    }
    
    if (submitBtn.disabled) {
      console.log('❌ Botón de guardar está deshabilitado');
      return;
    }
    
    console.log('🔍 Paso 6: Enviando formulario...');
    console.log('🖱️ Haciendo clic en "Guardar Evento"...');
    
    // Capturar evento submit
    let submitFired = false;
    form.addEventListener('submit', (e) => {
      submitFired = true;
      console.log('🚀 ¡EVENTO SUBMIT CAPTURADO!');
      console.log('🔍 Evento preventDefault:', e.defaultPrevented);
    }, { once: true });
    
    submitBtn.click();
    
    // Verificar después de un momento
    setTimeout(() => {
      if (submitFired) {
        console.log('✅ Evento submit se disparó correctamente');
        console.log('💡 Revisa arriba los logs de "🚀 EventModal onSubmit" para ver si la función se ejecutó');
      } else {
        console.log('❌ El evento submit NO se disparó');
        console.log('💡 Esto indica un problema con la validación o configuración del formulario');
      }
    }, 1000);
    
  } catch (error) {
    console.log('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testEventModal();

console.log('🧪 === PRUEBA INICIADA ===');
console.log('💡 Observa los logs arriba para ver el progreso');}}}