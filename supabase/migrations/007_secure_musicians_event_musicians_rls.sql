BEGIN;

-- Ensure RLS is enabled
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Revoke any previous anon privileges
REVOKE ALL PRIVILEGES ON TABLE musicians FROM anon;
REVOKE ALL PRIVILEGES ON TABLE event_musicians FROM anon;
REVOKE ALL PRIVILEGES ON TABLE events FROM anon;

-- (Optional safety) Revoke PUBLIC select if any
REVOKE SELECT ON TABLE musicians FROM PUBLIC;
REVOKE SELECT ON TABLE event_musicians FROM PUBLIC;
REVOKE SELECT ON TABLE events FROM PUBLIC;

-- Drop overly-permissive policies on musicians
DROP POLICY IF EXISTS "Users can view all musicians" ON musicians;
DROP POLICY IF EXISTS "Allow public read access to musicians" ON musicians;
DROP POLICY IF EXISTS "Allow anonymous read access to musicians" ON musicians;
DROP POLICY IF EXISTS "Allow authenticated read access to musicians" ON musicians;
DROP POLICY IF EXISTS "Authenticated users can manage musicians" ON musicians;

-- Drop overly-permissive policies on event_musicians
DROP POLICY IF EXISTS "Users can view event musicians" ON event_musicians;
DROP POLICY IF EXISTS "Authenticated users can manage event musicians" ON event_musicians;

-- Drop conflicting policies on events
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can update events they created" ON events;
DROP POLICY IF EXISTS "Users can delete events they created" ON events;
DROP POLICY IF EXISTS "Admins can update all events" ON events;

-- Also drop (if exist) the secure policies defined below to allow re-running safely
-- Musicians policies
DROP POLICY IF EXISTS "musicians_select_authenticated" ON musicians;
DROP POLICY IF EXISTS "musicians_insert_admin_only" ON musicians;
DROP POLICY IF EXISTS "musicians_update_admin_only" ON musicians;
DROP POLICY IF EXISTS "musicians_delete_admin_only" ON musicians;

-- Event musicians policies
DROP POLICY IF EXISTS "event_musicians_select_authenticated" ON event_musicians;
DROP POLICY IF EXISTS "event_musicians_modify_owner_or_admin" ON event_musicians;

-- Events policies
DROP POLICY IF EXISTS "events_select_authenticated" ON events;
DROP POLICY IF EXISTS "events_insert_by_owner" ON events;
DROP POLICY IF EXISTS "events_update_owner_or_admin" ON events;
DROP POLICY IF EXISTS "events_delete_owner_or_admin" ON events;

-- Re-create secure policies
-- Musicians: only authenticated users can read; writes restricted to admins
CREATE POLICY "musicians_select_authenticated" ON musicians
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin-only writes on musicians (insert, update, delete)
CREATE POLICY "musicians_insert_admin_only" ON musicians
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY "musicians_update_admin_only" ON musicians
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY "musicians_delete_admin_only" ON musicians
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Event musicians: authenticated can read; modify only owner (creator of event) or admin
CREATE POLICY "event_musicians_select_authenticated" ON event_musicians
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "event_musicians_modify_owner_or_admin" ON event_musicians
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_musicians.event_id
        AND (
          EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = e.created_by
              AND (
                p.email = COALESCE((auth.jwt() ->> 'email'), '')
                OR p.role = 'admin'
              )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_musicians.event_id
        AND (
          EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = e.created_by
              AND (
                p.email = COALESCE((auth.jwt() ->> 'email'), '')
                OR p.role = 'admin'
              )
          )
        )
    )
  );

-- Ensure appropriate grants for authenticated users
GRANT SELECT ON TABLE musicians TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE event_musicians TO authenticated;

-- EVENTS: Authenticated-only read; creator (matched by profiles.email == JWT email) can insert/update/delete; admins can manage all
CREATE POLICY "events_select_authenticated" ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "events_insert_by_owner" ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = events.created_by
        AND p.email = COALESCE((auth.jwt() ->> 'email'), '')
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = events.created_by AND p.role = 'admin'
    )
  );

CREATE POLICY "events_update_owner_or_admin" ON events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = events.created_by
        AND (
          p.email = COALESCE((auth.jwt() ->> 'email'), '')
          OR p.role = 'admin'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = events.created_by
        AND (
          p.email = COALESCE((auth.jwt() ->> 'email'), '')
          OR p.role = 'admin'
        )
    )
  );

CREATE POLICY "events_delete_owner_or_admin" ON events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = events.created_by
        AND (
          p.email = COALESCE((auth.jwt() ->> 'email'), '')
          OR p.role = 'admin'
        )
    )
  );

-- Ensure grants for authenticated on events
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE events TO authenticated;

COMMIT;
