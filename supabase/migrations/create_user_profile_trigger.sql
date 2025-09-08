-- Function to handle new user invitation acceptance
CREATE OR REPLACE FUNCTION handle_new_user_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile with data from invitation
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  
  -- Create default permissions for user role
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'user') = 'user' THEN
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
      true,   -- Users can create events
      false,  -- Users cannot edit events by default
      false,  -- Users cannot delete events
      false,  -- Users cannot view accounting
      false   -- Users cannot manage other users
    );
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'user') = 'admin' THEN
    -- Admin gets full permissions
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
      true,   -- Admins can create events
      true,   -- Admins can edit events
      true,   -- Admins can delete events
      true,   -- Admins can view accounting
      true    -- Admins can manage users
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_invitation();

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON user_profiles TO anon;
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;
GRANT SELECT ON user_permissions TO anon;
GRANT ALL PRIVILEGES ON user_permissions TO authenticated;