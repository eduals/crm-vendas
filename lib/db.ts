import pg from "pg"
const { Pool } = pg

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Função para executar consultas SQL
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    // console.log("Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Error executing query", { text, error })
    throw error
  }
}

// Função para testar a conexão com o banco de dados
export async function testConnection() {
  try {
    const res = await query("SELECT NOW()")
    // console.log("Database connection successful", res.rows[0])
    return true
  } catch (error) {
    console.error("Database connection failed", error)
    return false
  }
}

