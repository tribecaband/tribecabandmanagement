// Script para probar la consulta de músicos directamente
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mjc2ODksImV4cCI6MjA3MjMwMzY4OX0.uRuOGe-w6oWARoV9nRAm92GX61PfTEtiXnCQwqzyV6I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMusiciansQuery() {
  console.log('🎵 Probando consulta de músicos...');
  
  try {
    // Probar la consulta exacta que usa el frontend
    const { data, error, count } = await supabase
      .from('musicians')
      .select('id, name, instrument, is_main', { count: 'exact' })
      .order('name');
    
    console.log('📊 Resultado de la consulta:');
    console.log('- Error:', error);
    console.log('- Datos:', data);
    console.log('- Cantidad:', count);
    
    if (error) {
      console.error('❌ Error en la consulta:', error.message);
      console.error('- Código:', error.code);
      console.error('- Detalles:', error.details);
      console.error('- Hint:', error.hint);
    } else {
      console.log('✅ Consulta exitosa');
      console.log(`📈 Se encontraron ${data?.length || 0} músicos`);
      
      if (data && data.length > 0) {
        console.log('🎼 Músicos encontrados:');
        data.forEach((musician, index) => {
          console.log(`  ${index + 1}. ${musician.name} - ${musician.instrument} ${musician.is_main ? '(Principal)' : ''}`);
        });
      } else {
        console.log('⚠️  No se encontraron músicos en la base de datos');
      }
    }
    
  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

// Probar también el estado de autenticación
async function checkAuthStatus() {
  console.log('🔐 Verificando estado de autenticación...');
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('❌ Error al obtener usuario:', error.message);
  } else if (user) {
    console.log('✅ Usuario autenticado:', user.email);
    console.log('- ID:', user.id);
    console.log('- Rol:', user.role);
  } else {
    console.log('⚠️  No hay usuario autenticado');
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de músicos...');
  console.log('================================');
  
  await checkAuthStatus();
  console.log('\n');
  await testMusiciansQuery();
  
  console.log('\n================================');
  console.log('✨ Pruebas completadas');
}

runTests().catch(console.error);