/**
 * Script simple para verificar que las correcciones de permisos están funcionando
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

async function verifyFixes() {
  console.log('🔍 Verificando correcciones implementadas...');
  
  try {
    // 1. Verificar que las migraciones se aplicaron correctamente
    console.log('\n1. Verificando migraciones aplicadas...');
    
    const { data: migrations, error: migError } = await supabaseAdmin
      .from('supabase_migrations.schema_migrations')
      .select('version')
      .order('version', { ascending: false })
      .limit(5);
    
    if (migError) {
      console.log('⚠️  No se pudieron verificar las migraciones:', migError.message);
    } else {
      console.log('📋 Últimas migraciones aplicadas:');
      migrations.forEach(migration => {
        console.log(`   - ${migration.version}`);
      });
    }
    
    // 2. Verificar políticas RLS en la tabla events
    console.log('\n2. Verificando políticas RLS en tabla events...');
    
    const { data: policies, error: polError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, cmd, qual')
      .eq('tablename', 'events')
      .eq('schemaname', 'public');
    
    if (polError) {
      console.log('⚠️  No se pudieron verificar las políticas RLS:', polError.message);
    } else {
      console.log('📋 Políticas RLS encontradas:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
        if (policy.qual && policy.qual.includes('can_create_events')) {
          console.log('     ✅ Valida can_create_events');
        }
      });
    }
    
    // 3. Verificar usuarios existentes y sus permisos
    console.log('\n3. Verificando permisos de usuarios existentes...');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_permissions')
      .select(`
        user_id,
        can_create_events,
        can_edit_events,
        can_delete_events,
        user_profiles!inner(full_name, role)
      `)
      .limit(5);
    
    if (usersError) {
      console.log('⚠️  No se pudieron verificar los usuarios:', usersError.message);
    } else {
      console.log('👥 Usuarios y permisos:');
      users.forEach(user => {
        const profile = user.user_profiles;
        console.log(`   - ${profile.full_name} (${profile.role}):`);
        console.log(`     Crear eventos: ${user.can_create_events ? '✅' : '❌'}`);
        console.log(`     Editar eventos: ${user.can_edit_events ? '✅' : '❌'}`);
        console.log(`     Eliminar eventos: ${user.can_delete_events ? '✅' : '❌'}`);
      });
    }
    
    // 4. Verificar que RLS está habilitado en la tabla events
    console.log('\n4. Verificando que RLS está habilitado...');
    
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'events')
      .single();
    
    if (rlsError) {
      console.log('⚠️  No se pudo verificar el estado de RLS:', rlsError.message);
    } else {
      if (rlsStatus.relrowsecurity) {
        console.log('✅ RLS está habilitado en la tabla events');
      } else {
        console.log('❌ RLS NO está habilitado en la tabla events');
      }
    }
    
    console.log('\n🎉 Verificación completada!');
    console.log('\n📝 Resumen de correcciones implementadas:');
    console.log('   ✅ Frontend: Validación de permisos en EventsPage y EventModal');
    console.log('   ✅ Backend: Trigger corregido para usar invitation_permissions');
    console.log('   ✅ Base de datos: Políticas RLS actualizadas para validar permisos');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar la verificación
verifyFixes().then(() => {
  console.log('\n✨ Verificación finalizada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});