// Script de prueba para verificar la funcionalidad de actualización de eventos
// Este script simula una actualización de evento para verificar que las políticas RLS funcionan

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mjc2ODksImV4cCI6MjA3MjMwMzY4OX0.uRuOGe-w6oWARoV9nRAm92GX61PfTEtiXnCQwqzyV6I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventUpdate() {
  console.log('🧪 Iniciando prueba de actualización de eventos...');
  
  try {
    // 1. Obtener un evento existente
    console.log('📋 Obteniendo eventos existentes...');
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error al obtener eventos:', fetchError);
      return;
    }
    
    if (!events || events.length === 0) {
      console.log('⚠️ No hay eventos para probar');
      return;
    }
    
    const testEvent = events[0];
    console.log('✅ Evento encontrado:', testEvent.id, '-', testEvent.name);
    
    // 2. Intentar actualizar el evento
    console.log('🔄 Intentando actualizar el evento...');
    const updateData = {
      name: testEvent.name + ' (Actualizado)',
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', testEvent.id)
      .select();
    
    if (updateError) {
      console.error('❌ Error al actualizar evento:', updateError);
      console.error('Código de error:', updateError.code);
      console.error('Mensaje:', updateError.message);
      console.error('Detalles:', updateError.details);
      return;
    }
    
    if (updatedEvent && updatedEvent.length > 0) {
      console.log('✅ Evento actualizado exitosamente!');
      console.log('Datos actualizados:', updatedEvent[0]);
      
      // 3. Revertir el cambio
      console.log('🔄 Revirtiendo cambios...');
      const { error: revertError } = await supabase
        .from('events')
        .update({ name: testEvent.name })
        .eq('id', testEvent.id);
      
      if (revertError) {
        console.warn('⚠️ No se pudo revertir el cambio:', revertError);
      } else {
        console.log('✅ Cambios revertidos exitosamente');
      }
    } else {
      console.error('❌ No se devolvieron datos después de la actualización');
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la prueba
testEventUpdate();

console.log('🏁 Prueba de actualización de eventos completada');