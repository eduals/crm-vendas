import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { decryptPayload, type VisitData } from "@/lib/crypto"

// Definir tipos para os parâmetros de consulta
interface QueryParams {
  status?: string;
}

// Definir tipo para o resultado da query
interface VisitRow {
  id: number;
  property_id: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  scheduled_date: string;
  scheduled_time: string;
  visit_status: string;
  feedback?: string;
  created_at: string;
  agent_id: number;
  agent_name: string;
  property_code: string;
  property_address: string;
  property_type: string;
  property_area: number;
  property_price: number;
  property_description: string;
  property_status: string;
  property_data: Record<string, unknown>; // Objeto JSON armazenado no banco
}

// GET - Listar todas as visitas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let sql = `
      SELECT 
        v.id, 
        v.property_id,
        v.client_name, 
        v.client_phone, 
        v.client_email, 
        v.scheduled_date, 
        v.scheduled_time, 
        v.status as visit_status, 
        v.feedback, 
        v.created_at,
        a.id as agent_id, 
        a.name as agent_name,
        p.code as property_code,
        p.address as property_address,
        p.type as property_type,
        p.area as property_area,
        p.price as property_price,
        p.description as property_description,
        p.status as property_status,
        p.data as property_data
      FROM visits v
      JOIN agents a ON v.agent_id = a.id
      JOIN properties p ON v.property_id = p.id
    `

    const params: string[] = []

    if (status && status !== "todas") {
      sql += " WHERE v.status = $1"
      params.push(status)
    }

    sql += " ORDER BY v.scheduled_date DESC, v.scheduled_time ASC"

    const result = await query(sql, params)

    // Transform the results to match expected format
    const visits = result.rows.map((row: VisitRow) => ({
      id: row.id,
      property_id: row.property_id,
      client_name: row.client_name,
      client_phone: row.client_phone,
      client_email: row.client_email,
      scheduled_date: row.scheduled_date,
      scheduled_time: row.scheduled_time,
      status: row.visit_status,
      feedback: row.feedback,
      created_at: row.created_at,
      agent_id: row.agent_id,
      agent_name: row.agent_name,
      property: {
        ...row.property_data,
        codigo: row.property_code,
        descricao: row.property_description,
        end_logradouro: row.property_address.split(',')[0].trim(),
        tipo_imovel: row.property_type,
        area_total: row.property_area,
        valor_venda: row.property_price,
        ativo: row.property_status === 'Disponível'
      }
    }))

    return NextResponse.json({ success: true, data: visits })
  } catch (error) {
    console.error("Error fetching visits:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch visits" },
      { status: 500 }
    )
  }
}

// POST - Criar uma nova visita
export async function POST(request: NextRequest) {
  try {
    // Verificar se a requisição tem um corpo
    if (!request.body) {
      return NextResponse.json({ error: "Body da requisição vazio" }, { status: 400 });
    }
    
    // Extrair o secure_data do corpo da requisição
    const body = await request.json();
    
    if (!body || !body.secure_data) {
      return NextResponse.json({ error: "Campo secure_data não fornecido" }, { status: 400 });
    }

    // Descriptografar o conteúdo
    let data: VisitData;
    try {
      data = decryptPayload<VisitData>(body.secure_data, process.env.ENCRYPTION_KEY || "");
    } catch (error) {
      console.error("Erro ao descriptografar dados:", error);
      return NextResponse.json({ 
        error: "Falha ao descriptografar os dados", 
        details: error instanceof Error ? error.message : "Erro desconhecido" 
      }, { status: 400 });
    }
    
    // Validar dados obrigatórios
    if (!data.property_id || !data.agent_id || !data.client_name || !data.client_phone || 
        !data.scheduled_date || !data.scheduled_time) {
      return NextResponse.json({ 
        error: "Dados obrigatórios não fornecidos",
        required: ["property_id", "agent_id", "client_name", "client_phone", "scheduled_date", "scheduled_time"]
      }, { status: 400 });
    }
    
    // Get property_id from code
    const property = await query(
      "SELECT id FROM properties WHERE code = $1 AND status != 'Indisponível'",
      [data.property_id]
    )
    
    if (property.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Imóvel não encontrado ou indisponível" },
        { status: 404 }
      )
    }

    const result = await query(
      `INSERT INTO visits 
        (property_id, agent_id, client_name, client_phone, client_email, scheduled_date, scheduled_time, status, feedback) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        property.rows[0].id,
        data.agent_id,
        data.client_name,
        data.client_phone,
        data.client_email || '',
        data.scheduled_date,
        data.scheduled_time,
        data.status || "Agendada",
        data.feedback || "",
      ]
    )

    // Get the complete visit data with property and agent info
    const visit = await query(
      `SELECT 
        v.*,
        a.name as agent_name,
        p.code as property_code,
        p.address as property_address,
        p.type as property_type,
        p.area as property_area,
        p.price as property_price,
        p.description as property_description,
        p.status as property_status,
        p.data as property_data
       FROM visits v
       JOIN agents a ON v.agent_id = a.id
       JOIN properties p ON v.property_id = p.id
       WHERE v.id = $1`,
      [result.rows[0].id]
    )

    const visitData = visit.rows[0]
    
    return NextResponse.json({
      success: true,
      data: {
        ...visitData,
        property: {
          ...visitData.property_data,
          codigo: visitData.property_code,
          descricao: visitData.property_description,
          end_logradouro: visitData.property_address.split(',')[0].trim(),
          tipo_imovel: visitData.property_type,
          area_total: visitData.property_area,
          valor_venda: visitData.property_price,
          ativo: visitData.property_status === 'Disponível'
        }
      }
    })
  } catch (error) {
    console.error("Error creating visit:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create visit",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

