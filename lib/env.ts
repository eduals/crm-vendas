export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // If we're in production and don't have the env var, throw an error
  throw new Error(
    'Please define the NEXT_PUBLIC_APP_URL environment variable'
  )
}

// Validate environment variables
export function validateEnv() {
  const requiredEnvs = ['NEXT_PUBLIC_APP_URL']
  const missingEnvs = requiredEnvs.filter(
    (env) => !process.env[env]
  )

  if (missingEnvs.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missingEnvs.join(', ')}`
    )
  }
}
