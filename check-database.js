#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mjc2ODksImV4cCI6MjA3MjMwMzY4OX0.uRuOGe-w6oWARoV9nRAm92GX61PfTEtiXnCQwqzyV6I'

// Crear cliente normal
const supabase = createClient(supabaseUrl, anonKey)

async function checkDatabase() {
  console.log('🔍 Verificando estado de la base de datos...')

  try {
    // Intentar consultar la tabla events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, location')
      .limit(3)

    if (eventsError) {
      console.log('❌ Error accediendo a la tabla events:', eventsError.message)

      // Verificar si es un problema de autenticación
      if (eventsError.message.includes('JWT')) {
        console.log('🔐 Problema de autenticación detectado')
      } else if (eventsError.message.includes('does not exist')) {
        console.log('📋 La tabla events no existe - necesitas crearla primero')
      } else {
        console.log('⚠️  Error desconocido:', eventsError)
      }

      return false
    }

    console.log(`✅ Tabla events encontrada con ${events?.length || 0} eventos`)

    if (events && events.length > 0) {
      console.log('\n📊 Muestra de eventos actuales:')
      events.forEach((event, idx) => {
        console.log(`   ${idx + 1}. ${event.name} - Location: ${event.location ? (typeof event.location) : 'null'}`)
      })
    }

    // Verificar otras tablas importantes
    console.log('\n🔍 Verificando otras tablas...')

    const { data: musicians, error: musiciansError } = await supabase
      .from('musicians')
      .select('id, name')
      .limit(1)

    if (musiciansError) {
      console.log('⚠️  Error accediendo a musicians:', musiciansError.message)
    } else {
      console.log(`✅ Tabla musicians: ${musicians?.length || 0} registros`)
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)

    if (profilesError) {
      console.log('⚠️  Error accediendo a profiles:', profilesError.message)
    } else {
      console.log(`✅ Tabla profiles: ${profiles?.length || 0} registros`)
    }

    return true

  } catch (error) {
    console.error('❌ Error general verificando base de datos:', error.message)
    return false
  }
}

async function main() {
  const dbExists = await checkDatabase()

  if (dbExists) {
    console.log('\n🎉 ¡La base de datos está funcionando!')
    console.log('\n📋 Para implementar las ubicaciones:')
    console.log('   1. 🌐 Ve a https://supabase.com/dashboard')
    console.log('   2. 📁 Selecciona tu proyecto')
    console.log('   3. 🛠️  Ve a SQL Editor')
    console.log('   4. 📝 Copia el contenido de add-location-field.sql')
    console.log('   5. ▶️  Ejecuta el SQL')
    console.log('   6. 🔄 Ejecuta: SELECT migrate_text_locations_to_jsonb();')
  } else {
    console.log('\n❌ Hay problemas con la base de datos')
    console.log('🔧 Verifica tu configuración de Supabase')
  }
}

main().catch(console.error)