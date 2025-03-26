import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number(searchParams.get("days")) || 30

    // First check if we have any visits
    const totalResult = await query(`
      SELECT COUNT(*) as total FROM visits
    `)

    const hasVisits = Number(totalResult.rows[0].total) > 0

    if (!hasVisits) {
      return NextResponse.json({ empty: true })
    }

    const result = await query(`
      WITH dates AS (
        SELECT generate_series(
          date_trunc('day', NOW()) - interval '${days} days',
          date_trunc('day', NOW()),
          interval '1 day'
        )::date as date
      )
      SELECT 
        dates.date::text as date,
        COUNT(*) FILTER (WHERE v.status = 'Agendada') as agendadas,
        COUNT(*) FILTER (WHERE v.status = 'Realizada') as realizadas,
        COUNT(*) FILTER (WHERE v.status = 'Cancelada') as canceladas
      FROM dates 
      LEFT JOIN visits v ON v.scheduled_date = dates.date
      GROUP BY dates.date
      ORDER BY dates.date ASC
    `)

    return NextResponse.json({ empty: false, data: result.rows })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    )
  }
} 