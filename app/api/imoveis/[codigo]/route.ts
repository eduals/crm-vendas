import { type NextRequest, NextResponse } from "next/server"
import { getImovelByCodigo } from "@/lib/arbo-api"

export async function GET(request: NextRequest, { params }: { params: { codigo: string } }) {
  try {
    const codigo = params.codigo
    const imovel = await getImovelByCodigo(codigo)

    if (!imovel) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json(imovel)
  } catch (error) {
    console.error(`Error fetching property with code ${params.codigo}:`, error)
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 })
  }
}

