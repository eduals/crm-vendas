import { query } from "@/lib/db"
import { encryptPayload } from "@/lib/crypto"

export async function getAgents() {
  try {
    const agents = await query(`
      SELECT * FROM agents 
      ORDER BY created_at DESC
    `)
    return agents.rows
  } catch (error) {
    console.error("Error fetching agents:", error)
    throw new Error("Failed to fetch agents")
  }
}

export async function createAgent(data: {
  name: string
  license_number: string
  phone: string
  email: string
  agency: string
  is_active: boolean
}) {
  try {
    // Criptografar os dados antes de enviar para a API
    const encryptedData = await encryptPayload(data, process.env.ENCRYPTION_KEY || "");
    
    // Enviar para a API que já está configurada para descriptografar
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secure_data: encryptedData }),
      cache: "no-store"
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Falha ao criar agente");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating agent:", error);
    throw new Error("Failed to create agent");
  }
}

export async function updateAgent(id: number, data: {
  name?: string
  license_number?: string
  phone?: string
  email?: string
  agency?: string
  is_active?: boolean
}) {
  try {
    // Validar e organizar os dados
    const updates: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    
    if (Object.keys(updates).length === 0) return null;
    
    // Criptografar os dados antes de enviar para a API
    const encryptedData = await encryptPayload(updates, process.env.ENCRYPTION_KEY || "");
    
    // Enviar para a API que já está configurada para descriptografar
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secure_data: encryptedData }),
      cache: "no-store"
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Falha ao atualizar agente");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating agent:", error);
    throw new Error("Failed to update agent");
  }
}

export async function deleteAgent(id: number) {
  try {
    await query("DELETE FROM agents WHERE id = $1", [id])
    return true
  } catch (error) {
    console.error("Error deleting agent:", error)
    throw new Error("Failed to delete agent")
  }
}

export async function getAgentsByStatus(isActive: boolean) {
  try {
    const agents = await query(
      "SELECT * FROM agents WHERE is_active = $1 ORDER BY created_at DESC",
      [isActive]
    )
    return agents.rows
  } catch (error) {
    console.error("Error fetching agents by status:", error)
    throw new Error("Failed to fetch agents")
  }
} 