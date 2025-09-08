/**
 * Script de prueba para verificar que las restricciones de permisos funcionan correctamente
 * Este script simula la creación de un evento por un usuario sin permisos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testPermissions() {
  console.log('🧪 Iniciando pruebas de permisos...');
  
  try {
    // 1. Crear un usuario de prueba sin permisos de creación de eventos
    console.log('\n1. Creando usuario de prueba sin permisos...');
    
    const testEmail = `test-user-${Date.now()}@test.com`;
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(testEmail, {
      data: {
        full_name: 'Usuario de Prueba',
        role: 'user',
        permissions: {
          events: { read: true, write: false, delete: false }, // write: false = can_create_events: false
          accounting: { read: false, write: false, delete: false },
          admin: { read: false, write: false, delete: false }
        }
      }
    });
    
    if (inviteError) {
      console.error('❌ Error al crear usuario de prueba:', inviteError.message);
      return;
    }
    
    console.log('✅ Usuario de prueba creado:', testEmail);
    
    // 2. Verificar que el usuario tiene can_create_events = false
    console.log('\n2. Verificando permisos del usuario...');
    
    // Esperar un momento para que se procese el trigger
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: permissions, error: permError } = await supabaseAdmin
      .from('user_permissions')
      .select('can_create_events, can_edit_events, can_delete_events')
      .eq('user_id', inviteData.user.id)
      .single();
    
    if (permError) {
      console.error('❌ Error al verificar permisos:', permError.message);
      return;
    }
    
    console.log('📋 Permisos del usuario:', permissions);
    
    if (permissions.can_create_events) {
      console.error('❌ ERROR: El usuario tiene can_create_events = true cuando debería ser false');
      return;
    } else {
      console.log('✅ Correcto: El usuario tiene can_create_events = false');
    }
    
    // 3. Intentar crear un evento con este usuario (debería fallar)
    console.log('\n3. Intentando crear evento sin permisos (debería fallar)...');
    
    // Simular autenticación del usuario (usando admin client para simular)
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        nombre_evento: 'Evento de Prueba',
        fecha_evento: '2024-12-31',
        hora_evento: '20:00',
        ubicacion: 'Lugar de Prueba',
        comunidad_autonoma: 'Madrid',
        facturacion: 'No',
        requiere_alta: false,
        tipo_evento: 'Concierto',
        formato_banda: 'Banda',
        cache_euros: 1000,
        anticipo_euros: 0,
        persona_contacto: 'Contacto de Prueba',
        telefono_contacto: '123456789',
        voz: 'Julio',
        guitarra: 'Santi',
        bajo: 'Pablo',
        bateria: 'Javi',
        comentarios: 'Evento de prueba para validar permisos',
        latitud: 40.4168,
        longitud: -3.7038,
        created_by: inviteData.user.id
      });
    
    if (eventError) {
      if (eventError.message.includes('permission') || eventError.code === '42501') {
        console.log('✅ Correcto: La política RLS bloqueó la creación del evento');
        console.log('   Error esperado:', eventError.message);
      } else {
        console.error('❌ Error inesperado:', eventError.message);
      }
    } else {
      console.error('❌ ERROR CRÍTICO: El evento se creó cuando debería haber sido bloqueado!');
      console.log('   Evento creado:', eventData);
    }
    
    // 4. Limpiar: eliminar el usuario de prueba
    console.log('\n4. Limpiando usuario de prueba...');
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id);
    
    if (deleteError) {
      console.warn('⚠️  Advertencia: No se pudo eliminar el usuario de prueba:', deleteError.message);
    } else {
      console.log('✅ Usuario de prueba eliminado');
    }
    
    console.log('\n🎉 Pruebas completadas!');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testPermissions().then(() => {
  console.log('\n✨ Script de pruebas finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});