import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { decryptPayload } from "@/lib/crypto"

// Interface para dados do corretor
interface AgentData {
  name: string;
  license_number: string;
  phone: string;
  email: string;
  agency: string;
  is_active: boolean;
}

const agents = [
  {
    id: 1,
    name: "Carlos Silva",
  },
  {
    id: 2,
    name: "Ana Beatriz",
  },
  {
    id: 3,
    name: "Roberto Almeida",
  },
  // Add more mock data as needed
]

// GET - Listar todos os corretores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let sql = "SELECT * FROM agents"
    const params: string[] = []

    if (status === "ativos") {
      sql += " WHERE is_active = true"
    } else if (status === "inativos") {
      sql += " WHERE is_active = false"
    }

    sql += " ORDER BY name ASC"

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching agents:", error)
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
  }
}

// POST - Criar um novo corretor
export async function POST(request: NextRequest) {
  try {
    const { secure_data } = await request.json()
    const body = decryptPayload<AgentData>(secure_data, process.env.ENCRYPTION_KEY || "")
    
    const { name, license_number, phone, email, agency, is_active } = body

    const result = await query(
      "INSERT INTO agents (name, license_number, phone, email, agency, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, license_number, phone, email, agency, is_active !== undefined ? is_active : true],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating agent:", error)
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 })
  }
}

export async function GETMock() {
  return NextResponse.json(agents)
}

