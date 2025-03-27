"use client"

import { ChartAreaInteractive } from "../../components/chart-area-interactive"
// import { DataTableVisits } from "../../components/data-table-visits"
import { SectionCards } from "../../components/section-cards"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Loading skeleton for the metrics cards
function MetricsSkeleton() {
  return (
    <div className="grid gap-4 px-4 lg:grid-cols-4 lg:px-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`metric-skeleton-${i}`} className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-8 w-16" />
          <Skeleton className="mt-3 h-4 w-32" />
        </div>
      ))}
    </div>
  )
}

// Loading skeleton for the chart
function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-[350px] w-full" />
    </div>
  )
}

// Loading skeleton for the table
function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`table-skeleton-${i}`} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [visits, setVisits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)

  // // Primeiro useEffect apenas para marcar que o componente está montado no cliente
  // useEffect(() => {
  //   setMounted(true)
  // }, [])

  // // Segundo useEffect que só executa quando mounted = true
  // useEffect(() => {
  //   if (!mounted) return

  //   const fetchVisits = async () => {
  //     try {
  //       setIsLoading(true)
  //       const response = await fetch('/api/visits', {
  //         headers: {
  //           'x-client-fetch': 'true'
  //         }
  //       })
  //       if (!response.ok) {
  //         throw new Error('Failed to fetch visits')
  //       }
  //       const data = await response.json()
        
  //       const formattedVisits = data?.data?.map((visit) => ({
  //         id: visit.id,
  //         property_id: visit.property_id,
  //         property_address: visit.property?.end_logradouro,
  //         agent_name: visit.agent_name,
  //         scheduled_date: visit.scheduled_date,
  //         scheduled_time: visit.scheduled_time,
  //         status: visit.status,
  //         client_name: visit.client_name,
  //         client_phone: visit.client_phone,
  //         client_email: visit.client_email,
  //         feedback: visit.feedback || '',
  //         created_at: visit.created_at,
  //       })) || []
        
  //       setVisits(formattedVisits)
  //     } catch (err) {
  //       console.error('Error fetching visits:', err)
  //       setError(err)
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }

  //   fetchVisits()
  // }, [mounted])

  return (
    <main className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

      {/* <div className="px-4 lg:px-6">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-4 text-red-500">Error: {error.message}</div>
        ) : (
          <DataTableVisits data={visits} />
        )}
      </div> */}
    </main>
  )
}

