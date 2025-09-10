import { createClient } from '@supabase/supabase-js';

// Credenciales de Supabase
const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcyNzY4OSwiZXhwIjoyMDcyMzAzNjg5fQ.8CUaI_bMEBUHv3zr4il6nuHoMCRNGXYzuaMzZERlzPs';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mjc2ODksImV4cCI6MjA3MjMwMzY4OX0.uRuOGe-w6oWARoV9nRAm92GX61PfTEtiXnCQwqzyV6I';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Crear clientes con diferentes claves
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function checkPermissions() {
  try {
    console.log('Checking table permissions with service role...');
    
    // Verificar permisos de las tablas con service role
    const { data: permissions, error } = await supabaseService
      .rpc('check_table_permissions');
    
    if (error) {
      console.log('RPC not available, trying direct query...');
      // Intentar consulta directa
      const { data: directPermissions, error: directError } = await supabaseService
        .from('information_schema.role_table_grants')
        .select('grantee, table_name, privilege_type')
        .in('table_name', ['event_musicians', 'musicians'])
        .in('grantee', ['anon', 'authenticated'])
        .eq('table_schema', 'public');
      
      if (directError) {
        console.error('Error checking permissions:', directError);
      } else {
        console.log('Table permissions:', directPermissions);
      }
    } else {
      console.log('Table permissions:', permissions);
    }
    
    // Intentar consultar las tablas directamente con anon key
    console.log('\nTesting direct queries with anon key...');
    
    // Consultar musicians con anon
    console.log('Querying musicians table with anon...');
    const { data: musiciansAnon, error: musiciansAnonError } = await supabaseAnon
      .from('musicians')
      .select('*')
      .limit(5);
    
    if (musiciansAnonError) {
      console.error('Error querying musicians with anon:', musiciansAnonError);
    } else {
      console.log('Musicians found with anon:', musiciansAnon?.length || 0);
    }
    
    // Consultar event_musicians con anon
    console.log('Querying event_musicians table with anon...');
    const { data: eventMusiciansAnon, error: eventMusiciansAnonError } = await supabaseAnon
      .from('event_musicians')
      .select('*')
      .limit(5);
    
    if (eventMusiciansAnonError) {
      console.error('Error querying event_musicians with anon:', eventMusiciansAnonError);
    } else {
      console.log('Event musicians found with anon:', eventMusiciansAnon?.length || 0);
    }
    
    // Intentar consultar las tablas directamente con service role
    console.log('\nTesting direct queries with service role...');
    
    // Consultar musicians con service role
    console.log('Querying musicians table with service role...');
    const { data: musiciansService, error: musiciansServiceError } = await supabaseService
      .from('musicians')
      .select('*')
      .limit(5);
    
    if (musiciansServiceError) {
      console.error('Error querying musicians with service role:', musiciansServiceError);
    } else {
      console.log('Musicians found with service role:', musiciansService?.length || 0);
    }
    
    // Consultar event_musicians con service role
    console.log('Querying event_musicians table with service role...');
    const { data: eventMusiciansService, error: eventMusiciansServiceError } = await supabaseService
      .from('event_musicians')
      .select('*')
      .limit(5);
    
    if (eventMusiciansServiceError) {
      console.error('Error querying event_musicians with service role:', eventMusiciansServiceError);
    } else {
      console.log('Event musicians found with service role:', eventMusiciansService?.length || 0);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkPermissions();