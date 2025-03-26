"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ClockIcon,
  UserIcon,
  MoreHorizontal,
  Pencil,
  Calendar,
  X,
  MessageSquare,
  FileText,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"

import { useIsMobile } from "@/hooks/use-mobile"
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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScheduleVisitButton } from "@/components/schedule-visit-button"

const schema = z.object({
  id: z.string(),
  property_id: z.string(),
  agent_id: z.string(),
  agent_name: z.string(),
  status: z.string(),
  scheduled_date: z.string(),
  scheduled_time: z.string(),
  client_name: z.string(),
  client_phone: z.string(),
  client_email: z.string(),
  feedback: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Visit = z.infer<typeof schema>

const columns: ColumnDef<Visit>[] = [
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
    accessorKey: "property_id",
    header: "Código",
    cell: ({ row }) => {
      const [isOpen, setIsOpen] = React.useState(false)
      
      return (
        <>
          <Button variant="link" className="w-fit px-0 text-left text-foreground" onClick={() => setIsOpen(true)}>
            {row.original.property_id}
          </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent side="right" className="flex flex-col">
              <TableCellViewer item={row.original} onClose={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
        </>
      )
    },
  },
  // {
  //   accessorKey: "property_address",
  //   header: "Endereço",
  //   cell: ({ row }) => {
  //     return <TableCellViewer item={row.original} />
  //   },
  //   enableHiding: false,
  // },
  {
    accessorKey: "agent_name",
    header: "Corretor",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <UserIcon className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.agent_name}</span>
      </div>
    ),
  },
  {
    accessorKey: "scheduled_date",
    header: "Data",
    cell: ({ row }) => {
      const date = new Date(row.getValue("scheduled_date"))
      const formatted = new Intl.DateTimeFormat("pt-BR").format(date)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "scheduled_time",
    header: "Hora",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ClockIcon className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.scheduled_time}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "Agendada"
              ? "default"
              : status === "Realizada"
              ? "default"
              : status === "Cancelada"
              ? "destructive"
              : status === "Negociação"
              ? "secondary"
              : status === "Proposta"
              ? "secondary"
              : status === "Finalizada"
              ? "outline"
              : "default"
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "client_name",
    header: "Cliente",
    cell: ({ row }) => row.original.client_name,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const item = row.original
      const [isLoading, setIsLoading] = React.useState(false)
      const [isOpen, setIsOpen] = React.useState(false)
      const { onVisitUpdate } = table.options.meta as { onVisitUpdate?: () => void }

      const handleUpdateStatus = async (status: string) => {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/visits/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
          
          if (!response.ok) throw new Error("Failed to update visit")
          
          toast.success("Visita atualizada com sucesso!")
          window.location.reload()
        } catch (error) {
          toast.error("Erro ao atualizar visita")
        } finally {
          setIsLoading(false)
        }
      }

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setIsOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {item.status === "Agendada" && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      const alert = document.querySelector(
                        `button[data-alert-id="${item.id}"]`
                      )
                      if (alert) {
                        ;(alert as HTMLButtonElement).click()
                      }
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Reagendar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleUpdateStatus("Cancelada")}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                </>
              )}
              {item.status === "Realizada" && (
                <>
                  <DropdownMenuItem onClick={() => handleUpdateStatus("Negociação")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Em Negociação
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateStatus("Proposta")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Proposta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateStatus("Finalizada")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalizada
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent side="right" className="flex flex-col">
              <TableCellViewer item={item} onClose={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
          <RescheduleAlert item={item} onUpdate={onVisitUpdate} />
        </>
      )
    },
  },
]

interface DataTableProps {
  data: Visit[]
  onVisitUpdate?: () => void
}

