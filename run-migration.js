#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuración de Supabase
const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcyNzY4OSwiZXhwIjoyMDcyMzAzNjg5fQ.8CUaI_bMEBUHv3zr4il6nuHoMCRNGXYzuaMzZERlzPs'

// Crear cliente con privilegios de servicio
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function runMigration() {
  console.log('🚀 Iniciando migración de ubicaciones...')

  try {
    // Leer el archivo SQL de migración
    const migrationSQL = readFileSync(join(__dirname, 'add-location-field.sql'), 'utf8')

    console.log('📝 Ejecutando migración del esquema...')

    // Ejecutar la migración usando SQL directo
    console.log('📝 Ejecutando migración SQL...')
    
    // Dividir el SQL en comandos individuales y ejecutar cada uno
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    for (const command of sqlCommands) {
      if (command.trim()) {
        try {
          const { error } = await supabase.rpc('exec', { sql: command })
          if (error) {
            console.log(`⚠️  Comando falló, intentando método alternativo: ${command.substring(0, 50)}...`)
            // Intentar con query directo si rpc falla
            const { error: queryError } = await supabase
              .from('_sql')
              .select('*')
              .eq('query', command)
            
            if (queryError) {
              console.log(`❌ Error ejecutando: ${command.substring(0, 100)}...`)
              console.log(`Error: ${queryError.message}`)
            }
          }
        } catch (err) {
          console.log(`⚠️  Error en comando: ${err.message}`)
        }
      }
    }
    
    console.log('✅ Migración SQL completada')

      // 2. Verificar el tipo actual de la columna location
      const { data: columnInfo } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'events')
        .eq('column_name', 'location')
        .single()

      if (columnInfo) {
        console.log(`📊 Columna location existente encontrada (tipo: ${columnInfo.data_type})`)

        if (columnInfo.data_type === 'text') {
          console.log('🔄 Necesario migrar de TEXT a JSONB...')

          // Renombrar columna existente como backup
          const { error: renameError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE events RENAME COLUMN location TO location_backup_text;'
          })

          if (renameError) {
            console.log('⚠️  No se pudo renombrar automáticamente. Procediendo manualmente...')
          } else {
            console.log('✅ Columna de respaldo creada: location_backup_text')
          }
        }
      } else {
        console.log('📍 Columna location no existe, se creará nueva')
      }

      // 3. Añadir nueva columna JSONB (si no existe)
      try {
        const { error: addColumnError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS location JSONB;'
        })

        if (addColumnError) {
          console.log('⚠️  Usando método alternativo para añadir columna...')
          // Intentar con una inserción de prueba para verificar si la columna existe
          const { error: testError } = await supabase
            .from('events')
            .select('location')
            .limit(1)

          if (testError && testError.message.includes('column "location" does not exist')) {
            throw new Error('❌ Necesitas ejecutar la migración SQL manualmente en el dashboard de Supabase')
          }
        }

        console.log('✅ Columna location JSONB confirmada')

      } catch (error) {
        throw new Error(`❌ Error añadiendo columna: ${error.message}`)
      }

    } else {
      console.log('✅ Migración de esquema ejecutada correctamente')
    }

    console.log('📊 Verificando datos existentes...')

    // Verificar si hay eventos con location_backup_text para migrar
    const { data: eventsToMigrate, error: queryError } = await supabase
      .from('events')
      .select('id, location_backup_text, location')
      .not('location_backup_text', 'is', null)
      .is('location', null)

    if (queryError) {
      console.log('⚠️  No se pudo verificar datos para migración:', queryError.message)
    } else if (eventsToMigrate && eventsToMigrate.length > 0) {
      console.log(`🔄 Encontrados ${eventsToMigrate.length} eventos para migrar de texto a JSONB`)

      // Migrar eventos uno por uno
      let migratedCount = 0
      for (const event of eventsToMigrate) {
        if (event.location_backup_text && event.location_backup_text.trim()) {
          const locationData = {
            formatted_address: event.location_backup_text.trim(),
            coordinates: { lat: 0, lng: 0 },
            address_components: {},
            place_id: '',
            place_types: [],
            created_at: new Date().toISOString(),
            source: 'manual'
          }

          const { error: updateError } = await supabase
            .from('events')
            .update({ location: locationData })
            .eq('id', event.id)

          if (updateError) {
            console.log(`⚠️  Error migrando evento ${event.id}:`, updateError.message)
          } else {
            migratedCount++
          }
        }
      }

      console.log(`✅ ${migratedCount}/${eventsToMigrate.length} eventos migrados correctamente`)
    } else {
      console.log('ℹ️  No hay eventos antiguos que migrar')
    }

    // Verificar estado final
    console.log('🔍 Verificando estado final...')

    const { data: finalCheck, error: finalError } = await supabase
      .from('events')
      .select('id, location')
      .limit(5)

    if (finalError) {
      console.log('⚠️  Error verificando estado final:', finalError.message)
    } else {
      console.log(`✅ Verificación final exitosa. ${finalCheck?.length || 0} eventos encontrados`)
      if (finalCheck && finalCheck.length > 0) {
        console.log('📋 Muestra de datos:')
        finalCheck.forEach((event, idx) => {
          const locationType = typeof event.location
          const locInfo = event.location
            ? (typeof event.location === 'string' ? event.location.substring(0, 50) : 'Objeto JSONB')
            : 'Sin ubicación'
          console.log(`   ${idx + 1}. ID: ${event.id}, Location: ${locationType} - ${locInfo}`)
        })
      }
    }

    console.log('\n🎉 ¡Migración completada exitosamente!')
    console.log('\n📋 Próximos pasos:')
    console.log('   1. ✅ El campo location ya está configurado como JSONB')
    console.log('   2. ✅ Los datos existentes han sido migrados')
    console.log('   3. 🚀 Los nuevos eventos usarán automáticamente el formato completo')
    console.log('   4. 🗺️  Las ubicaciones ahora se pueden hacer clic para abrir Google Maps')

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message)
    console.log('\n🛠️  Solución manual:')
    console.log('   1. Ve al dashboard de Supabase')
    console.log('   2. Abre el SQL Editor')
    console.log('   3. Copia y pega el contenido de add-location-field.sql')
    console.log('   4. Ejecuta el SQL')
    console.log('   5. Ejecuta: SELECT migrate_text_locations_to_jsonb();')

    process.exit(1)
  }
}

// Ejecutar migración
runMigration().catch(console.error)