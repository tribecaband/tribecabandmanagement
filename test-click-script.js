// Script para ejecutar en la consola del navegador en localhost:5173
// Copiar y pegar este código en la consola del navegador

console.log('🧪 Iniciando test de clic en botón de editar evento');

// Buscar específicamente el botón de editar (icono de lápiz)
const editButtons = document.querySelectorAll('button[title="Editar evento"]');
console.log('✏️ Botones de editar encontrados:', editButtons.length);

// Buscar botones con la clase específica del botón de editar
const editButtonsByClass = document.querySelectorAll('button.text-\\[\\#F4A261\\]');
console.log('🎨 Botones con clase de editar encontrados:', editButtonsByClass.length);

// Buscar cualquier botón dentro de EventCard
const allButtons = document.querySelectorAll('.bg-white.rounded-lg button');
console.log('🔘 Todos los botones en cards encontrados:', allButtons.length);

// Intentar hacer clic en el primer botón de editar encontrado
if (editButtons.length > 0) {
    console.log('🖱️ Haciendo clic en el primer botón de editar...');
    editButtons[0].click();
    
    // Esperar un momento y verificar si se abrió el modal
    setTimeout(() => {
        const modal = document.querySelector('.fixed.inset-0.bg-black');
        const modalTitle = document.querySelector('h2:contains("Editar Evento")');
        if (modal) {
            console.log('✅ Modal encontrado después del clic');
            console.log('📝 Contenido del modal:', modal.innerHTML.substring(0, 200) + '...');
        } else {
            console.log('❌ No se encontró modal después del clic');
        }
    }, 500);
} else if (allButtons.length > 0) {
    console.log('🖱️ Haciendo clic en el primer botón encontrado en card...');
    allButtons[0].click();
    
    setTimeout(() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
            console.log('✅ Modal encontrado después del clic en botón genérico');
        } else {
            console.log('❌ No se encontró modal después del clic en botón genérico');
        }
    }, 500);
} else {
    console.log('❌ No se encontraron botones para hacer clic');
    
    // Mostrar información de debug
    const cards = document.querySelectorAll('.bg-white.rounded-lg');
    console.log('🃏 Cards encontradas:', cards.length);
    if (cards.length > 0) {
        console.log('🔍 Contenido de la primera card:', cards[0].innerHTML.substring(0, 300) + '...');
    }
}

console.log('🏁 Test completado - revisar logs anteriores');