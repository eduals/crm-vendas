import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const perPage = Number.parseInt(searchParams.get("perPage") || "50")
    const offset = (page - 1) * perPage

    // Get total count for pagination
    const countResult = await query("SELECT COUNT(*) FROM properties WHERE status != 'Indisponível'")
    const total = Number.parseInt(countResult.rows[0].count)
    
    // Get paginated properties
    const result = await query(
      `SELECT id, code, address, type, area, price, description, status, data 
       FROM properties 
       WHERE status != 'Indisponível'
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [perPage, offset]
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map(row => ({
        ...row.data,
        // Override some fields with our database values
        codigo: row.code,
        descricao: row.description,
        end_logradouro: row.address.split(',')[0].trim(),
        tipo_imovel: row.type,
        area_total: row.area,
        valor_venda: row.price,
        ativo: row.status === 'Disponível'
      })),
      page,
      perPage,
      total,
      lastPage: Math.ceil(total / perPage)
    })
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch properties" },
      { status: 500 }
    )
  }
} 