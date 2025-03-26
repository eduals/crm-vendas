'use client'

import { ErrorBoundary } from "react-error-boundary"

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      <button
        type="button"
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        onClick={resetErrorBoundary}
      >
        Tentar novamente
      </button>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
      >
        {children}
      </ErrorBoundary>
    </div>
  )
}