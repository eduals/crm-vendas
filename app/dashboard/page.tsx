import { ChartAreaInteractive } from "../../components/chart-area-interactive"
import { DataTableVisits } from "../../components/data-table-visits"
import { SectionCards } from "../../components/section-cards"
import { Suspense } from "react"
import { getVisits } from "@/lib/utils"
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

export default async function DashboardPage() {
  return (
    <main className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <Suspense fallback={<MetricsSkeleton />}>
        <SectionCards />
      </Suspense>
      
      <div className="px-4 lg:px-6">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartAreaInteractive />
        </Suspense>
      </div>

      <div className="px-4 lg:px-6">
        <Suspense fallback={<TableSkeleton />}>
          <DataTableVisits data={await getVisits()} />
        </Suspense>
      </div>
    </main>
  )
}

