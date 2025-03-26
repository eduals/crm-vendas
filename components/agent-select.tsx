import * as React from "react"
import { getAgents } from "@/lib/actions"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ControllerRenderProps } from "react-hook-form"

interface Agent {
  id: number
  name: string
}

interface AgentSelectProps {
  field: ControllerRenderProps<any, "agent_id">
}

export function AgentSelect({ field }: AgentSelectProps) {
  const [agents, setAgents] = React.useState<Agent[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchAgents() {
      try {
        const result = await getAgents("ativos")
        if (result.success && result.data) {
          setAgents(result.data.map(agent => ({
            id: agent.id,
            name: agent.name
          })))
        }
      } catch (error) {
        console.error("Error fetching agents:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="agent_id">Corretor</Label>
      <Select 
        name={field.name}
        value={field.value}
        onValueChange={field.onChange}
        required 
        disabled={loading}
      >
        <SelectTrigger id="agent_id" className="w-full">
          <SelectValue placeholder={loading ? "Carregando..." : "Selecione um corretor"} />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id.toString()}>
              {agent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 