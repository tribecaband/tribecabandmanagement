-- Grant permissions to anon role for public access
GRANT SELECT ON public.event_types TO anon;
GRANT SELECT ON public.events TO anon;

-- Grant permissions to authenticated role for full access
GRANT ALL PRIVILEGES ON public.user_profiles TO authenticated;
GRANT ALL PRIVILEGES ON public.events TO authenticated;
GRANT ALL PRIVILEGES ON public.event_types TO authenticated;
GRANT ALL PRIVILEGES ON public.user_permissions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;