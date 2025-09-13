#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcyNzY4OSwiZXhwIjoyMDcyMzAzNjg5fQ.8CUaI_bMEBUHv3zr4il6nuHoMCRNGXYzuaMzZERlzPs'

// Crear cliente con privilegios de servicio
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function migrateLLocationField() {
  console.log('🚀 Iniciando migración simple del campo location...')

  try {
    // 1. Verificar estructura actual
    console.log('🔍 Verificando estructura actual...')
    const { data: events, error: selectError } = await supabase
      .from('events')
      .select('id, location')
      .limit(1)
    
    if (selectError) {
      console.error('❌ Error accediendo a eventos:', selectError.message)
      return
    }
    
    console.log('✅ Tabla events accesible')
    
    // 2. Verificar si ya hay datos JSONB
    if (events && events.length > 0) {
      const sampleLocation = events[0].location
      console.log('📍 Muestra de location actual:', typeof sampleLocation, sampleLocation)
      
      if (typeof sampleLocation === 'object' && sampleLocation !== null) {
        console.log('✅ El campo location ya es JSONB')
        return
      }
    }
    
    // 3. Obtener todos los eventos con location de texto
    console.log('📋 Obteniendo eventos para migrar...')
    const { data: allEvents, error: getAllError } = await supabase
      .from('events')
      .select('id, location')
      .not('location', 'is', null)
    
    if (getAllError) {
      console.error('❌ Error obteniendo eventos:', getAllError.message)
      return
    }
    
    console.log(`📊 Encontrados ${allEvents?.length || 0} eventos para migrar`)
    
    // 4. Migrar cada evento individualmente
    if (allEvents && allEvents.length > 0) {
      for (const event of allEvents) {
        if (typeof event.location === 'string') {
          const locationData = {
            formatted_address: event.location,
            coordinates: null,
            address_components: [],
            place_id: null,
            types: [],
            name: null,
            vicinity: null,
            created_at: new Date().toISOString(),
            source: 'migration'
          }
          
          const { error: updateError } = await supabase
            .from('events')
            .update({ location: locationData })
            .eq('id', event.id)
          
          if (updateError) {
            console.error(`❌ Error migrando evento ${event.id}:`, updateError.message)
          } else {
            console.log(`✅ Migrado evento ${event.id}`)
          }
        }
      }
    }
    
    console.log('🎉 Migración completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message)
  }
}

migrateLLocationField().catch(console.error)