export function DataTableVisits({ data, onVisitUpdate }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [statusFilter, setStatusFilter] = React.useState<string>("todas")

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      onVisitUpdate,
    },
  })
  // Aplicar filtro de status
  React.useEffect(() => {
    if (statusFilter === "todas") {
      table.getColumn("status")?.setFilterValue(undefined)
    } else {
      table.getColumn("status")?.setFilterValue(statusFilter)
    }
  }, [statusFilter, table])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            Status:
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" id="status-filter">
              <SelectValue placeholder="Todas as visitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as visitas</SelectItem>
              <SelectItem value="Agendada">Agendadas</SelectItem>
              <SelectItem value="Realizada">Realizadas</SelectItem>
              <SelectItem value="Cancelada">Canceladas</SelectItem>
              <SelectItem value="Negociação">Em negociação</SelectItem>
              <SelectItem value="Proposta">Com proposta</SelectItem>
              <SelectItem value="Finalizada">Finalizadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Filtrar por cliente..."
          value={(table.getColumn("client_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("client_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Colunas <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}

function TableCellViewer({ item, onClose, onUpdate }: { item: Visit; onClose?: () => void; onUpdate?: () => void }) {
  const isMobile = useIsMobile()
  const [isLoading, setIsLoading] = React.useState(false)

  // Função para formatar a data
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "yyyy-MM-dd")
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(event.currentTarget)
    const data = {
      property_id: item.property_id,
      agent_id: item.agent_id,
      agent_name: item.agent_name,
      status: String(formData.get("status") || ""),
      scheduled_date: String(formData.get("scheduled_date") || ""),
      scheduled_time: String(formData.get("scheduled_time") || ""),
      client_name: String(formData.get("client_name") || ""),
      client_phone: String(formData.get("client_phone") || ""),
      client_email: String(formData.get("client_email") || ""),
      feedback: String(formData.get("feedback") || ""),
    }

    try {
      console.log('vai enviar o put data', data)
      const response = await fetch(`/api/visits/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error("Failed to update visit")
      
      toast.success("Visita atualizada com sucesso!")
      onClose?.()
      onUpdate?.()
    } catch (error) {
      toast.error("Erro ao atualizar visita")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SheetHeader className="gap-1">
        <SheetTitle>Detalhes da Visita</SheetTitle>
        <SheetDescription>Informações sobre a visita agendada</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSave} className="flex flex-1 flex-col gap-4">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          <div className="flex flex-col gap-3">
            <Label htmlFor="property_id">Código do Imóvel</Label>
            <Input id="property_id" value={item.property_id} readOnly />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="agent_name">Corretor</Label>
              <Input id="agent_name" value={item.agent_name} readOnly />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={item.status}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agendada">Agendada</SelectItem>
                  <SelectItem value="Realizada">Realizada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                  <SelectItem value="Negociação">Negociação</SelectItem>
                  <SelectItem value="Proposta">Proposta</SelectItem>
                  <SelectItem value="Finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="scheduled_date">Data</Label>
              <Input
                id="scheduled_date"
                name="scheduled_date"
                type="date"
                defaultValue={formatDateForInput(item.scheduled_date)}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="scheduled_time">Hora</Label>
              <Input
                id="scheduled_time"
                name="scheduled_time"
                type="time"
                defaultValue={item.scheduled_time}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="client_name">Nome do Cliente</Label>
            <Input
              id="client_name"
              name="client_name"
              defaultValue={item.client_name}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="client_phone">Telefone</Label>
              <Input
                id="client_phone"
                name="client_phone"
                defaultValue={item.client_phone}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="client_email">Email</Label>
              <Input
                id="client_email"
                name="client_email"
                type="email"
                defaultValue={item.client_email}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="feedback">Feedback</Label>
            <Input
              id="feedback"
              name="feedback"
              defaultValue={item.feedback || ""}
            />
          </div>
        </div>
        <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Fechar
            </Button>
          </SheetClose>
        </SheetFooter>
      </form>
    </>
  )
}

function RescheduleAlert({ item, onUpdate }: { item: Visit; onUpdate?: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "yyyy-MM-dd")
  }

  const handleReschedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(event.currentTarget)
    const data = {
      property_id: item.property_id,
      agent_id: item.agent_id,
      agent_name: item.agent_name,
      scheduled_date: String(formData.get("scheduled_date") || ""),
      scheduled_time: String(formData.get("scheduled_time") || ""),
    }

    try {
      const response = await fetch(`/api/visits/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error("Failed to update visit")
      
      toast.success("Visita reagendada com sucesso!")
      setIsOpen(false)
      onUpdate?.()
    } catch (error) {
      toast.error("Erro ao reagendar visita")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="hidden"
          data-alert-id={item.id}
          onClick={() => setIsOpen(true)}
        >
          Reagendar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reagendar Visita</AlertDialogTitle>
          <AlertDialogDescription>
            Selecione a nova data e horário para a visita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleReschedule}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="scheduled_date">Nova Data</Label>
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="date"
                  defaultValue={formatDateForInput(item.scheduled_date)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="scheduled_time">Novo Horário</Label>
                <Input
                  id="scheduled_time"
                  name="scheduled_time"
                  type="time"
                  defaultValue={item.scheduled_time}
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

