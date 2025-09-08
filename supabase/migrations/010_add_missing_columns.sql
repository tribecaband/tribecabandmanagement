-- Add missing columns that are causing errors in the application

-- Add color column to event_types table
ALTER TABLE public.event_types 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- Add date column to events table (this might be an alias or computed field)
-- Based on the existing schema, events already has fecha_evento (date)
-- The error might be from a query expecting 'date' instead of 'fecha_evento'
-- Let's add a computed column or view to handle this

-- Option 1: Add a computed column that aliases fecha_evento as date
-- This is not directly supported in PostgreSQL, so we'll create a view instead

-- Option 2: Add an actual date column and populate it from fecha_evento
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS date DATE;

-- Populate the new date column with existing fecha_evento data
UPDATE public.events 
SET date = fecha_evento 
WHERE date IS NULL AND fecha_evento IS NOT NULL;

-- Create a trigger to keep date column in sync with fecha_evento
CREATE OR REPLACE FUNCTION public.sync_event_date()
RETURNS TRIGGER AS $$
BEGIN
    -- When fecha_evento is updated, update date as well
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        NEW.date = NEW.fecha_evento;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync date with fecha_evento
DROP TRIGGER IF EXISTS sync_event_date_trigger ON public.events;
CREATE TRIGGER sync_event_date_trigger
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.sync_event_date();

-- Update default colors for existing event types
UPDATE public.event_types 
SET color = CASE 
    WHEN name = 'Concierto' THEN '#10B981'
    WHEN name = 'Festival' THEN '#F59E0B'
    WHEN name = 'Boda' THEN '#EF4444'
    WHEN name = 'Evento Corporativo' THEN '#3B82F6'
    WHEN name = 'Fiesta Privada' THEN '#8B5CF6'
    ELSE '#6B7280'
END
WHERE color = '#3B82F6' OR color IS NULL;

-- Verify the changes
SELECT 'Missing columns added' as status, 
       'color column added to event_types, date column added to events' as message;

-- Show updated event_types with colors
SELECT name, color FROM public.event_types ORDER BY name;