"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"
import { encryptPayload } from "@/lib/crypto"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ArboImovel, ArboResponse } from "@/lib/arbo-api"
import type { Visit } from "@/types/visit"
interface Property {
  property_id: number
  codigo: string
  endereco: string
  ref_id?: number      // O ID da API externa (opcional)
}

interface Agent {
  id: number
  name: string
}


const scheduleVisitSchema = z.object({
  property_id: z.string().min(1, "Selecione um imóvel"),
  agent_id: z.string().min(1, "Selecione um corretor"),
  scheduled_date: z.string().min(1, "Selecione uma data"),
  scheduled_time: z.string().min(1, "Selecione um horário"),
  client_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  client_phone: z.string().min(10, "Telefone inválido"),
  client_email: z.string().email("Email inválido").optional(),
  notes: z.string().optional(),
  status: z.string().default("Agendada"),
})

type ScheduleVisitForm = z.infer<typeof scheduleVisitSchema>

function transformArboImovel(imovel: ArboImovel): Property {
  // Usar valores padrão para todos os campos para evitar undefined/NaN
  return {
    property_id: imovel.ref_id || 0,
    ref_id: imovel.ref_id || 0,
    codigo: imovel.codigo || `id-${Math.random().toString(36).substring(7)}`,
    endereco: `${imovel.end_logradouro || ''}, ${imovel.end_numero || ''} - ${imovel.end_bairro || ''}`.trim() || 'Endereço indisponível'
  }
}

async function getImoveis(): Promise<ArboImovel[]> {
  const response = await fetch("/api/imoveis/list")
  if (!response.ok) throw new Error("Falha ao carregar imóveis")
  const data: ArboResponse = await response.json()
  return data.data
}

async function getAgents(): Promise<Agent[]> {
  const response = await fetch("/api/agents")
  if (!response.ok) throw new Error("Failed to fetch agents")
  return response.json()
}

async function createVisit(data: ScheduleVisitForm) {
  try {
    // Criptografar os dados antes de enviar
    const encryptedData = await encryptPayload(data, process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "");
    console.log("[API] Enviando dados criptografados para criação de visita");
    
    const response = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secure_data: encryptedData }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[API] Erro ao criar visita:", errorData);
      throw new Error(errorData.error || "Falha ao criar visita");
    }
    
    return response.json();
  } catch (error) {
    console.error("[API] Exceção ao criar visita:", error);
    throw error;
  }
}

