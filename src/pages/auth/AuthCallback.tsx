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
  const [error, setError] = useState('');
  const [isInvitation, setIsInvitation] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Starting auth callback handling');
      console.log('AuthCallback: Current URL:', window.location.href);
      console.log('AuthCallback: Search params:', window.location.search);
      console.log('AuthCallback: Hash:', window.location.hash);
      
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
          
          // Let Supabase handle the session from the hash
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('AuthCallback: Session error:', sessionError);
            setError('Error al establecer la sesión');
            setLoading(false);
            return;
          }

          if (session?.user) {
            console.log('AuthCallback: Session established successfully, redirecting to dashboard');
            toast.success('¡Bienvenido! Sesión iniciada correctamente.');
            navigate('/dashboard');
            return;
          }
        }

        // Handle invitation tokens from search parameters
        const token = searchParams.get('token');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        console.log('AuthCallback: URL params - token:', !!token, 'token_hash:', !!tokenHash, 'type:', type);

        if (tokenHash && type === 'invite') {
          console.log('AuthCallback: Processing invitation with token_hash');
          
          try {
            // Manejar manualmente la sesión desde la URL para invitaciones
            const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
            
            if (error) {
              console.error('AuthCallback: Error exchanging code for session:', error);
              // Si no es un código válido, intentar obtener la sesión actual
              const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
              
              if (sessionError || !sessionData.session) {
                setError('Error al procesar la autenticación');
                setLoading(false);
                return;
              }
              
              // Si hay una sesión válida y no es una invitación, redirigir
              if (sessionData.session && !isInvitation) {
                console.log('AuthCallback: Session established successfully, redirecting to dashboard');
                toast.success('¡Bienvenido! Sesión iniciada correctamente.');
                navigate('/dashboard');
                return;
              }
            } else if (data.session) {
              // Nueva sesión creada desde el código de invitación
              console.log('AuthCallback: New session created from invitation code');
            }

            // For invitations, we need to verify the token but NOT automatically sign in
            // Instead, we'll show the password setup form
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'invite'
            });

            if (verifyError) {
              console.error('AuthCallback: Error verifying invitation:', verifyError);
              setError('El enlace de invitación no es válido o ha expirado');
              setLoading(false);
              return;
            }

            if (verifyData.user) {
              console.log('AuthCallback: Invitation verified, showing password setup');
              setUserEmail(verifyData.user.email || '');
              setIsInvitation(true);
              setIsSettingPassword(true);
              setLoading(false);
              return;
            }
          } catch (verifyError: any) {
            console.error('AuthCallback: Exception during invitation verification:', verifyError);
            setError('Error al procesar la invitación');
            setLoading(false);
            return;
          }
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
          navigate('/login');
        }
        
      } catch (error: any) {
        console.error('AuthCallback: Unexpected error:', error);
        setError('Error inesperado durante la autenticación');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

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
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Contraseña establecida correctamente. Redirigiendo...');
      
      // Redirect to dashboard after successful password setup
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error('Error al establecer la contraseña');
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
              <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                {userEmail}
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