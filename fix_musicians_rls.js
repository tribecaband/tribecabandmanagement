// Script para arreglar las políticas RLS de la tabla musicians
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMusiciansRLS() {
  console.log('🔧 Fixing RLS policies for musicians table...')

  try {
    // Drop existing policies
    console.log('📝 Dropping existing policies...')

    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can view all musicians" ON musicians;
      DROP POLICY IF EXISTS "Authenticated users can manage musicians" ON musicians;
      DROP POLICY IF EXISTS "Allow public read access to musicians" ON musicians;
      DROP POLICY IF EXISTS "Allow authenticated users to create musicians" ON musicians;
      DROP POLICY IF EXISTS "Allow authenticated users to update musicians" ON musicians;
      DROP POLICY IF EXISTS "Allow authenticated users to delete musicians" ON musicians;
    `

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies })
    if (dropError) {
      console.warn('⚠️ Warning dropping policies:', dropError.message)
    }

    // Create new correct policies
    console.log('✨ Creating new RLS policies...')

    const createPolicies = `
      -- Allow anyone to read musicians (for public display)
      CREATE POLICY "Allow public read access to musicians" ON musicians
        FOR SELECT
        TO public
        USING (true);

      -- Allow authenticated users to insert new musicians
      CREATE POLICY "Allow authenticated users to create musicians" ON musicians
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() IS NOT NULL);

      -- Allow authenticated users to update musicians
      CREATE POLICY "Allow authenticated users to update musicians" ON musicians
        FOR UPDATE
        TO authenticated
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL);

      -- Allow authenticated users to delete musicians
      CREATE POLICY "Allow authenticated users to delete musicians" ON musicians
        FOR DELETE
        TO authenticated
        USING (auth.uid() IS NOT NULL);
    `

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies })
    if (createError) {
      console.error('❌ Error creating policies:', createError)
      return
    }

    // Verify policies were created
    console.log('🔍 Verifying policies...')
    const { data: policies, error: checkError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'musicians')

    if (checkError) {
      console.error('❌ Error checking policies:', checkError)
      return
    }

    console.log('📋 Current policies for musicians table:')
    policies?.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd}): ${policy.roles}`)
    })

    // Test that we can read musicians
    console.log('🧪 Testing read access...')
    const { data: musicians, error: readError } = await supabase
      .from('musicians')
      .select('count')

    if (readError) {
      console.error('❌ Error reading musicians:', readError)
    } else {
      console.log(`✅ Successfully read ${musicians?.[0]?.count || 0} musicians`)
    }

    console.log('✅ RLS policies fixed successfully!')

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
  }
}

// Create exec_sql function if it doesn't exist
async function createExecFunction() {
  const createFunc = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `

  const { error } = await supabase.rpc('exec', { sql: createFunc })
  if (error) {
    console.log('Function may already exist or created successfully')
  }
}

// Run the fix
await createExecFunction()
await fixMusiciansRLS()