async function updateVisit(id: number, data: ScheduleVisitForm) {
  try {
    // Criptografar os dados antes de enviar
    const encryptedData = await encryptPayload(data, process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "");
    console.log("[API] Enviando dados criptografados para atualização de visita");
    
    const response = await fetch(`/api/visits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secure_data: encryptedData }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[API] Erro ao atualizar visita:", errorData);
      throw new Error(errorData.error || "Falha ao atualizar visita");
    }
    
    return response.json();
  } catch (error) {
    console.error("[API] Exceção ao atualizar visita:", error);
    throw error;
  }
}

interface ScheduleVisitButtonProps {
  initialData?: Visit
  onSubmitSuccess?: () => void
  onOpenChange?: (open: boolean) => void
}

export function ScheduleVisitButton({ initialData, onSubmitSuccess, onOpenChange }: ScheduleVisitButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [properties, setProperties] = React.useState<Property[]>([])
  const [agents, setAgents] = React.useState<Agent[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = React.useState(true)
  const [isLoadingAgents, setIsLoadingAgents] = React.useState(true)

  const form = useForm<ScheduleVisitForm>({
    resolver: zodResolver(scheduleVisitSchema),
    defaultValues: {
      status: "Agendada",
    }
  })

  // Fetch properties
  React.useEffect(() => {
    async function fetchProperties() {
      try {
        const imoveis = await getImoveis()
        
        // Filtragem mais robusta de propriedades válidas
        const validProperties = imoveis
          .map(transformArboImovel)
          // Sem filtro, para garantir que vamos ver todos os imóveis e depurar
        
        console.log('Debug - Imóveis:', {
          total: imoveis.length,
          validos: validProperties.length,
          primeiro: validProperties[0],
          ids: validProperties.map(p => p.property_id).slice(0, 5) // primeiros 5 IDs para verificar
        });
        
        setProperties(validProperties);
      } catch (error) {
        console.error('Erro ao carregar imóveis:', error)
        toast.error("Erro ao carregar imóveis")
      } finally {
        setIsLoadingProperties(false)
      }
    }
    fetchProperties()
  }, [])

  // Fetch agents
  React.useEffect(() => {
    async function fetchAgents() {
      try {
        const data = await getAgents()
        setAgents(data)
      } catch (error) {
        toast.error("Erro ao carregar corretores")
      } finally {
        setIsLoadingAgents(false)
      }
    }
    fetchAgents()
  }, [])

  // Adicionar este useEffect para abrir o Sheet quando initialData mudar
  React.useEffect(() => {
    if (initialData) {
      setIsOpen(true)
    }
  }, [initialData])

  // Adicionar este useEffect logo após o useEffect existente para initialData
  React.useEffect(() => {
    if (initialData && properties.length > 0) {  // Só reseta quando tiver os imóveis
      const formData = {
        property_id: String(initialData.property_id),
        agent_id: String(initialData.agent_id),
        scheduled_date: new Date(initialData.scheduled_date)
          .toISOString()
          .split('T')[0],
        scheduled_time: initialData.scheduled_time,
        client_name: initialData.client_name,
        client_phone: initialData.client_phone,
        client_email: initialData.client_email || undefined,
        status: initialData.status || "Agendada",
      }

      console.log('Setting form with:', {
        formData,
        availableProperties: properties.map(p => p.property_id)
      })

      form.reset(formData, {
        keepDefaultValues: true
      })
    }
  }, [initialData, form, properties])  // Adicionando properties como dependência

  async function onSubmit(data: ScheduleVisitForm) {
    setIsLoading(true)
    try {
      const visitData = {
        ...data,
        status: data.status || "Agendada",
      }

      if (initialData) {
        await updateVisit(initialData.id, visitData)
        toast.success("Visita atualizada com sucesso!")
      } else {
        await createVisit(visitData)
        toast.success("Visita agendada com sucesso!")
      }
      
      // Feche o Sheet e resete o form com valores padrão
      setIsOpen(false)
      form.reset({
        status: "Agendada"
      })
      
      // Execute callback se existir
      onSubmitSuccess?.()
      
      // Em vez de recarregar a página, você pode:
      // 1. Emitir um evento para atualizar a lista
      // 2. Usar React Query ou SWR para revalidar dados
      // 3. Retornar os dados e atualizar o estado pai
    } catch (error) {
      toast.error(initialData ? "Erro ao atualizar visita" : "Erro ao agendar visita")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open)
        onOpenChange?.(open)
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline">Nova Visita</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader className="gap-1">
          <SheetTitle>Agendar Visita</SheetTitle>
          <SheetDescription>Preencha os dados para agendar uma visita</SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
            <div className="flex flex-col gap-3">
              <Label htmlFor="property_id">Imóvel</Label>
              <Select
                {...form.register("property_id")}
                onValueChange={(value) => {
                  console.log('Property selecionado:', value)
                  form.setValue("property_id", value, { shouldValidate: true })
                }}
                disabled={isLoadingProperties}
              >
                <SelectTrigger id="property_id" className="w-full">
                  <SelectValue placeholder="Selecione um imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {properties.length > 0 ? (
                    properties
                      .map((property, index) => {
                        // Usar apenas o índice como chave, garantindo unicidade
                        const uniqueKey = `property-index-${index}`;
                        
                        // Valor seguro para o select
                        const selectValue = property.ref_id ? 
                          String(property.ref_id) : 
                          property.codigo ? 
                            String(property.codigo) : 
                            `id-${index}`;
                            
                        return (
                          <SelectItem 
                            key={uniqueKey}
                            value={selectValue}
                          >
                            {property.codigo ? property.codigo : `ID:${index}`} - {property.endereco}
                          </SelectItem>
                        );
                      })
                  ) : (
                    <SelectItem value="placeholder" disabled>
                      {isLoadingProperties ? "Carregando..." : "Nenhum imóvel encontrado"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.property_id && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.property_id.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="agent_id">Corretor</Label>
              <Select
                name="agent_id"
                value={form.watch("agent_id")}
                onValueChange={(value) => form.setValue("agent_id", value)}
                disabled={isLoadingAgents}
              >
                <SelectTrigger id="agent_id" className="w-full">
                  <SelectValue placeholder="Selecione um corretor" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.agent_id && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.agent_id.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="scheduled_date">Data</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  {...form.register("scheduled_date")}
                />
                {form.formState.errors.scheduled_date && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.scheduled_date.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="scheduled_time">Hora</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  {...form.register("scheduled_time")}
                />
                {form.formState.errors.scheduled_time && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.scheduled_time.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="client_name">Nome do Cliente</Label>
              <Input
                id="client_name"
                placeholder="Nome completo"
                {...form.register("client_name")}
              />
              {form.formState.errors.client_name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.client_name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="client_phone">Telefone</Label>
                <Input
                  id="client_phone"
                  placeholder="(00) 00000-0000"
                  {...form.register("client_phone")}
                />
                {form.formState.errors.client_phone && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.client_phone.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="client_email">Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  placeholder="email@exemplo.com"
                  {...form.register("client_email")}
                />
                {form.formState.errors.client_email && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.client_email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                placeholder="Informações adicionais sobre a visita"
                {...form.register("notes")}
              />
            </div>
          </div>

          <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Agendando..." : "Agendar Visita"}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
} 