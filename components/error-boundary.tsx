'use client'

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"

export function MetricsErrorBoundary({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <EmptyState
      title="Algo deu errado"
      description={error.message || 'Erro ao carregar os dados'}
      action={
        <Button onClick={reset} size="sm">
          Tentar novamente
        </Button>
      }
    />
  )
}
