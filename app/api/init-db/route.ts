import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import fs from "fs"
import path from "path"

// Rota para inicializar o banco de dados
export async function GET(request: NextRequest) {
  try {
    // Lê o arquivo SQL atualizado
    const schemaPath = path.join(process.cwd(), "scripts", "schema_updated.sql")
    const schema = fs.readFileSync(schemaPath, "utf8")

    // Executa o script SQL
    await query(schema)

    return NextResponse.json({
      message: "Database initialized successfully",
      success: true,
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

