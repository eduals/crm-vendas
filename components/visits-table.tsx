"use client"

import * as React from "react"
import { DataTableVisits } from "@/components/data-table-visits"
import type { Visit } from "@/components/data-table-visits"

export function VisitsTableWrapper() {
  const [visits, setVisits] = React.useState<Visit[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch("/api/visits")
        if (!response.ok) throw new Error("Failed to fetch visits")
        const data = await response.json()
        setVisits(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVisits()
  }, [])

  if (error) {
    return <div>Erro ao carregar visitas: {error.message}</div>
  }

  return <DataTableVisits data={visits} />
} 