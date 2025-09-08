-- Fix user permissions trigger to respect invitation permissions
-- This fixes the issue where can_create_events was always set to true

CREATE OR REPLACE FUNCTION handle_new_user_invitation()
RETURNS TRIGGER AS $$
DECLARE
  invitation_permissions jsonb;
  user_role text;
  can_create_events_perm boolean := false;
  can_edit_events_perm boolean := false;
  can_delete_events_perm boolean := false;
  can_view_accounting_perm boolean := false;
  can_manage_users_perm boolean := false;
BEGIN
  -- Get role and permissions from invitation metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  invitation_permissions := NEW.raw_user_meta_data->'permissions';
  
  -- Create user profile with data from invitation
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role
  );
  
  -- Set permissions based on role and invitation data
  IF user_role = 'admin' THEN
    -- Admin gets full permissions
    can_create_events_perm := true;
    can_edit_events_perm := true;
    can_delete_events_perm := true;
    can_view_accounting_perm := true;
    can_manage_users_perm := true;
  ELSIF user_role = 'manager' THEN
    -- Manager gets event permissions but limited accounting/user management
    can_create_events_perm := true;
    can_edit_events_perm := true;
    can_delete_events_perm := false;
    can_view_accounting_perm := true;
    can_manage_users_perm := false;
  ELSE
    -- For regular users, read permissions from invitation metadata
    -- Default to false if not specified
    can_create_events_perm := COALESCE((invitation_permissions->'events'->>'write')::boolean, false);
    can_edit_events_perm := false;  -- Users cannot edit events by default
    can_delete_events_perm := COALESCE((invitation_permissions->'events'->>'delete')::boolean, false);
    can_view_accounting_perm := COALESCE((invitation_permissions->'accounting'->>'read')::boolean, false);
    can_manage_users_perm := COALESCE((invitation_permissions->'admin'->>'write')::boolean, false);
  END IF;
  
  -- Create permissions record
  INSERT INTO public.user_permissions (
    user_id,
    can_create_events,
    can_edit_events,
    can_delete_events,
    can_view_accounting,
    can_manage_users
  )
  VALUES (
    NEW.id,
    can_create_events_perm,
    can_edit_events_perm,
    can_delete_events_perm,
    can_view_accounting_perm,
    can_manage_users_perm
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger is already created, so we don't need to recreate it
-- It will automatically use the updated function