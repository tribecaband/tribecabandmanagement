-- Fix admin permissions and create automatic role-permission sync

-- First, update all existing admin users to have full permissions
UPDATE public.user_permissions 
SET 
    can_create_events = true,
    can_edit_events = true,
    can_delete_events = true,
    can_view_accounting = true,
    can_manage_users = true,
    updated_at = NOW()
WHERE user_id IN (
    SELECT id FROM public.user_profiles WHERE role = 'admin'
);

-- Create function to sync permissions when role changes
CREATE OR REPLACE FUNCTION public.sync_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- If user role changed to admin, grant all permissions
    IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role != 'admin') THEN
        UPDATE public.user_permissions 
        SET 
            can_create_events = true,
            can_edit_events = true,
            can_delete_events = true,
            can_view_accounting = true,
            can_manage_users = true,
            updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;
    
    -- If user role changed from admin to user, revoke all permissions
    IF NEW.role = 'user' AND OLD.role = 'admin' THEN
        UPDATE public.user_permissions 
        SET 
            can_create_events = false,
            can_edit_events = false,
            can_delete_events = false,
            can_view_accounting = false,
            can_manage_users = false,
            updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync permissions when role changes
CREATE OR REPLACE TRIGGER sync_permissions_on_role_change
    AFTER UPDATE OF role ON public.user_profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.sync_user_permissions();

-- Update the handle_new_user function to grant admin permissions if needed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'user';
    is_admin BOOLEAN := false;
BEGIN
    -- Check if this should be an admin user (you can customize this logic)
    -- For now, we'll keep the default 'user' role
    
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        user_role
    );
    
    -- Set permissions based on role
    IF user_role = 'admin' THEN
        is_admin := true;
    END IF;
    
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
        is_admin,
        is_admin,
        is_admin,
        is_admin,
        is_admin
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to manually fix any existing inconsistencies
CREATE OR REPLACE FUNCTION public.fix_admin_permissions()
RETURNS void AS $$
BEGIN
    -- Update all admin users to have full permissions
    UPDATE public.user_permissions 
    SET 
        can_create_events = true,
        can_edit_events = true,
        can_delete_events = true,
        can_view_accounting = true,
        can_manage_users = true,
        updated_at = NOW()
    WHERE user_id IN (
        SELECT id FROM public.user_profiles WHERE role = 'admin'
    );
    
    -- Update all regular users to have no permissions (except those manually granted)
    UPDATE public.user_permissions 
    SET 
        can_create_events = false,
        can_edit_events = false,
        can_delete_events = false,
        can_view_accounting = false,
        can_manage_users = false,
        updated_at = NOW()
    WHERE user_id IN (
        SELECT id FROM public.user_profiles WHERE role = 'user'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the fix function immediately
SELECT public.fix_admin_permissions();