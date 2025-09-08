import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Admin client with service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Invite user endpoint
app.post('/api/invite-user', async (req, res) => {
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

    console.log('Sending invitation to:', email, 'with role:', role);

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

    console.log('Invitation sent successfully to:', email);
    return res.status(200).json({ 
      message: 'Invitation sent successfully',
      user: data.user 
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});