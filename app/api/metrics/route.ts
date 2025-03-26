import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getImoveis } from "@/lib/arbo-api"

export async function GET() {
  try {
    // console.log('Metrics API route called')
    
    // Get current date and calculate start of current/previous weeks
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const currentWeekStart = new Date(now.setDate(diff))
    currentWeekStart.setHours(0, 0, 0, 0)
    
    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)
    
    // Get total visits and visits with proposals
    const visitsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Proposta') as with_proposals,
        COUNT(*) FILTER (WHERE scheduled_date >= $1) as current_week,
        COUNT(*) FILTER (WHERE scheduled_date >= $2 AND scheduled_date < $1) as previous_week
      FROM visits
    `, [currentWeekStart, previousWeekStart])

    // Get total active brokers and weekly changes
    const brokersResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as total,
        COUNT(*) FILTER (WHERE is_active = true AND created_at >= $1) as current_week,
        COUNT(*) FILTER (WHERE is_active = true AND created_at >= $2 AND created_at < $1) as previous_week
      FROM agents
    `, [currentWeekStart, previousWeekStart])

    // Get properties metrics from Arbo API
    let totalProperties = { total: 0, perPage: 0, lastPage: 0 }
    let publishedProperties = { total: 0, perPage: 0, lastPage: 0 }

    try {
      // Get total active properties
      totalProperties = await getImoveis({ 
        perPage: 150,
        search: { ativo: true }
      })

      // Get published properties
      publishedProperties = await getImoveis({ 
        perPage: 150,
        search: { ativo: true, publicado: true }
      })
    } catch (error) {
      console.error('Error fetching properties from Arbo API:', error)
      // Continue with default values (0)
    }

    // Calculate publication rate
    const publicationRate = totalProperties.total > 0 
      ? (publishedProperties.total / totalProperties.total) * 100 
      : 0
    console.log('visitsResult', visitsResult.rows[0])
    console.log('brokersResult', brokersResult.rows[0])
    const metrics = {
      visits: {
        total: Number(visitsResult.rows[0].total),
        withProposals: Number(visitsResult.rows[0].with_proposals),
        monthlyChange: calculateChange(
          Number(visitsResult.rows[0].current_week),
          Number(visitsResult.rows[0].previous_week)
        )
      },
      brokers: {
        total: Number(brokersResult.rows[0].total),
        monthlyChange: calculateChange(
          Number(brokersResult.rows[0].current_week),
          Number(brokersResult.rows[0].previous_week)
        )
      },
      properties: {
        total: totalProperties.total,
        published: publishedProperties.total,
        publicationRate: Number(publicationRate.toFixed(1))
      }
    }

    console.log('Returning real metrics:', metrics)
    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Error in metrics API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

function calculateChange(current: number, previous: number): number {
  if (!previous) return 0
  return Number(((current - previous) / previous * 100).toFixed(1))
}
