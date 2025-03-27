"use server"

import { query } from "./db"
import { revalidatePath } from "next/cache"
import { getImoveis, getImovelByCodigo, getLocalImoveis } from "./arbo-api"
import type { Visit } from "@/types/visit";
// Ações para Imóveis da API Arbo
export async function getArboImoveis(options: {
  page?: number
  perPage?: number
  fields?: string[]
  search?: Record<string, string>
  skipRefresh?: boolean
  forceRefresh?: boolean
}) {
  try {
    // NUNCA faça refresh durante o build ou renderização do servidor
    // Apenas permitimos refresh explícito via botão (forceRefresh=true)
    if (options.forceRefresh === true) {
      try {
        const serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        console.log(`Trying to refresh from: ${serverUrl}/api/imoveis/refresh`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const refreshResponse = await fetch(`${serverUrl}/api/imoveis/refresh`, {
          method: 'POST',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!refreshResponse.ok) {
          console.warn("Failed to refresh properties, continuing with existing data");
        }
      } catch (refreshError) {
        // Captura qualquer erro do fetch e apenas loga
        console.warn("Error during refresh, continuing with existing data:", refreshError);
      }
    }
    
    // Sempre carrega do banco de dados local
    try {
      const response = await getLocalImoveis({
        page: options.page,
        perPage: options.perPage
      });
      
      return { success: true, ...response };
    } catch (dbError) {
      console.error("Error fetching from local database:", dbError);
      // Em caso de erro no banco, retorna array vazio
      return { 
        success: true, 
        data: [], 
        page: options.page || 1,
        perPage: options.perPage || 50,
        lastPage: 1,
        total: 0
      };
    }
  } catch (error) {
    console.error("Error in getArboImoveis:", error);
    return { success: false, error: "Failed to fetch properties" };
  }
}

export async function getArboImovelByCodigo(codigo: string) {
  try {
    const imovel = await getImovelByCodigo(codigo)
    if (!imovel) {
      return { success: false, error: "Property not found" }
    }
    return { success: true, data: imovel }
  } catch (error) {
    console.error(`Error fetching property with code ${codigo}:`, error)
    return { success: false, error: "Failed to fetch property" }
  }
}

// Ações para Agentes
export async function getAgents(status?: string) {
  try {
    let sql = "SELECT * FROM agents"
    const params: string[] = []

    if (status === "ativos") {
      sql += " WHERE is_active = true"
    } else if (status === "inativos") {
      sql += " WHERE is_active = false"
    }

    sql += " ORDER BY name ASC"

    const result = await query(sql, params)
    return { success: true, data: result.rows }
  } catch (error) {
    console.error("Error fetching agents:", error)
    return { success: false, error: "Failed to fetch agents" }
  }
}

export async function createAgent(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const license_number = formData.get("license_number") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const agency = formData.get("agency") as string
    const is_active = formData.get("is_active") === "true"

    const result = await query(
      "INSERT INTO agents (name, license_number, phone, email, agency, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, license_number, phone, email, agency, is_active],
    )

    revalidatePath("/agents")
    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error("Error creating agent:", error)
    return { success: false, error: "Failed to create agent" }
  }
}

export async function updateAgent(id: number, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const license_number = formData.get("license_number") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const agency = formData.get("agency") as string
    const is_active = formData.get("is_active") === "true"

    const result = await query(
      "UPDATE agents SET name = $1, license_number = $2, phone = $3, email = $4, agency = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *",
      [name, license_number, phone, email, agency, is_active, id],
    )

    revalidatePath("/agents")
    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error("Error updating agent:", error)
    return { success: false, error: "Failed to update agent" }
  }
}

export async function deleteAgent(id: number) {
  try {
    await query("DELETE FROM agents WHERE id = $1", [id])
    revalidatePath("/agents")
    return { success: true }
  } catch (error) {
    console.error("Error deleting agent:", error)
    return { success: false, error: "Failed to delete agent" }
  }
}

