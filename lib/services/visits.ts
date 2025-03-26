export interface ChartData {
  date: string
  agendadas: number
  realizadas: number
  canceladas: number
}

interface ChartResponse {
  empty: boolean
  data?: ChartData[]
}

export async function fetchVisitsChartData(days: number): Promise<ChartResponse> {
  const response = await fetch(`/api/chart/visits?days=${days}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch chart data')
  }

  return response.json()
} 