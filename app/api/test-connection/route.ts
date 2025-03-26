import { type NextRequest, NextResponse } from "next/server"
import { testConnection } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const isConnected = await testConnection()

    return NextResponse.json({
      success: isConnected,
      message: isConnected ? "Database connection successful" : "Database connection failed",
    })
  } catch (error) {
    console.error("Error testing database connection:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test database connection",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