// Ações para Visitas
export async function getVisits(status?: string) {
  try {
    let sql = `
      SELECT 
        v.id, 
        v.property_id,
        p.code as property_code,
        p.address as property_address,
        p.data as property_data,
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
    const visits = result.rows.map((visit: Visit) => ({
      ...visit,
      property: {
        codigo: visit.property.codigo,
        descricao: visit.property.titulo,
        end_logradouro: visit.property.titulo,
        ...visit
      }
    }))

    return { success: true, data: visits }
  } catch (error) {
    console.error("Error fetching visits:", error)
    return { success: false, error: "Failed to fetch visits" }
  }
}

export async function createVisit(formData: FormData) {
  try {
    const property_code = formData.get("property_codigo") as string
    const agent_id = Number.parseInt(formData.get("agent_id") as string)
    const client_name = formData.get("client_name") as string
    const client_phone = formData.get("client_phone") as string
    const client_email = formData.get("client_email") as string
    const scheduled_date = formData.get("scheduled_date") as string
    const scheduled_time = formData.get("scheduled_time") as string
    const status = (formData.get("status") as string) || "Agendada"
    const feedback = (formData.get("feedback") as string) || ""
    
    // Get property_id from code
    const property = await query(
      "SELECT id, data FROM properties WHERE code = $1",
      [property_code]
    )
    
    if (property.rows.length === 0) {
      return { success: false, error: "Imóvel não encontrado" }
    }

    const result = await query(
      `INSERT INTO visits 
        (property_id, agent_id, client_name, client_phone, client_email, scheduled_date, scheduled_time, status, feedback) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        property.rows[0].id,
        agent_id,
        client_name,
        client_phone,
        client_email,
        scheduled_date,
        scheduled_time,
        status,
        feedback,
      ]
    )

    revalidatePath("/visits")
    return {
      success: true,
      data: {
        ...result.rows[0],
        property: property.rows[0].data
      }
    }
  } catch (error) {
    console.error("Error creating visit:", error)
    return { success: false, error: "Failed to create visit" }
  }
}

export async function updateVisit(id: number, formData: FormData) {
  try {
    const property_code = formData.get("property_codigo") as string
    const agent_id = Number.parseInt(formData.get("agent_id") as string)
    const client_name = formData.get("client_name") as string
    const client_phone = formData.get("client_phone") as string
    const client_email = formData.get("client_email") as string
    const scheduled_date = formData.get("scheduled_date") as string
    const scheduled_time = formData.get("scheduled_time") as string
    const status = formData.get("status") as string
    const feedback = formData.get("feedback") as string

    // Get property_id from code
    const property = await query(
      "SELECT id, data FROM properties WHERE code = $1",
      [property_code]
    )
    
    if (property.rows.length === 0) {
      return { success: false, error: "Imóvel não encontrado" }
    }

    const result = await query(
      `UPDATE visits SET 
        property_id = $1, 
        agent_id = $2, 
        client_name = $3, 
        client_phone = $4, 
        client_email = $5, 
        scheduled_date = $6, 
        scheduled_time = $7, 
        status = $8, 
        feedback = $9,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 
       RETURNING *`,
      [
        property.rows[0].id,
        agent_id,
        client_name,
        client_phone,
        client_email,
        scheduled_date,
        scheduled_time,
        status,
        feedback,
        id,
      ]
    )

    revalidatePath("/visits")
    return {
      success: true,
      data: {
        ...result.rows[0],
        property: property.rows[0].data
      }
    }
  } catch (error) {
    console.error("Error updating visit:", error)
    return { success: false, error: "Failed to update visit" }
  }
}

export async function deleteVisit(id: number) {
  try {
    await query("DELETE FROM visits WHERE id = $1", [id])
    revalidatePath("/visits")
    return { success: true }
  } catch (error) {
    console.error("Error deleting visit:", error)
    return { success: false, error: "Failed to delete visit" }
  }
}

// Ações para Imóveis (Database)
export async function getProperties(status?: string) {
  try {
    let sql = "SELECT * FROM properties"
    const params: string[] = []

    if (status && status !== "todos") {
      sql += " WHERE status = $1"
      params.push(status)
    }

    sql += " ORDER BY created_at DESC"

    const result = await query(sql, params)
    return { success: true, data: result.rows }
  } catch (error) {
    console.error("Error fetching properties:", error)
    return { success: false, error: "Failed to fetch properties" }
  }
}

export async function updateProperty(id: number, formData: FormData) {
  try {
    const code = formData.get("code") as string
    const address = formData.get("address") as string
    const type = formData.get("type") as string
    const area = formData.get("area") as string
    const price = formData.get("price") as string
    const description = formData.get("description") as string
    const status = formData.get("status") as string

    const result = await query(
      "UPDATE properties SET code = $1, address = $2, type = $3, area = $4, price = $5, description = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *",
      [code, address, type, area, price, description, status, id],
    )

    revalidatePath("/properties")
    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error("Error updating property:", error)
    return { success: false, error: "Failed to update property" }
  }
}

export async function deleteProperty(id: number) {
  try {
    await query("DELETE FROM properties WHERE id = $1", [id])
    revalidatePath("/properties")
    return { success: true }
  } catch (error) {
    console.error("Error deleting property:", error)
    return { success: false, error: "Failed to delete property" }
  }
}

