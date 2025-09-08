-- Fix RLS policies for events table to validate can_create_events permission
-- This ensures that only users with proper permissions can create events

-- Drop existing policies to recreate them with proper permission validation
DROP POLICY IF EXISTS "Users can insert events" ON events;
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Users can update events" ON events;
DROP POLICY IF EXISTS "Users can delete events" ON events;

-- Policy for viewing events (all authenticated users can view)
CREATE POLICY "Users can view events" ON events
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for creating events (only users with can_create_events permission)
CREATE POLICY "Users can create events with permission" ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
      AND up.can_create_events = true
    )
  );

-- Policy for updating events (only creators or users with edit permission)
CREATE POLICY "Users can update their events or with permission" ON events
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
      AND up.can_edit_events = true
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
      AND up.can_edit_events = true
    )
  );

-- Policy for deleting events (only users with delete permission)
CREATE POLICY "Users can delete events with permission" ON events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
      AND up.can_delete_events = true
    )
  );

-- Allow anon users to view events (for public access)
CREATE POLICY "Anonymous users can view events" ON events
  FOR SELECT
  TO anon
  USING (true);