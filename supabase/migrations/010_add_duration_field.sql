-- Agregar campo duration a la tabla events
-- La duración se almacenará en minutos como entero

ALTER TABLE events 
ADD COLUMN duration INTEGER DEFAULT 180;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN events.duration IS 'Duración del evento en minutos';

-- Crear índice para consultas por duración si es necesario
-- CREATE INDEX idx_events_duration ON events(duration);