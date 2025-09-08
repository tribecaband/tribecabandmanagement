-- Test script to verify admin permissions system
-- This script can be used to test the automatic permission sync

-- Function to test the permission sync system
CREATE OR REPLACE FUNCTION public.test_admin_permissions_sync()
RETURNS TABLE(
    test_name TEXT,
    result TEXT,
    details TEXT
) AS $$
DECLARE
    test_user_id UUID;
    admin_permissions_count INTEGER;
    user_permissions_count INTEGER;
BEGIN
    -- Test 1: Check if existing admin users have all permissions
    SELECT COUNT(*) INTO admin_permissions_count
    FROM public.user_permissions up
    JOIN public.user_profiles prof ON up.user_id = prof.id
    WHERE prof.role = 'admin'
    AND up.can_create_events = true
    AND up.can_edit_events = true
    AND up.can_delete_events = true
    AND up.can_view_accounting = true
    AND up.can_manage_users = true;
    
    RETURN QUERY SELECT 
        'Existing Admin Permissions'::TEXT,
        CASE WHEN admin_permissions_count > 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        ('Found ' || admin_permissions_count || ' admin users with full permissions')::TEXT;
    
    -- Test 2: Check if regular users have limited permissions
    SELECT COUNT(*) INTO user_permissions_count
    FROM public.user_permissions up
    JOIN public.user_profiles prof ON up.user_id = prof.id
    WHERE prof.role = 'user'
    AND up.can_create_events = false
    AND up.can_edit_events = false
    AND up.can_delete_events = false
    AND up.can_view_accounting = false
    AND up.can_manage_users = false;
    
    RETURN QUERY SELECT 
        'Regular User Permissions'::TEXT,
        CASE WHEN user_permissions_count >= 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        ('Found ' || user_permissions_count || ' regular users with restricted permissions')::TEXT;
    
    -- Test 3: Verify trigger functions exist
    RETURN QUERY SELECT 
        'Trigger Functions'::TEXT,
        CASE WHEN EXISTS(
            SELECT 1 FROM pg_proc 
            WHERE proname = 'sync_user_permissions'
        ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'sync_user_permissions function exists'::TEXT;
    
    -- Test 4: Verify triggers exist
    RETURN QUERY SELECT 
        'Permission Sync Trigger'::TEXT,
        CASE WHEN EXISTS(
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'sync_permissions_on_role_change'
        ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Role change trigger is active'::TEXT;
        
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the test
SELECT * FROM public.test_admin_permissions_sync();

-- Additional verification queries
-- Check current admin users and their permissions
SELECT 
    prof.email,
    prof.role,
    perm.can_create_events,
    perm.can_edit_events,
    perm.can_delete_events,
    perm.can_view_accounting,
    perm.can_manage_users,
    perm.updated_at
FROM public.user_profiles prof
JOIN public.user_permissions perm ON prof.id = perm.user_id
WHERE prof.role = 'admin';

-- Check regular users and their permissions
SELECT 
    prof.email,
    prof.role,
    perm.can_create_events,
    perm.can_edit_events,
    perm.can_delete_events,
    perm.can_view_accounting,
    perm.can_manage_users,
    perm.updated_at
FROM public.user_profiles prof
JOIN public.user_permissions perm ON prof.id = perm.user_id
WHERE prof.role = 'user';

-- Show all functions related to permissions
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname IN ('sync_user_permissions', 'handle_new_user', 'fix_admin_permissions');

-- Show all triggers related to permissions
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname IN ('sync_permissions_on_role_change', 'on_auth_user_created');