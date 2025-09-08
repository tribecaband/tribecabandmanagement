import { createClient } from '@supabase/supabase-js';

// Admin client with service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, full_name, role = 'user', permissions } = req.body;

    if (!email || !full_name) {
      return res.status(400).json({ error: 'Email and full_name are required' });
    }

    // Default permissions for user role
    const defaultPermissions = permissions || {
      events: { read: true, write: false, delete: false },
      accounting: { read: false, write: false, delete: false },
      admin: { read: false, write: false, delete: false }
    };

    // Send invitation using admin client
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name,
        role,
        permissions: defaultPermissions
      },
      redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/auth/callback`
    });

    if (error) {
      console.error('Error inviting user:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ 
      message: 'Invitation sent successfully',
      user: data.user 
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}