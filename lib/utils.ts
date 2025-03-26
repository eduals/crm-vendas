import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API response types
export const visitApiSchema = z.object({
  id: z.number(),
  property_id: z.string(),
  property: z.object({
    end_logradouro: z.string(),
  }),
  agent_name: z.string(),
  scheduled_date: z.string(),
  scheduled_time: z.string(),
  status: z.string(),
  client_name: z.string(),
  client_phone: z.string(),
  client_email: z.string(),
  feedback: z.string().optional(),
  created_at: z.string(),
})

export type VisitApiResponse = z.infer<typeof visitApiSchema>

export const agentApiSchema = z.object({
  id: z.number(),
  name: z.string(),
  license_number: z.string(),
  phone: z.string(),
  email: z.string(),
  agency: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type AgentApiResponse = z.infer<typeof agentApiSchema>

export interface DashboardIndicators {
  totalVisits: number
  activeAgents: number
  totalProperties: number
  conversionRate: number
}

export async function getDashboardIndicators(): Promise<DashboardIndicators> {
  // Fetch all data in parallel
  console.log('chamadas', process.env.NEXT_PUBLIC_APP_URL)
  const [visitsRes, agentsRes, propertiesRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/visits`),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents`),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/imoveis`),
  ])

  if (!visitsRes.ok || !agentsRes.ok || !propertiesRes.ok) {
    throw new Error('Failed to fetch dashboard data')
  }

  const [visits, agents, properties] = await Promise.all([
    visitsRes.json(),
    agentsRes.json(),
    propertiesRes.json(),
  ])

  // Calculate indicators
  const totalVisits = visits.length
  const activeAgents = agents.filter((agent: AgentApiResponse) => agent.is_active).length
  const totalProperties = properties.total || 0
  const finishedVisits = visits.filter((visit: VisitApiResponse) => visit.status === 'Finalizada').length
  const conversionRate = totalVisits > 0 ? (finishedVisits / totalVisits) * 100 : 0

  return {
    totalVisits,
    activeAgents,
    totalProperties,
    conversionRate,
  }
}

export async function getVisits() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/visits`, {
    next: { revalidate: 0 },
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch visits')
  }
  
  const data = await res.json()
  
  // Transform the data to match the DataTable schema
  return data?.data.map((visit: VisitApiResponse) => ({
    id: visit.id,
    property_id: visit.property_id,
    property_address: visit.property.end_logradouro,
    agent_name: visit.agent_name,
    scheduled_date: visit.scheduled_date,
    scheduled_time: visit.scheduled_time,
    status: visit.status,
    client_name: visit.client_name,
    client_phone: visit.client_phone,
    client_email: visit.client_email,
    feedback: visit.feedback || '',
    created_at: visit.created_at,
  }))
}

export async function getAgents() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents`, {
    next: { revalidate: 0 },
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch agents')
  }
  
  const data = await res.json()
  
  // The API response already matches our schema
  return data
}

export function formatCurrency(value: number | null): string {
  if (value === null) return "Consulte"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}
