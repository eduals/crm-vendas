"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  BuildingIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  GripVerticalIcon,
  MailIcon,
  MoreVerticalIcon,
  PhoneIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { createAgentAction, deleteAgentAction, updateAgentAction } from "@/app/agents/actions"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const agentSchema = z.object({
  id: z.number(),
  name: z.string(),
  license_number: z.string(),
  phone: z.string(),
  email: z.string(),
  agency: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type Agent = z.infer<typeof agentSchema>

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Arrastar para reordenar</span>
    </Button>
  )
}

function VisitHistorySheet({ agent, open, onOpenChange }: { agent: Agent, open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader className="gap-1">
          <SheetTitle>Histórico de Visitas</SheetTitle>
          <SheetDescription>Visitas realizadas pelo corretor {agent.name}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-sm text-muted-foreground">Histórico de visitas em desenvolvimento...</p>
            <Button variant="outline" size="sm" onClick={() => toast.info("Página em desenvolvimento")}>
              Ver todas as visitas
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const columns: ColumnDef<z.infer<typeof agentSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "license_number",
    header: "CRECI",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <UserIcon className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.license_number}</span>
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <PhoneIcon className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.phone}</span>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MailIcon className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "agency",
    header: "Imobiliária",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <BuildingIcon className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.agency}</span>
      </div>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active
      const statusColor = isActive ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
      const status = isActive ? "Ativo" : "Inativo"

      return (
        <Badge variant="outline" className={`px-1.5 ${statusColor}`}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const [isSubmitting, setIsSubmitting] = React.useState(false)
      const [showEditSheet, setShowEditSheet] = React.useState(false)
      const [showHistorySheet, setShowHistorySheet] = React.useState(false)
      const router = useRouter()

      async function handleToggleStatus() {
        setIsSubmitting(true)
        const formData = new FormData()
        formData.set("name", row.original.name)
        formData.set("license_number", row.original.license_number)
        formData.set("phone", row.original.phone)
        formData.set("email", row.original.email)
        formData.set("agency", row.original.agency)
        formData.set("is_active", (!row.original.is_active).toString())

        try {
          const result = await updateAgentAction(row.original.id, formData)
          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success(`Corretor ${row.original.is_active ? "desativado" : "ativado"} com sucesso!`)
            router.refresh()
          }
        } catch (error) {
          toast.error("Erro ao atualizar status do corretor")
        } finally {
          setIsSubmitting(false)
        }
      }

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
                <MoreVerticalIcon />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowEditSheet(true)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStatus} disabled={isSubmitting}>
                {row.original.is_active ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowHistorySheet(true)}>
                Ver histórico de visitas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
            <SheetContent side="right" className="flex flex-col">
              <SheetHeader className="gap-1">
                <SheetTitle>Detalhes do Corretor</SheetTitle>
                <SheetDescription>Informações sobre o corretor parceiro</SheetDescription>
              </SheetHeader>
              <form action={async (formData: FormData) => {
                setIsSubmitting(true)
                try {
                  const result = await updateAgentAction(row.original.id, formData)
                  if (result.error) {
                    toast.error(result.error)
                  } else {
                    toast.success("Corretor atualizado com sucesso!")
                    setShowEditSheet(false)
                    router.refresh()
                  }
                } catch (error) {
                  toast.error("Erro ao atualizar corretor")
                } finally {
                  setIsSubmitting(false)
                }
              }} className="flex flex-1 flex-col gap-4">
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" name="name" defaultValue={row.original.name} required />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="license_number">CRECI</Label>
                    <Input id="license_number" name="license_number" defaultValue={row.original.license_number} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" name="phone" defaultValue={row.original.phone} required />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" defaultValue={row.original.email} required />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="agency">Imobiliária</Label>
                    <Input id="agency" name="agency" defaultValue={row.original.agency} required />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="is_active">Status</Label>
                    <Select name="is_active" defaultValue={row.original.is_active ? "true" : "false"}>
                      <SelectTrigger id="is_active" className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <SheetClose asChild>
                    <Button type="button" variant="outline">
                      Fechar
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>

          <VisitHistorySheet 
            agent={row.original} 
            open={showHistorySheet} 
            onOpenChange={setShowHistorySheet} 
          />
        </>
      )
    },
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof agentSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  )
}

