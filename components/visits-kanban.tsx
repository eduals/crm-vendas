"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CalendarIcon, Clock, Filter, LayoutGrid, LayoutList, Phone, User, X } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { toast } from "sonner"
import { encryptPayload } from "@/lib/crypto"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ScheduleVisitButton } from "@/components/schedule-visit-button"
import type { Visit } from "@/types/visit"

interface Agent {
  id: number
  name: string
}

interface Property {
  codigo: string
  name: string
}

const getBadgeVariant = (status: string) => {
  switch (status) {
    case "Agendada":
      return "default"
    case "Realizada":
      return "success"
    case "Cancelada":
      return "destructive"
    case "Negociação":
      return "secondary"
    case "Proposta":
      return "secondary"
    case "Finalizada":
      return "success"
    default:
      return "default"
  }
}

// Componente de cartão de visita
const VisitCard = ({
  visit,
  isOverlay = false,
  onClick,
}: {
  visit: Visit
  isOverlay?: boolean
  onClick?: () => void
}) => {
  // Extrair as iniciais do nome do cliente para o avatar
  const initials = visit.client_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  // Obter a foto principal do imóvel
  const mainPhoto =
    visit.property.fotos?.find((foto) => foto.principal)?.sizes?.small ||
    visit.property.fotos?.[0]?.sizes?.small ||
    "/placeholder.svg?height=64&width=64"

  // Formatar o valor do imóvel
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number.parseFloat(value))
  }

  return (
    <Card
      className={cn(
        "mb-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]",
        isOverlay && "shadow-xl scale-105 rotate-3 z-50"
      )}
      onClick={(e) => {
        // Prevenir o click durante o drag
        if (!isOverlay && e.detail === 1) {
          console.log('VisitCard clicked:', visit)
          onClick?.()
        }
      }}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between group-hover:bg-muted/50 transition-colors rounded-t-lg">
        <div className="flex flex-col">
          <div className="font-semibold line-clamp-1">{visit.client_name}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">
            {visit.property.categoria} - {visit.property.end_bairro}
          </div>
        </div>
        <Badge variant={getBadgeVariant(visit.status)}>{visit.status}</Badge>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex gap-3 mb-2">
          <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
            <img
              src={mainPhoto || "/placeholder.svg"}
              alt={visit.property.titulo}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="text-sm line-clamp-2 mb-1">{visit.property.titulo}</div>
            {visit.property.valor_venda && (
              <div className="text-sm font-medium">{formatCurrency(visit.property.valor_venda)}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm mb-1">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(new Date(visit.scheduled_date), "dd/MM/yyyy", {
              locale: ptBR,
            })}
          </span>
          <Clock className="h-4 w-4 text-muted-foreground ml-2" />
          <span>{visit.scheduled_time.substring(0, 5)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{visit.client_phone}</span>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{visit.agent_name}</span>
        </div>
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </CardFooter>
    </Card>
  )
}

