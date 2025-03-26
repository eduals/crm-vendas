import { type NextRequest, NextResponse } from "next/server"
import { getImoveis } from "@/lib/arbo-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const perPage = Number.parseInt(searchParams.get("perPage") || "150")
    const fieldsParam = searchParams.get("fields")
    const searchParam = searchParams.get("search")

    const fields = fieldsParam ? JSON.parse(fieldsParam) : undefined
    const search = searchParam ? JSON.parse(searchParam) : undefined

    const response = await getImoveis({
      page,
      perPage,
      fields,
      search,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching properties from Arbo API:", error)
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 })
  }
}

