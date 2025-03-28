"use client"

import React, { useState, useEffect } from 'react'
import { TrendingDownIcon, TrendingUpIcon, EyeIcon, AlertOctagonIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function SectionCards() {
  const [metrics, setMetrics] = useState({
    visits: { total: 0, withProposals: 0, monthlyChange: 0 },
    brokers: { total: 0, monthlyChange: 0 },
    properties: { total: 0, published: 0, publicationRate: 0 }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)

  // Primeiro useEffect apenas para marcar que o componente está montado no cliente
  useEffect(() => {
    console.log('SectionCards mounted')
    setMounted(true)
  }, [])

  // Segundo useEffect que só executa quando mounted = true
  useEffect(() => {
    if (!mounted) return
    
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/metrics', {
          headers: {
            'x-client-fetch': 'true'
          },
          // Aumentando o timeout para 15 segundos
          signal: AbortSignal.timeout(15000)
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch metrics')
        }
        
        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [mounted])

  if (isLoading) {
    return <CardSkeletonGroup />
  }

  if (error) {
    return (
      <div className="p-4">
        <EmptyState
          title="Erro ao carregar métricas"
          description="Não foi possível carregar os dados do dashboard"
          action={
            <Button onClick={() => window.location.reload()} size="sm">
              Tentar novamente
            </Button>
          }
        />
      </div>
    )
  }

  const conversionRate = metrics.visits.total 
    ? ((metrics.visits.withProposals / metrics.visits.total) * 100).toFixed(1)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 px-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      {!metrics.visits.total ? (
        <EmptyState
          title="Nenhuma visita registrada"
          description="Comece agendando sua primeira visita"
          action={
            <Button asChild size="sm">
              <Link href="/visits">Agendar Visita</Link>
            </Button>
          }
        />
      ) : (
        <MetricCard
          title="Total de Visitas"
          value={metrics.visits.total}
          change={metrics.visits.monthlyChange}
        />
      )}
      
      {!metrics.brokers.total ? (
        <EmptyState
          title="Nenhum corretor ativo"
          description="Adicione seu primeiro corretor"
          action={
            <Button asChild size="sm">
              <Link href="/brokers">Adicionar Corretor</Link>
            </Button>
          }
        />
      ) : (
        <MetricCard
          title="Corretores Ativos"
          value={metrics.brokers.total}
          change={metrics.brokers.monthlyChange}
        />
      )}
      
      {!metrics.properties.total ? (
        <EmptyState
          title="Nenhum imóvel cadastrado"
          description="Adicione seu primeiro imóvel"
          action={
            <Button asChild size="sm">
              <Link href="/properties">Cadastrar Imóvel</Link>
            </Button>
          }
        />
      ) : (
        <PropertyMetricCard
          title="Imóveis no Portfólio"
          total={metrics.properties.total}
          published={metrics.properties.published}
          publicationRate={metrics.properties.publicationRate}
        />
      )}
      
      <MetricCard
        title="Taxa de Conversão"
        value={`${conversionRate}%`}
        change={0} // Calculate if needed
      />
    </div>
  )
}

function CardSkeletonGroup() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 px-4 lg:px-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded mt-2" />
      </CardHeader>
    </Card>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  change: number
}

function MetricCard({ title, value, change }: MetricCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{value}</CardTitle>
        <div className="absolute right-4 top-4">
          <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
            {change > 0 ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
            {change > 0 ? `+${change}%` : `-${Math.abs(change)}%`}
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        {change === 0 ? (
          <div className="text-muted-foreground flex gap-2">
            Sem alteração
            <AlertOctagonIcon className="size-4 text-yellow-500" />
          </div>
        ) : (
          <div className="line-clamp-1 flex gap-2 font-medium">
            {change > 0 ? (
              <>
                Aumento de {change}%
                <TrendingUpIcon className="size-4 text-green-500" />
              </>
            ) : (
              <>
                Redução de {Math.abs(change)}%
                <TrendingDownIcon className="size-4 text-red-500" />
              </>
            )}
          </div>
        )}
        <div className="text-muted-foreground">Comparado com a semana passada</div>
      </CardFooter>
    </Card>
  )
}

interface PropertyMetricCardProps {
  title: string
  total: number
  published: number
  publicationRate: number
}

function PropertyMetricCard({ title, total, published, publicationRate }: PropertyMetricCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{total}</CardTitle>
        <div className="absolute right-4 top-4">
          <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
            <EyeIcon className="size-3" />
            {publicationRate}%
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {published} imóveis publicados
        </div>
        <div className="text-muted-foreground">
          {total - published} imóveis não publicados
        </div>
      </CardFooter>
    </Card>
  )
}