// Componente de coluna do Kanban
const KanbanColumn = ({
  title,
  visits,
  status,
  onVisitSelect,
  isActive,
}: {
  title: string
  visits: Visit[]
  status: string
  onVisitSelect: (visit: Visit) => void
  isActive?: boolean
}) => {
  const { setNodeRef } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-w-[300px] flex-col bg-muted/40 rounded-md transition-all duration-200 relative",
        isActive && "ring-2 ring-primary ring-offset-2 bg-muted/70"
      )}
    >
      {isActive && (
        <div className="absolute inset-0 border-2 border-dashed border-primary rounded-md pointer-events-none" />
      )}
      <div className="p-3 font-medium flex items-center justify-between">
        <div>{title}</div>
        <Badge variant="outline" className="ml-2">
          {visits.filter((v) => v.status === status).length}
        </Badge>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div>
          <SortableContext
            items={visits.map((v) => v.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            {visits.map((visit) => (
              <SortableVisitCard 
                key={visit.id} 
                visit={visit} 
                onVisitSelect={onVisitSelect}
              />
            ))}
          </SortableContext>
          {visits.length === 0 && (
            <DroppableColumn status={status} />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Componente SortableVisitCard
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const SortableVisitCard = ({ 
  visit, 
  onVisitSelect 
}: { 
  visit: Visit
  onVisitSelect: (visit: Visit) => void 
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: visit.id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("transition-all duration-200", isDragging ? "opacity-30 z-10" : "opacity-100 z-0")}
    >
      <VisitCard 
        visit={visit} 
        onClick={() => {
          console.log('SortableVisitCard clicked:', visit)
          onVisitSelect(visit)
        }}
      />
    </div>
  )
}

// Componente DroppableColumn
const DroppableColumn = ({ status }: { status: string }) => {
  const { setNodeRef } = useDroppable({
    id: status,
  })

  return (
    <div 
      ref={setNodeRef}
      className="h-[100px] border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-sm text-muted-foreground"
    >
      Arraste um card aqui
    </div>
  )
}

// Componente principal do Kanban
export default function VisitsKanban({ data }: { data: Visit[] }) {
  const [visits, setVisits] = useState<Visit[]>(data)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [filters, setFilters] = useState({
    search: "",
    date: null as Date | null,
    status: "",
    agent: "",
    property: "",
  })
  const [activeFilters, setActiveFilters] = useState(0)
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)

  // Lista de status possíveis
  const statusList = ["Agendada", "Realizada", "Cancelada", "Negociação", "Proposta", "Finalizada"]

  // Extrair agentes e propriedades únicas dos dados
  const agents = useMemo(() => {
    const uniqueAgents = Array.from(new Set(visits.map((visit) => visit.agent_id))).map((id) => ({
      id,
      name: visits.find((v) => v.agent_id === id)?.agent_name || `Agente ${id}`,
    }))
    return uniqueAgents
  }, [visits])

  const properties = useMemo(() => {
    const uniqueProperties = Array.from(new Set(visits.map((visit) => visit.property_id))).map((property_id) => ({
      property_id,
      name: visits.find((v) => v.property_id === property_id)?.property.titulo || `Imóvel ${property_id}`,
    }))
    return uniqueProperties
  }, [visits])

  // Configuração dos sensores para o DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduzir a distância para ativar o arrasto
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Manipuladores de eventos para o DnD
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    document.body.classList.add("dragging")
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveColumn(null)
      return
    }

    // Verificar se estamos sobre uma coluna
    const overId = over.id.toString()

    if (statusList.includes(overId)) {
      setActiveColumn(overId)
    } else {
      // Verificar a coluna pai do item sobre o qual estamos arrastando
      const overVisit = visits.find((visit) => visit.id.toString() === overId)
      if (overVisit) {
        setActiveColumn(overVisit.status)
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    document.body.classList.remove("dragging")
    
    if (!over) {
      setActiveId(null)
      setActiveColumn(null)
      return
    }

    const activeId = active.id.toString()
    const targetStatus = over.id.toString()

    // Encontrar a visita que está sendo movida
    const visitToUpdate = visits.find(visit => visit.id.toString() === activeId)
    
    if (!visitToUpdate || !statusList.includes(targetStatus)) {
      setActiveId(null)
      setActiveColumn(null)
      return
    }

    // Se o status é o mesmo, não faz nada
    if (visitToUpdate.status === targetStatus) {
      setActiveId(null)
      setActiveColumn(null)
      return
    }

    try {
      console.log('Atualizando visita:', {
        id: activeId,
        oldStatus: visitToUpdate.status,
        newStatus: targetStatus
      })

      // Atualizar estado local primeiro (otimistic update)
      const updatedVisits = visits.map(visit => 
        visit.id.toString() === activeId 
          ? { ...visit, status: targetStatus }
          : visit
      )
      setVisits(updatedVisits)

      // Dados para atualização
      const updateData = {
        status: targetStatus,
        property_id: visitToUpdate.property_id,
        agent_id: visitToUpdate.agent_id,
        scheduled_date: visitToUpdate.scheduled_date,
        scheduled_time: visitToUpdate.scheduled_time,
        client_name: visitToUpdate.client_name,
        client_phone: visitToUpdate.client_phone,
        client_email: visitToUpdate.client_email,
      }

      // Criptografar dados
      const encryptedData = await encryptPayload(updateData, process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "")

      // Enviar atualização para a API
      const response = await fetch(`/api/visits/${activeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secure_data: encryptedData }),
      })

      if (!response.ok) {
        throw new Error("Falha ao atualizar status")
      }

      toast.success(`Visita de ${visitToUpdate.client_name} atualizada para "${targetStatus}"`, {
        description: `${format(new Date(), "dd/MM HH:mm:ss")}`,
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      
      // Reverter para o status anterior em caso de erro
      setVisits(currentVisits =>
        currentVisits.map(visit =>
          visit.id.toString() === activeId
            ? { ...visit, status: visitToUpdate.status }
            : visit
        )
      )
      
      toast.error("Falha ao atualizar status da visita", {
        description: "Verifique sua conexão e tente novamente."
      })
    } finally {
      setActiveId(null)
      setActiveColumn(null)
    }
  }

  // Filtrar visitas com base nos filtros aplicados
  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      // Filtro de pesquisa (nome do cliente)
      if (filters.search && !visit.client_name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Filtro de data
      if (filters.date && visit.scheduled_date !== format(filters.date, "yyyy-MM-dd")) {
        return false
      }

      // Filtro de status
      if (filters.status && filters.status !== "all" && visit.status !== filters.status) {
        return false
      }

      // Filtro de agente
      if (filters.agent && filters.agent !== "all" && visit.agent_id.toString() !== filters.agent) {
        return false
      }

      // Filtro de propriedade
      if (filters.property && filters.property !== "all" && visit.property.codigo !== filters.property) {
        return false
      }

      return true
    })
  }, [visits, filters])

  // Agrupar visitas por status
  const visitsByStatus = useMemo(() => {
    const grouped: Record<string, Visit[]> = {}

    for (const status of statusList) {
      grouped[status] = filteredVisits.filter((visit) => visit.status === status)
    }

    return grouped
  }, [filteredVisits])

  // Atualizar contador de filtros ativos
  useEffect(() => {
    let count = 0
    if (filters.search) count++
    if (filters.date) count++
    if (filters.status && filters.status !== "all") count++
    if (filters.agent && filters.agent !== "all") count++
    if (filters.property && filters.property !== "all") count++
    setActiveFilters(count)
  }, [filters])

  // Verificar se é dispositivo móvel
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      search: "",
      date: null,
      status: "",
      agent: "",
      property: "",
    })
  }

  // Encontrar a visita ativa para o overlay
  const activeVisit = activeId ? visits.find((visit) => visit.id.toString() === activeId) : null

  return (
    <div className="mx-auto max-w-7xl py-6 px-4">
      {/* Header com filtros - mantém fixo */}
      <div className="bg-background z-10 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtrar visitas</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Buscar por nome do cliente"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal h-8">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.date ? (
                              format(filters.date, "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            ) : (
                              <span>Data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.date || undefined}
                            onSelect={(date) => setFilters({ ...filters, date: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {statusList.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={filters.agent} onValueChange={(value) => setFilters({ ...filters, agent: value })}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Agente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      name="property_id"
                      value={filters.property}
                      onValueChange={(value) => setFilters({ ...filters, property: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Imóvel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {properties.map((property) => (
                          <SelectItem 
                            key={property.property_id} 
                            value={property.property_id.toString()}
                          >
                            {property.property_id} - {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                      Limpar filtros
                    </Button>
                    <Button size="sm" onClick={() => document.body.click()} className="h-8">
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Tabs
              defaultValue="kanban"
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "kanban" | "list")}
              className="w-auto"
            >
              <TabsList className="h-8">
                <TabsTrigger value="kanban" className="px-3">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="px-3">
                  <LayoutList className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Adicionar o botão de agendar visita */}
          <div className="flex items-center gap-2">
            <ScheduleVisitButton 
              initialData={selectedVisit || undefined}
              onSubmitSuccess={() => {
                setSelectedVisit(null)
                // Atualizar a lista de visitas se necessário
              }}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedVisit(null)
                }
              }}
            />
          </div>
        </div>

        {/* Chips de filtros ativos */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.search && (
              <Badge variant="secondary" className="h-6 gap-1">
                {filters.search}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, search: "" })} />
              </Badge>
            )}
            {filters.date && (
              <Badge variant="secondary" className="h-6 gap-1">
                {format(filters.date, "dd/MM/yyyy", { locale: ptBR })}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, date: null })} />
              </Badge>
            )}
            {filters.status && filters.status !== "all" && (
              <Badge variant="secondary" className="h-6 gap-1">
                {filters.status}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, status: "" })} />
              </Badge>
            )}
            {filters.agent && filters.agent !== "all" && (
              <Badge variant="secondary" className="h-6 gap-1">
                {agents.find((a) => a.id.toString() === filters.agent)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, agent: "" })} />
              </Badge>
            )}
            {filters.property && filters.property !== "all" && (
              <Badge variant="secondary" className="h-6 gap-1">
                {properties.find((p) => p.property_id === Number.parseInt(filters.property))?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, property: "" })} />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Container principal - com scroll apenas no conteúdo do Kanban */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full">
          {viewMode === "kanban" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {/* Container das colunas - com scroll horizontal */}
              <div className="flex h-full gap-4 overflow-x-auto overflow-y-hidden">
                {statusList.map((status) => (
                  <KanbanColumn
                    key={status}
                    title={status}
                    visits={visitsByStatus[status] || []}
                    status={status}
                    isActive={activeColumn === status}
                    onVisitSelect={setSelectedVisit}
                  />
                ))}
              </div>

              <DragOverlay adjustScale={true} zIndex={100}>
                {activeId && activeVisit && (
                  <div className="transform rotate-3 scale-105">
                    <VisitCard visit={activeVisit} isOverlay />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Nenhuma visita encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVisits.map((visit) => (
                      <TableRow 
                        key={visit.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedVisit(visit)}
                      >
                        <TableCell>
                          <div className="font-medium">{visit.client_name}</div>
                          <div className="text-sm text-muted-foreground">{visit.client_phone}</div>
                        </TableCell>
                        <TableCell>{visit.property.titulo || `Imóvel ${visit.property.codigo}`}</TableCell>
                        <TableCell>
                          <div>
                            {format(new Date(visit.scheduled_date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">{visit.scheduled_time.substring(0, 5)}</div>
                        </TableCell>
                        <TableCell>{visit.agent_name || `Agente ${visit.agent_id}`}</TableCell>
                        <TableCell>
                          <Select
                            value={visit.status}
                            onValueChange={async (newStatus) => {
                              // Armazenar status antigo para possível rollback
                              const oldStatus = visit.status;
                              
                              // Atualização otimista no estado local
                              setVisits((visits) => visits.map((v) => 
                                v.id === visit.id ? { ...v, status: newStatus } : v
                              ));
                              
                              try {
                                // Dados para atualização
                                const updateData = {
                                  status: newStatus,
                                  property_id: visit.property_id,
                                  agent_id: visit.agent_id,
                                  scheduled_date: visit.scheduled_date,
                                  scheduled_time: visit.scheduled_time,
                                  client_name: visit.client_name,
                                  client_phone: visit.client_phone,
                                  client_email: visit.client_email,
                                };

                                // Criptografar dados
                                const encryptedData = await encryptPayload(
                                  updateData, 
                                  process.env.NEXT_PUBLIC_ENCRYPTION_KEY || ""
                                );

                                // Enviar atualização para a API
                                const response = await fetch(`/api/visits/${visit.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ secure_data: encryptedData }),
                                });

                                if (!response.ok) {
                                  throw new Error("Falha ao atualizar status");
                                }
                                console.log("Visita atualizada para:", newStatus, toast);
                                toast.success(`Visita de ${visit.client_name} atualizada para "${newStatus}"`, {
                                  description: `${format(new Date(), "dd/MM HH:mm:ss")}`,
                                });
                              } catch (error) {
                                console.error("Erro ao atualizar status:", error);
                                
                                // Reverter para o status anterior em caso de erro
                                setVisits(currentVisits =>
                                  currentVisits.map(v =>
                                    v.id === visit.id ? { ...v, status: oldStatus } : v
                                  )
                                );
                                
                                toast.error("Falha ao atualizar status da visita", {
                                  description: "Verifique sua conexão e tente novamente."
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusList.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        body.dragging {
          cursor: grabbing !important;
        }
        
        body.dragging * {
          cursor: grabbing !important;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--primary), 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(var(--primary), 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--primary), 0);
          }
        }
        
        .pulse-animation {
          animation: pulse 1s;
        }
      `}</style>
    </div>
  )
}

