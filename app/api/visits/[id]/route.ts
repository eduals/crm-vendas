import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getImovelByCodigo } from "@/lib/arbo-api"
import { decryptPayload, type VisitData } from "@/lib/crypto"

// GET - Obter uma visita específica
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const result = await query(
      `
      SELECT 
        v.id, 
        v.property_codigo, 
        v.client_name, 
        v.client_phone, 
        v.client_email, 
        v.scheduled_date, 
        v.scheduled_time, 
        v.status, 
        v.feedback, 
        v.created_at,
        a.id as agent_id, 
        a.name as agent_name
      FROM visits v
      JOIN agents a ON v.agent_id = a.id
      WHERE v.id = $1
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 })
    }

    const visit = result.rows[0]

    // Buscar informações do imóvel na API Arbo
    try {
      const imovel = await getImovelByCodigo(visit.property_codigo)
      return NextResponse.json({
        ...visit,
        property: imovel || {
          codigo: visit.property_codigo,
          descricao: "Imóvel não encontrado na API",
          end_logradouro: "Endereço não disponível",
        },
      })
    } catch (error) {
      console.error(`Erro ao buscar imóvel ${visit.property_codigo}:`, error)
      return NextResponse.json({
        ...visit,
        property: {
          codigo: visit.property_codigo,
          descricao: "Erro ao buscar imóvel",
          end_logradouro: "Endereço não disponível",
        },
      })
    }
  } catch (error) {
    console.error("Error fetching visit:", error)
    return NextResponse.json({ error: "Failed to fetch visit" }, { status: 500 })
  }
}

// PUT - Atualizar uma visita
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extrair o ID dos parâmetros logo no início - respeitando a API do Next.js
    const { id } = await params;
    
    // Verificar se a requisição tem um corpo
    if (!request.body) {
      return NextResponse.json({ error: "Body da requisição vazio" }, { status: 400 });
    }
    
    // Extrair o secure_data do corpo da requisição
    const body = await request.json();
    
    if (!body || !body.secure_data) {
      return NextResponse.json({ error: "Campo secure_data não fornecido" }, { status: 400 });
    }

    console.log(`[API:visits/${id}] Recebido secure_data com ${body.secure_data.length} bytes`);

    // Descriptografar o conteúdo
    let decryptedData: VisitData;
    try {
      const startTime = Date.now();
      
      // Verificar a chave antes de descriptografar
      const encryptionKey = process.env.ENCRYPTION_KEY || "";
      if (!encryptionKey || encryptionKey.length < 16) {
        console.error(`[API:visits/${id}] Chave de criptografia inválida:`, 
          encryptionKey ? `${encryptionKey.substring(0, 5)}...` : "vazia");
        return NextResponse.json({ 
          error: "Configuração de criptografia inválida",
          details: "A chave de descriptografia não está configurada corretamente."
        }, { status: 500 });
      }
      
      console.log(`[API:visits/${id}] Tentando descriptografar com chave: ${encryptionKey.substring(0, 5)}...`);
      decryptedData = await decryptPayload<VisitData>(body.secure_data, encryptionKey);
      console.log(`[API:visits/${id}] Descriptografia bem-sucedida em ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error(`[API:visits/${id}] Erro ao descriptografar dados:`, error);
      return NextResponse.json({ 
        error: "Falha ao descriptografar os dados", 
        details: error instanceof Error ? error.message : "Erro desconhecido" 
      }, { status: 400 });
    }
    
    // Extrair os dados da visita
    const {
      client_name,
      client_phone,
      client_email,
      scheduled_date,
      scheduled_time,
      status,
      feedback,
    } = decryptedData;

    // Validar dados obrigatórios
    if (!client_name || !client_phone || !scheduled_date || !scheduled_time || !status) {
      return NextResponse.json({ 
        error: "Dados obrigatórios não fornecidos",
        missingFields: [
          !client_name ? 'client_name' : null,
          !client_phone ? 'client_phone' : null,
          !scheduled_date ? 'scheduled_date' : null,
          !scheduled_time ? 'scheduled_time' : null,
          !status ? 'status' : null
        ].filter(Boolean)
      }, { status: 400 });
    }

    console.log(`[API:visits/${id}] Atualizando visita: ${client_name}, status: ${status}`);

    // Executar a atualização no banco de dados
    const result = await query(
      `UPDATE visits SET 
        client_name = $1, 
        client_phone = $2, 
        client_email = $3, 
        scheduled_date = $4, 
        scheduled_time = $5, 
        status = $6, 
        feedback = $7,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 
       RETURNING *`,
      [
        client_name,
        client_phone,
        client_email,
        scheduled_date,
        scheduled_time,
        status,
        feedback,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Visita não encontrada" }, { status: 404 });
    }

    console.log(`[API:visits/${id}] Visita atualizada com sucesso`);
    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar visita:", error);
    return NextResponse.json({ 
      error: "Falha ao atualizar visita", 
      details: error instanceof Error ? error.message : "Erro desconhecido" 
    }, { status: 500 });
  }
}

// DELETE - Excluir uma visita
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const result = await query("DELETE FROM visits WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Visit deleted successfully" })
  } catch (error) {
    console.error("Error deleting visit:", error)
    return NextResponse.json({ error: "Failed to delete visit" }, { status: 500 })
  }
}

