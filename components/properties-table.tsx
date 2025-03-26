"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
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
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  HomeIcon,
  MoreVerticalIcon,
  RefreshCcwIcon,
  SquareIcon,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProperties, updateProperty, deleteProperty } from "@/lib/actions"

export const schema = z.object({
  id: z.number(),
  code: z.string(),
  address: z.string(),
  type: z.string(),
  area: z
    .string()
    .or(z.number())
    .transform((v) => String(v)),
  price: z
    .string()
    .or(z.number())
    .transform((v) => String(v)),
  description: z.string(),
  status: z.string(),
  created_at: z.string(),
})

export type Property = z.infer<typeof schema>

const columns: ColumnDef<Property>[] = [
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
    accessorKey: "code",
    header: "Código",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <HomeIcon className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.code}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "address",
    header: "Endereço",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <BuildingIcon className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.type}</span>
      </div>
    ),
  },
  {
    accessorKey: "area",
    header: "Área (m²)",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <SquareIcon className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.area} m²</span>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Preço",
    cell: ({ row }) => {
      // Format price as currency
      const price = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(row.original.price))

      return <span>{price}</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      let statusColor = ""

      if (status === "Disponível") {
        statusColor = "text-green-500 dark:text-green-400"
      } else if (status === "Vendido") {
        statusColor = "text-blue-500 dark:text-blue-400"
      } else {
        statusColor = "text-yellow-500 dark:text-yellow-400"
      }

      return (
        <Badge variant="outline" className={`px-1.5 ${statusColor}`}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
            <MoreVerticalIcon />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <ScheduleVisitButton property={row.original} />
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem>Marcar como vendido</DropdownMenuItem>
          <DropdownMenuItem>Ver histórico de visitas</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={async () => {
              if (confirm(`Tem certeza que deseja excluir o imóvel ${row.original.code}?`)) {
                const result = await deleteProperty(row.original.id)
                if (result.success) {
                  toast.success("Imóvel excluído com sucesso!")
                } else {
                  toast.error("Erro ao excluir imóvel")
                }
              }
            }}
          >
            Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function PropertiesTable({
  initialData,
}: {
  initialData: Property[]
}) {
  const [data, setData] = React.useState<Property[]>(initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [statusFilter, setStatusFilter] = React.useState("todos")

  const table = useReactTable({
    data,
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

  const handleRefresh = async () => {
    toast.promise(
      (async () => {
        const result = await getProperties(statusFilter)
        if (result.success) {
          setData(result.data)
          return true
        } else {
          throw new Error(result.error)
        }
      })(),
      {
        loading: "Atualizando lista de imóveis...",
        success: "Lista de imóveis atualizada com sucesso!",
        error: "Erro ao atualizar lista de imóveis",
      },
    )
  }

  // Atualizar dados quando o filtro de status mudar
  React.useEffect(() => {
    const fetchData = async () => {
      const result = await getProperties(statusFilter)
      if (result.success) {
        setData(result.data)
      }
    }

    fetchData()
  }, [statusFilter])

  return (
    <Tabs defaultValue="todos" className="flex w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          Visualização
        </Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="@4xl/main:hidden flex w-fit" id="view-selector">
            <SelectValue placeholder="Selecione uma visualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Imóveis</SelectItem>
            <SelectItem value="Disponível">Disponíveis</SelectItem>
            <SelectItem value="Vendido">Vendidos</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="@4xl/main:flex hidden">
          <TabsTrigger value="todos" onClick={() => setStatusFilter("todos")}>
            Todos os Imóveis
          </TabsTrigger>
          <TabsTrigger value="disponiveis" className="gap-1" onClick={() => setStatusFilter("Disponível")}>
            Disponíveis{" "}
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {data.filter((item) => item.status === "Disponível").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="vendidos" className="gap-1" onClick={() => setStatusFilter("Vendido")}>
            Vendidos{" "}
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {data.filter((item) => item.status === "Vendido").length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCcwIcon className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Atualizar</span>
          </Button>
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
          <ScheduleVisitButton />
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
      </div>
    </Tabs>
  )
}

function TableCellViewer({ item }: { item: Property }) {
  const [property, setProperty] = React.useState(item)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const result = await updateProperty(property.id, formData)
    if (result.success) {
      setProperty(result.data)
      toast.success("Imóvel atualizado com sucesso!")
    } else {
      toast.error("Erro ao atualizar imóvel")
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {property.address}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader className="gap-1">
          <SheetTitle>Detalhes do Imóvel</SheetTitle>
          <SheetDescription>Informações sobre o imóvel</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              <Label htmlFor="code">Código</Label>
              <Input id="code" name="code" defaultValue={property.code} />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" defaultValue={property.address} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Tipo</Label>
                <Select defaultValue={property.type} name="type">
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartamento">Apartamento</SelectItem>
                    <SelectItem value="Casa">Casa</SelectItem>
                    <SelectItem value="Cobertura">Cobertura</SelectItem>
                    <SelectItem value="Sala Comercial">Sala Comercial</SelectItem>
                    <SelectItem value="Terreno">Terreno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={property.status} name="status">
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Vendido">Vendido</SelectItem>
                    <SelectItem value="Reservado">Reservado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="area">Área (m²)</Label>
                <Input id="area" name="area" defaultValue={property.area} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input id="price" name="price" defaultValue={property.price} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" name="description" defaultValue={property.description} />
            </div>

            <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
              <Button type="submit" className="w-full">
                Salvar Alterações
              </Button>
              <SheetClose asChild>
                <Button variant="outline" className="w-full" type="button">
                  Fechar
                </Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ScheduleVisitButton({ property }: { property?: Property }) {
  const [agents, setAgents] = React.useState([
    { id: 1, name: "Carlos Silva" },
    { id: 2, name: "Ana Beatriz" },
    { id: 3, name: "Roberto Almeida" },
  ])

  const [loading, setLoading] = React.useState(false)

  // Carregar agentes do banco de dados
  React.useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/agents?status=ativos")
        if (response.ok) {
          const data = await response.json()
          setAgents(data)
        }
      } catch (error) {
        console.error("Error fetching agents:", error)
      }
    }

    fetchAgents()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const form = event.currentTarget
      const formData = new FormData(form)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: property ? property.id : formData.get("property"),
          agent_id: formData.get("agent"),
          client_name: formData.get("client_name"),
          client_phone: formData.get("client_phone"),
          client_email: formData.get("client_email"),
          scheduled_date: formData.get("date"),
          scheduled_time: formData.get("time"),
          status: "Agendada",
          feedback: formData.get("notes") || "",
        }),
      })

      if (response.ok) {
        toast.success("Visita agendada com sucesso!")
        form.reset()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Erro ao agendar visita")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao agendar visita")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {property ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Agendar Visita
          </DropdownMenuItem>
        ) : (
          <Button variant="outline" size="sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Agendar Visita</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader className="gap-1">
          <SheetTitle>Agendar Visita</SheetTitle>
          <SheetDescription>Preencha os dados para agendar uma visita</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {!property && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="property">Imóvel</Label>
                <Select name="property" required>
                  <SelectTrigger id="property" className="w-full">
                    <SelectValue placeholder="Selecione um imóvel" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Aqui você pode carregar os imóveis do banco de dados */}
                    <SelectItem value="1">AP001 - Rua das Flores, 123</SelectItem>
                    <SelectItem value="2">CS002 - Av. Principal, 456</SelectItem>
                    <SelectItem value="3">AP003 - Rua dos Ipês, 789</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {property && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="property">Imóvel</Label>
                <Input id="property" value={`${property.code} - ${property.address}`} readOnly />
                <input type="hidden" name="property" value={property.id} />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Label htmlFor="agent">Corretor</Label>
              <Select name="agent" required>
                <SelectTrigger id="agent" className="w-full">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="time">Hora</Label>
                <Input id="time" name="time" type="time" required />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="client_name">Nome do Cliente</Label>
              <Input id="client_name" name="client_name" placeholder="Nome completo" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="client_phone">Telefone</Label>
                <Input id="client_phone" name="client_phone" placeholder="(00) 00000-0000" required />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="client_email">Email</Label>
                <Input id="client_email" name="client_email" type="email" placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" name="notes" placeholder="Informações adicionais sobre a visita" />
            </div>
            <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Agendando..." : "Agendar Visita"}
              </Button>
              <SheetClose asChild>
                <Button variant="outline" className="w-full" type="button">
                  Cancelar
                </Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

