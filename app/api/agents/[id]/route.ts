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

// GET - Obter um corretor específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("SELECT * FROM agents WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching agent:", error)
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 })
  }
}

// PUT - Atualizar um corretor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { secure_data } = await request.json()
    const body = decryptPayload<AgentData>(secure_data, process.env.ENCRYPTION_KEY || "")
    
    const { name, license_number, phone, email, agency, is_active } = body

    const result = await query(
      "UPDATE agents SET name = $1, license_number = $2, phone = $3, email = $4, agency = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *",
      [name, license_number, phone, email, agency, is_active, id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating agent:", error)
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 })
  }
}

// DELETE - Excluir um corretor
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("DELETE FROM agents WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Agent deleted successfully" })
  } catch (error) {
    console.error("Error deleting agent:", error)
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 })
  }
}

