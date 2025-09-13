/**
 * Utility functions for handling different types of errors in the application
 */

export interface DatabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

export type ErrorType = 
  | 'RLS_PERMISSION_DENIED'  // RLS policy blocks access
  | 'AUTH_SESSION_EXPIRED'   // Session/token expired
  | 'AUTH_INVALID'           // Invalid auth credentials
  | 'NETWORK_ERROR'          // Network connectivity issues
  | 'DATABASE_ERROR'         // General database error
  | 'UNKNOWN_ERROR'          // Unexpected error

export interface ErrorInfo {
  type: ErrorType
  message: string
  shouldRetry: boolean
  shouldRefreshAuth: boolean
}

/**
 * Categorizes database/auth errors and provides guidance on how to handle them
 */
export function categorizeError(error: any): ErrorInfo {
  // Handle Supabase PostgreSQL errors
  if (error?.code) {
    switch (error.code) {
      case '42501': // insufficient_privilege (RLS)
        return {
          type: 'RLS_PERMISSION_DENIED',
          message: 'No tienes permisos para realizar esta acción. Verifica tu rol de usuario.',
          shouldRetry: false,
          shouldRefreshAuth: false // RLS is not an auth issue
        }
      
      case 'PGRST301': // JWT token expired
      case 'PGRST302': // JWT token invalid
        return {
          type: 'AUTH_SESSION_EXPIRED',
          message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          shouldRetry: true,
          shouldRefreshAuth: true
        }
    }
  }

  // Handle Supabase auth errors
  if (error?.message) {
    const message = error.message.toLowerCase()
    
    if (message.includes('jwt') && (message.includes('expired') || message.includes('invalid'))) {
      return {
        type: 'AUTH_SESSION_EXPIRED',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        shouldRetry: true,
        shouldRefreshAuth: true
      }
    }
    
    if (message.includes('permission denied') || message.includes('insufficient privilege')) {
      return {
        type: 'RLS_PERMISSION_DENIED',
        message: 'No tienes permisos para realizar esta acción.',
        shouldRetry: false,
        shouldRefreshAuth: false
      }
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.',
        shouldRetry: true,
        shouldRefreshAuth: false
      }
    }
  }

  // Default case
  return {
    type: 'UNKNOWN_ERROR',
    message: 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
    shouldRetry: true,
    shouldRefreshAuth: false
  }
}

/**
 * Creates a user-friendly error message based on the error type
 */
export function getUserFriendlyMessage(errorInfo: ErrorInfo): string {
  return errorInfo.message
}

/**
 * Determines if an operation should be retried based on the error
 */
export function shouldRetryOperation(errorInfo: ErrorInfo): boolean {
  return errorInfo.shouldRetry
}

/**
 * Determines if we should attempt to refresh auth session
 */
export function shouldRefreshSession(errorInfo: ErrorInfo): boolean {
  return errorInfo.shouldRefreshAuth
}