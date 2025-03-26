"use client"

import { Suspense } from "react"
import { DataTableVisits } from "@/components/data-table-visits"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState, useCallback } from "react"
import VisitsKanban from "@/components/visits-kanban"
// Loading skeleton for the visits table
function TableSkeleton() {
  return (
    <div className="space-y-4 py-6 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="h-12 border-b px-4">
          <div className="flex h-full items-center gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-row-${i}`} className="h-16 border-b px-4 last:border-0">
            <div className="flex h-full items-center gap-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}

function VisitsContent() {
  const [visits, setVisits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchVisits = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/visits")
      if (!response.ok) throw new Error("Failed to fetch visits")
      const data = await response.json()
      setVisits(data?.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch visits'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>
  if (isLoading) return <TableSkeleton />
  return <DataTableVisits data={visits} onVisitUpdate={fetchVisits} />
}

export default function VisitsPage() {
  const [visits, setVisits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchVisits = useCallback(async () => {
    setIsLoading(true)  
    try {
      const response = await fetch("/api/visits")
      if (!response.ok) throw new Error("Failed to fetch visits")
      const data = await response.json()
      setVisits(data?.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch visits'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>
  if (isLoading) return <TableSkeleton />

  return (
    <>
      {/* <div className="flex flex-1 flex-col py-4 px-4 lg:px-6">*/}
        <div className="w-full"> 
          <Suspense fallback={<TableSkeleton />}>
            <VisitsKanban data={visits} />
          </Suspense>
        </div> 
    {/*  <div className="px-4 lg:px-6">
       <Suspense fallback={<TableSkeleton />}>
         <VisitsContent />
       </Suspense>
     </div> */}
    </>
  )
}

