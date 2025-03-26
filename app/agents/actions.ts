"use server"

import { revalidatePath } from "next/cache"
import { createAgent, updateAgent, deleteAgent } from "@/lib/db/agents"
import { z } from "zod"

const agentFormSchema = z.object({
  name: z.string(),
  license_number: z.string(),
  phone: z.string(),
  email: z.string(),
  agency: z.string(),
  is_active: z.boolean(),
})

type AgentFormData = z.infer<typeof agentFormSchema>

export async function createAgentAction(formData: FormData) {
  try {
    const data: AgentFormData = {
      name: formData.get("name") as string,
      license_number: formData.get("license_number") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      agency: formData.get("agency") as string,
      is_active: formData.get("is_active") === "true",
    }

    const validated = agentFormSchema.parse(data)
    const newAgent = await createAgent(validated)
    revalidatePath("/agents")
    return { success: true, id: newAgent.id }
  } catch (error) {
    console.error("Error creating agent:", error)
    return { error: "Failed to create agent" }
  }
}

export async function updateAgentAction(id: number, formData: FormData) {
  try {
    const data: AgentFormData = {
      name: formData.get("name") as string,
      license_number: formData.get("license_number") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      agency: formData.get("agency") as string,
      is_active: formData.get("is_active") === "true",
    }

    const validated = agentFormSchema.parse(data)
    await updateAgent(id, validated)
    revalidatePath("/agents")
    return { success: true }
  } catch (error) {
    console.error("Error updating agent:", error)
    return { error: "Failed to update agent" }
  }
}

export async function deleteAgentAction(id: number) {
  try {
    await deleteAgent(id)
    revalidatePath("/agents")
    return { success: true }
  } catch (error) {
    console.error("Error deleting agent:", error)
    return { error: "Failed to delete agent" }
  }
} 