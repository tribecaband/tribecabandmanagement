/**
 * Verificación simple de permisos de usuarios
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

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

async function simpleTest() {
  console.log('🔍 Verificación simple de permisos...');
  
  try {
    // Verificar usuarios y sus permisos
    console.log('\n👥 Consultando usuarios y permisos:');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_permissions')
      .select(`
        user_id,
        can_create_events,
        can_edit_events,
        can_delete_events
      `)
      .limit(10);
    
    if (usersError) {
      console.log('❌ Error al consultar usuarios:', usersError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${users.length} usuarios:`);
    
    let usersWithCreatePermission = 0;
    let usersWithoutCreatePermission = 0;
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. Usuario ID: ${user.user_id.substring(0, 8)}...`);
      console.log(`      Crear eventos: ${user.can_create_events ? '✅ SÍ' : '❌ NO'}`);
      console.log(`      Editar eventos: ${user.can_edit_events ? '✅ SÍ' : '❌ NO'}`);
      console.log(`      Eliminar eventos: ${user.can_delete_events ? '✅ SÍ' : '❌ NO'}`);
      
      if (user.can_create_events) {
        usersWithCreatePermission++;
      } else {
        usersWithoutCreatePermission++;
      }
    });
    
    console.log('\n📈 Resumen:');
    console.log(`   Usuarios CON permiso de crear eventos: ${usersWithCreatePermission}`);
    console.log(`   Usuarios SIN permiso de crear eventos: ${usersWithoutCreatePermission}`);
    
    if (usersWithoutCreatePermission > 0) {
      console.log('\n✅ CORRECTO: Existen usuarios sin permisos de creación de eventos');
      console.log('   Esto confirma que el sistema puede restringir permisos correctamente.');
    } else {
      console.log('\n⚠️  ADVERTENCIA: Todos los usuarios tienen permisos de creación');
      console.log('   Esto podría indicar que el trigger aún asigna permisos por defecto.');
    }
    
    // Verificar que RLS está funcionando intentando una consulta como usuario anónimo
    console.log('\n🔒 Verificando RLS con cliente anónimo...');
    
    const supabaseAnon = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    const { data: events, error: eventsError } = await supabaseAnon
      .from('events')
      .select('id, nombre_evento')
      .limit(5);
    
    if (eventsError) {
      console.log('❌ Error al consultar eventos como anónimo:', eventsError.message);
    } else {
      console.log(`✅ Cliente anónimo puede leer ${events.length} eventos (esto es correcto)`);
    }
    
    console.log('\n🎉 Verificación completada!');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar la verificación
simpleTest().then(() => {
  console.log('\n✨ Verificación finalizada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});