export function AgentsTable({
  data: initialData,
}: {
  data: z.infer<typeof agentSchema>[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const currentTab = searchParams?.get("tab") || "todos"
  const filteredData = React.useMemo(() => {
    if (currentTab === "ativos") {
      return data.filter(agent => agent.is_active)
    }
    if (currentTab === "inativos") {
      return data.filter(agent => !agent.is_active)
    }
    return data
  }, [data, currentTab])

  const activeCount = React.useMemo(() => data.filter(agent => agent.is_active).length, [data])
  const inactiveCount = React.useMemo(() => data.filter(agent => !agent.is_active).length, [data])

  const sortableId = React.useId()
  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => filteredData?.map(({ id }) => id) || [], [filteredData])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Handle tab change
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === "todos") {
      params.delete("tab")
    } else {
      params.set("tab", value)
    }
    router.push(`/agents?${params.toString()}`)
  }

  // Handle form submissions
  async function handleCreateAgent(formData: FormData) {
    setIsSubmitting(true)
    try {
      const result = await createAgentAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        const newAgent = {
          id: result.id,
          name: formData.get("name") as string,
          license_number: formData.get("license_number") as string,
          phone: formData.get("phone") as string,
          email: formData.get("email") as string,
          agency: formData.get("agency") as string,
          is_active: formData.get("is_active") === "true",
          created_at: new Date().toISOString(),
        }
        setData(prev => [...prev, newAgent])
        toast.success("Corretor criado com sucesso!")
        router.refresh()
      }
    } catch (error) {
      toast.error("Erro ao criar corretor")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateAgent(id: number, formData: FormData) {
    setIsSubmitting(true)
    try {
      const result = await updateAgentAction(id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        setData(prev => prev.map(agent => {
          if (agent.id === id) {
            return {
              ...agent,
              name: formData.get("name") as string,
              license_number: formData.get("license_number") as string,
              phone: formData.get("phone") as string,
              email: formData.get("email") as string,
              agency: formData.get("agency") as string,
              is_active: formData.get("is_active") === "true",
            }
          }
          return agent
        }))
        toast.success("Corretor atualizado com sucesso!")
        router.refresh()
      }
    } catch (error) {
      toast.error("Erro ao atualizar corretor")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteAgent(id: number) {
    if (!confirm("Tem certeza que deseja remover este corretor?")) return
    
    try {
      const result = await deleteAgentAction(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setData(prev => prev.filter(agent => agent.id !== id))
        toast.success("Corretor removido com sucesso!")
        router.refresh()
      }
    } catch (error) {
      toast.error("Erro ao remover corretor")
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const renderTableContent = () => (
    <div className="overflow-hidden rounded-lg border">
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        id={sortableId}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {table.getRowModel().rows?.length ? (
              <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                {table.getRowModel().rows.map((row) => (
                  <DraggableRow key={row.id} row={row} />
                ))}
              </SortableContext>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  )

  const renderPagination = () => (
    <div className="flex items-center justify-between px-4">
      <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
        {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} linha(s)
        selecionada(s).
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Linhas por página
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="w-20" id="rows-per-page">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir para primeira página</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir para página anterior</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir para próxima página</span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir para última página</span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="flex w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          Visualização
        </Label>
        <Select defaultValue="todos">
          <SelectTrigger className="@4xl/main:hidden flex w-fit" id="view-selector">
            <SelectValue placeholder="Selecione uma visualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Corretores</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="@4xl/main:flex hidden">
          <TabsTrigger value="todos">Todos os Corretores</TabsTrigger>
          <TabsTrigger value="ativos" className="gap-1">
            Ativos{" "}
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {activeCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="inativos" className="gap-1">
            Inativos{" "}
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {inactiveCount}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ColumnsIcon className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Colunas</span>
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Novo Corretor</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col">
              <SheetHeader className="gap-1">
                <SheetTitle>Novo Corretor</SheetTitle>
                <SheetDescription>Adicione um novo corretor parceiro</SheetDescription>
              </SheetHeader>
              <form action={handleCreateAgent} className="flex flex-1 flex-col gap-4">
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" name="name" placeholder="Nome completo" required />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="license_number">CRECI</Label>
                    <Input id="license_number" name="license_number" placeholder="Ex: CRECI 12345" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" name="phone" placeholder="(00) 00000-0000" required />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="email@exemplo.com" required />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="agency">Imobiliária</Label>
                    <Input id="agency" name="agency" placeholder="Nome da imobiliária" required />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="is_active">Status</Label>
                    <Select name="is_active" defaultValue="true">
                      <SelectTrigger id="is_active" className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                  <SheetClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <TabsContent value="todos" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {renderTableContent()}
        {renderPagination()}
      </TabsContent>
      <TabsContent value="ativos" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {renderTableContent()}
        {renderPagination()}
      </TabsContent>
      <TabsContent value="inativos" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {renderTableContent()}
        {renderPagination()}
      </TabsContent>
    </Tabs>
  )
}

function TableCellViewer({ item }: { item: z.infer<typeof agentSchema> }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      const result = await updateAgentAction(item.id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Corretor atualizado com sucesso!")
      }
    } catch (error) {
      toast.error("Erro ao atualizar corretor")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {item.name}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader className="gap-1">
          <SheetTitle>Detalhes do Corretor</SheetTitle>
          <SheetDescription>Informações sobre o corretor parceiro</SheetDescription>
        </SheetHeader>
        <form action={handleSubmit} className="flex flex-1 flex-col gap-4">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={item.name} required />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="license_number">CRECI</Label>
              <Input id="license_number" name="license_number" defaultValue={item.license_number} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" defaultValue={item.phone} required />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={item.email} required />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="agency">Imobiliária</Label>
              <Input id="agency" name="agency" defaultValue={item.agency} required />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="is_active">Status</Label>
              <Select name="is_active" defaultValue={item.is_active ? "true" : "false"}>
                <SelectTrigger id="is_active" className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Fechar
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

