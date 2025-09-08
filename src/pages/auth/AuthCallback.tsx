import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [error, setError] = useState('');
  const [isInvitation, setIsInvitation] = useState(false);
  const [hasProcessedInvitation, setHasProcessedInvitation] = useState(() => {
    return sessionStorage.getItem('invitationProcessed') === 'true';
  });

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('=== AuthCallback: Starting auth callback handling ===');
      console.log('AuthCallback: Current URL:', window.location.href);
      console.log('AuthCallback: Search params:', window.location.search);
      console.log('AuthCallback: Hash:', window.location.hash);
      console.log('AuthCallback: Pathname:', window.location.pathname);
      console.log('AuthCallback: hasProcessedInvitation:', hasProcessedInvitation);
      
      // Prevent multiple processing of the same invitation
      if (hasProcessedInvitation) {
        console.log('AuthCallback: Already processed invitation, skipping');
        return;
      }
      
      try {
        // Check for errors in URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
          console.error('AuthCallback: Error in URL params:', error, errorDescription);
          setError(errorDescription || 'Error en la autenticación');
          setLoading(false);
          return;
        }

        // Handle Supabase Auth callback with hash parameters (OAuth, magic links, etc.)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('AuthCallback: Processing Supabase auth hash');
          
          // Check if this is an invitation by looking at the hash
          const isInviteInHash = hash.includes('type=invite');
          console.log('AuthCallback: Is invitation in hash?', isInviteInHash);
          
          if (isInviteInHash) {
            console.log('AuthCallback: This is an invitation, processing...');
            
            // Extract the access token from the hash to get user info
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            
            if (accessToken) {
              console.log('AuthCallback: Access token found, getting user info');
              
              // Get user info from the token
              const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
              
              if (userError) {
                console.error('AuthCallback: Error getting user from token:', userError);
                setError('Error al obtener información del usuario');
                setLoading(false);
                return;
              }
              
              if (user) {
                console.log('AuthCallback: User obtained from token:', user.email);
                console.log('AuthCallback: User metadata:', user.user_metadata);
                
                // Extract user info from metadata
                const email = user.email || '';
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
                
                console.log('AuthCallback: Extracted - email:', email, 'fullName:', fullName);
                
                // Set up password form for invitation
                setUserEmail(email);
                setUserFullName(fullName);
                setIsInvitation(true);
                setIsSettingPassword(true);
                setHasProcessedInvitation(true);
                sessionStorage.setItem('invitationProcessed', 'true');
                setLoading(false);
                return;
              }
            } else {
              console.error('AuthCallback: No access token found in hash');
              setError('Token de acceso no encontrado');
              setLoading(false);
              return;
            }
          } else {
            console.log('AuthCallback: Regular auth callback, letting Supabase handle session');
            
            // Let Supabase handle the session from the hash for regular login
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('AuthCallback: Session error:', sessionError);
              setError('Error al establecer la sesión');
              setLoading(false);
              return;
            }

            if (session?.user) {
              console.log('AuthCallback: Regular login successful, redirecting to dashboard');
              toast.success('¡Bienvenido! Sesión iniciada correctamente.');
              navigate('/dashboard');
              return;
            }
          }
        }

        // Handle search parameter invitations (fallback for older format)
        const token = searchParams.get('token');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        console.log('AuthCallback: Search params analysis:');
        console.log('  - token:', !!token, token ? '(present)' : '(missing)');
        console.log('  - token_hash:', !!tokenHash, tokenHash ? '(present)' : '(missing)');
        console.log('  - type:', type);

        if (tokenHash && type === 'invite') {
          console.log('AuthCallback: Processing invitation with search param token_hash');
          setError('Este formato de invitación ya no es compatible. Por favor, solicita una nueva invitación.');
          setLoading(false);
          return;
        }

        // Only check for existing session if it's not an invitation flow
        if (!isInvitation) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('AuthCallback: Error getting session:', sessionError);
          }

          if (session?.user) {
            console.log('AuthCallback: User already authenticated, redirecting to dashboard');
            navigate('/dashboard');
            return;
          }

          // If no valid auth flow detected, redirect to login
          console.log('AuthCallback: No valid authentication flow detected, redirecting to login');
          console.log('AuthCallback: Final state - isInvitation:', isInvitation);
          navigate('/login');
        }
        
      } catch (error) {
        console.error('AuthCallback: Unexpected error:', error);
        setError('Error inesperado durante la autenticación');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, isInvitation, hasProcessedInvitation]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      console.log('Setting password for user:', userEmail);
      
      // First, we need to establish a session using the token from the hash
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('Using tokens from hash to set session');
          
          // Set the session with the tokens
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            throw new Error(`Error estableciendo sesión: ${sessionError.message}`);
          }
          
          if (session) {
            console.log('Session established, now updating password and user metadata');
            
            // Update the password and ensure user metadata is preserved
            const updateData: any = { password: password };
            
            // Preserve user metadata including full_name
            if (userFullName) {
              updateData.data = {
                full_name: userFullName
              };
            }
            
            console.log('Updating user with data:', updateData);
            
            const { error: updateError } = await supabase.auth.updateUser(updateData);

            if (updateError) {
              throw updateError;
            }

            console.log('Password and metadata updated successfully');
            
            // Store user info in sessionStorage for AuthContext to use
            const userInfo = {
              email: userEmail,
              full_name: userFullName,
              updatedAt: Date.now()
            };
            sessionStorage.setItem('userInfoForProfile', JSON.stringify(userInfo));
            console.log('Stored user info in session storage:', userInfo);
            
            toast.success('Contraseña establecida correctamente. Redirigiendo...');
            
            // Clear the hash from URL to clean up
            window.history.replaceState(null, '', window.location.pathname);
            
            // Wait for user profile to be created/updated before redirecting
            console.log('Password updated, waiting for profile update...');
            
            // Clean up session storage
            sessionStorage.removeItem('invitationProcessed');
            
            setTimeout(() => {
              console.log('Redirecting to dashboard...');
              navigate('/dashboard');
            }, 3000); // Give more time for the profile to load
            return;
          }
        }
      }
      
      // Fallback: check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user.email === userEmail) {
        console.log('Using existing session to update password');
        
        // User is authenticated, update their password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });

        if (updateError) {
          throw updateError;
        }

        console.log('Password updated successfully');
        toast.success('Contraseña establecida correctamente. Redirigiendo...');
        
        // Redirect to dashboard after successful password setup
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        
      } else {
        // No session available
        throw new Error('Sesión expirada. Por favor, usa el enlace de invitación nuevamente.');
      }
      
    } catch (error) {
      console.error('Error setting password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al establecer la contraseña';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Autenticación</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && !isSettingPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Procesando invitación...</p>
        </div>
      </div>
    );
  }

  if (isSettingPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Establecer Contraseña
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Bienvenido/a. Por favor, establece tu contraseña para completar el registro.
            </p>
            {userEmail && (
              <div className="mt-4 space-y-2">
                {userFullName && (
                  <div className="flex items-center justify-center text-sm font-medium text-gray-700">
                    <span>Bienvenido/a, {userFullName}</span>
                  </div>
                )}
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Mail className="h-4 w-4 mr-2" />
                  {userEmail}
                </div>
              </div>
            )}
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Nueva Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Ingresa tu nueva contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Estableciendo contraseña...
                  </div>
                ) : (
                  'Establecer Contraseña'
                )}
              </button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              La contraseña debe tener al menos 6 caracteres.
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;