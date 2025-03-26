"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { fetchVisitsChartData } from "@/lib/services/visits"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const chartConfig = {
  visitas: {
    label: "Visitas",
  },
  agendadas: {
    label: "Agendadas",
    color: "hsl(var(--chart-1))",
  },
  realizadas: {
    label: "Realizadas",
    color: "hsl(var(--chart-2))",
  },
  canceladas: {
    label: "Canceladas",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-[250px] w-full" />
    </div>
  )
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isEmpty, setIsEmpty] = React.useState(false)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const days = timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7
        const response = await fetchVisitsChartData(days)
        if (response.empty) {
          setIsEmpty(true)
          setData([])
        } else {
          setIsEmpty(false)
          setData(response.data)
        }
      } catch (error) {
        console.error("Error loading chart data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [timeRange])

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Visitas por Período</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Visitas agendadas, realizadas e canceladas</span>
          <span className="@[540px]/card:hidden">Análise de visitas</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Últimos 3 meses
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Últimos 30 dias
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Últimos 7 dias
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="@[767px]/card:hidden flex w-40" aria-label="Selecione um período">
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <ChartSkeleton />
        ) : isEmpty ? (
          <EmptyState
            title="Nenhuma visita registrada"
            description="Comece agendando sua primeira visita"
            action={
              <Button asChild size="sm">
                <Link href="/visits/schedule">Agendar Visita</Link>
              </Button>
            }
          />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillAgendadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-agendadas)" stopOpacity={1.0} />
                  <stop offset="95%" stopColor="var(--color-agendadas)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillRealizadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-realizadas)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-realizadas)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillCanceladas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-canceladas)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-canceladas)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("pt-BR", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("pt-BR", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="canceladas"
                type="natural"
                fill="url(#fillCanceladas)"
                stroke="var(--color-canceladas)"
                stackId="a"
              />
              <Area
                dataKey="realizadas"
                type="natural"
                fill="url(#fillRealizadas)"
                stroke="var(--color-realizadas)"
                stackId="a"
              />
              <Area
                dataKey="agendadas"
                type="natural"
                fill="url(#fillAgendadas)"
                stroke="var(--color-agendadas)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

