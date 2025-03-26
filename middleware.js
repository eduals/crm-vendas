import { clerkMiddleware } from '@clerk/nextjs/server'

// Essa exportação é obrigatória para o middleware funcionar
export default clerkMiddleware()

// Configuração para quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/',
  ],
} 