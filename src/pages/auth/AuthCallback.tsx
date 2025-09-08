import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
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
  const [hasProcessedInvitation, setHasProcessedInvitation] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('=== AuthCallback: Starting auth callback handling ===');
      console.log('AuthCallback: Current URL:', window.location.href);
      console.log('AuthCallback: Search params:', window.location.search);
      console.log('AuthCallback: Hash:', window.location.hash);
      console.log('AuthCallback: Pathname:', window.location.pathname);
      console.log('AuthCallback: hasProcessedInvitation:', hasProcessedInvitation);
      
      // Prevenir procesamiento múltiple
      if (hasProcessedInvitation && isSettingPassword) {
        console.log('AuthCallback: Ya procesando invitación, omitiendo');
        return;
      }
      
      try {
        // Verificar errores en parámetros URL primero
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
          console.error('AuthCallback: Error en parámetros URL:', error, errorDescription);
          setError(errorDescription || 'Error en la autenticación');
          setLoading(false);
          return;
        }

        // Manejar callback de Supabase con parámetros hash
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('AuthCallback: Procesando hash de autenticación');
          
          // Verificar si es invitación por el hash
          const isInviteInHash = hash.includes('type=invite');
          console.log('AuthCallback: ¿Es invitación en hash?', isInviteInHash);
          
          if (isInviteInHash) {
            console.log('AuthCallback: Procesando invitación...');
            
            // Extraer token de acceso del hash
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            
            if (accessToken) {
              console.log('AuthCallback: Token encontrado, obteniendo info usuario');
              
              // Obtener info del usuario desde el token
              const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
              
              if (userError) {
                console.error('AuthCallback: Error obteniendo usuario:', userError);
                setError('Error al obtener información del usuario');
                setLoading(false);
                return;
              }
              
              if (user) {
                console.log('AuthCallback: Usuario obtenido:', user.email);
                
                // Extraer información del usuario
                const email = user.email || '';
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
                
                console.log('AuthCallback: Extraído - email:', email, 'fullName:', fullName);
                
                // Configurar formulario de contraseña
                setUserEmail(email);
                setUserFullName(fullName);
                setIsInvitation(true);
                setHasProcessedInvitation(true);
                setLoading(false);
                
                // Mostrar formulario después de configurar estado
                setTimeout(() => {
                  console.log('AuthCallback: Mostrando formulario de contraseña');
                  setIsSettingPassword(true);
                }, 100);
                return;
              }
            } else {
              console.error('AuthCallback: Token de acceso no encontrado');
              setError('Token de acceso no encontrado');
              setLoading(false);
              return;
            }
          } else {
            console.log('AuthCallback: Callback regular, manejando sesión');
            
            // Manejar sesión para login regular
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('AuthCallback: Error de sesión:', sessionError);
              setError('Error al establecer la sesión');
              setLoading(false);
              return;
            }

            if (session?.user) {
              console.log('AuthCallback: Login exitoso, redirigiendo');
              toast.success('¡Bienvenido! Sesión iniciada correctamente.');
              navigate('/dashboard');
              return;
            }
          }
        }

        // Manejar invitaciones por parámetros de búsqueda (formato anterior)
        const token = searchParams.get('token');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        console.log('AuthCallback: Análisis parámetros búsqueda:');
        console.log('  - token:', !!token, token ? '(presente)' : '(ausente)');
        console.log('  - token_hash:', !!tokenHash, tokenHash ? '(presente)' : '(ausente)');
        console.log('  - type:', type);

        if (tokenHash && type === 'invite') {
          console.log('AuthCallback: Procesando invitación con token_hash');
          setError('Este formato de invitación ya no es compatible. Por favor, solicita una nueva invitación.');
          setLoading(false);
          return;
        }

        // Solo verificar sesión existente si no es flujo de invitación
        if (!isInvitation) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('AuthCallback: Error obteniendo sesión:', sessionError);
          }

          if (session?.user) {
            console.log('AuthCallback: Usuario ya autenticado, redirigiendo');
            navigate('/dashboard');
            return;
          }

          // Sin flujo válido detectado, redirigir a login
          console.log('AuthCallback: Sin flujo válido, redirigiendo a login');
          console.log('AuthCallback: Estado final - isInvitation:', isInvitation);
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
    setStatus('Estableciendo contraseña...');

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
            
            // Clear the hash from URL to clean up
            window.history.replaceState(null, '', window.location.pathname);
            
            // Trigger profile loading now that password is set
            console.log('Password updated, triggering profile refresh...');
            await refreshProfile();
            
            // Clean up session storage
            sessionStorage.removeItem('userInfoForProfile');
            
            console.log('Profile refreshed, redirecting to dashboard...');
            toast.success('¡Bienvenido! Configuración completada.');
            navigate('/dashboard');
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
        setStatus('¡Contraseña establecida! Redirigiendo al panel...');
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
      setStatus('');
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

          {status && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0 animate-pulse"></div>
              {status}
            </div>
          )}

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
                disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
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