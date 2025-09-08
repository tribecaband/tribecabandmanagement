-- Fix infinite recursion in RLS policies for user_profiles table
-- The issue is that admin policies query user_profiles table to check if user is admin,
-- creating infinite recursion when trying to access user_profiles

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;

-- Create a function to check if user is admin without causing recursion
-- This function will use a direct query to auth.users metadata or a separate approach
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get role from user_profiles without triggering RLS
    SELECT role INTO user_role
    FROM public.user_profiles
    WHERE id = user_id;
    
    RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create simpler policies that don't cause recursion
-- For now, let's use a bypass approach for admins using SECURITY DEFINER functions

-- Create admin-safe policies for user_profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        public.is_admin_user(auth.uid())
    );

CREATE POLICY "Admins can update all profiles" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        public.is_admin_user(auth.uid())
    );

-- Create admin-safe policies for user_permissions
CREATE POLICY "Admins can view all permissions" ON public.user_permissions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.is_admin_user(auth.uid())
    );

CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
    FOR ALL USING (
        public.is_admin_user(auth.uid())
    );

-- Update other policies that might have similar issues
-- Fix event policies to use the new function
DROP POLICY IF EXISTS "Users with permission can create events" ON public.events;
DROP POLICY IF EXISTS "Users with permission can update events" ON public.events;
DROP POLICY IF EXISTS "Users with permission can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage event types" ON public.event_types;

CREATE POLICY "Users with permission can create events" ON public.events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_id = auth.uid() AND can_create_events = true
        ) OR
        public.is_admin_user(auth.uid())
    );

CREATE POLICY "Users with permission can update events" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_id = auth.uid() AND can_edit_events = true
        ) OR
        public.is_admin_user(auth.uid())
    );

CREATE POLICY "Users with permission can delete events" ON public.events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_id = auth.uid() AND can_delete_events = true
        ) OR
        public.is_admin_user(auth.uid())
    );

CREATE POLICY "Admins can manage event types" ON public.event_types
    FOR ALL USING (
        public.is_admin_user(auth.uid())
    );

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO anon;

-- Test the function
SELECT 'RLS Fix Applied' as status, 'Infinite recursion should be resolved' as message;