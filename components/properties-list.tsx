"use client"

import * as React from "react"
import { BuildingIcon, HomeIcon, MapPinIcon, SearchIcon, SquareIcon } from "lucide-react"
import { toast } from "sonner"
import type { ArboImovel } from "@/lib/arbo-api"
import { getArboImoveis } from "@/lib/actions"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import { ScheduleVisitForm } from "@/components/schedule-visit-form"

export function PropertiesList({
  initialData,
}: {
  initialData: ArboImovel[]
}) {
  const [properties, setProperties] = React.useState<ArboImovel[]>(initialData)
  const [filteredProperties, setFilteredProperties] = React.useState<ArboImovel[]>(initialData)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [finalidadeFilter, setFinalidadeFilter] = React.useState("todas")
  const [categoriaFilter, setCategoriaFilter] = React.useState("todas")
  const [loading, setLoading] = React.useState(false)

  // Filtrar propriedades quando os filtros mudarem
  React.useEffect(() => {
    let filtered = properties

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (property) =>
          property.codigo.toLowerCase().includes(term) ||
          property.descricao?.toLowerCase().includes(term) ||
          property.end_logradouro?.toLowerCase().includes(term) ||
          property.end_bairro?.toLowerCase().includes(term) ||
          property.end_cidade?.toLowerCase().includes(term),
      )
    }

    // Filtrar por finalidade
    if (finalidadeFilter !== "todas") {
      filtered = filtered.filter((property) => property.finalidade === finalidadeFilter)
    }

    // Filtrar por categoria
    if (categoriaFilter !== "todas") {
      filtered = filtered.filter((property) => property.categoria === categoriaFilter)
    }

    setFilteredProperties(filtered)
  }, [properties, searchTerm, finalidadeFilter, categoriaFilter])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const result = await getArboImoveis({
        perPage: 50
      })
      
      if (result.success) {
        setProperties(result.data)
        toast.success("Lista de imóveis atualizada com sucesso!")
      } else {
        throw new Error(result.error || "Erro ao buscar imóveis")
      }
    } catch (error) {
      toast.error("Erro ao atualizar lista de imóveis")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Obter categorias únicas
  const categorias = React.useMemo(() => {
    const uniqueCategorias = new Set<string>()
    for (const property of properties) {
      if (property.categoria) {
        uniqueCategorias.add(property.categoria)
      }
    }
    return Array.from(uniqueCategorias).sort()
  }, [properties])

  // Obter finalidades únicas
  const finalidades = React.useMemo(() => {
    const uniqueFinalidades = new Set<string>()
    for (const property of properties) {
      if (property.finalidade) {
        uniqueFinalidades.add(property.finalidade)
      }
    }
    return Array.from(uniqueFinalidades).sort()
  }, [properties])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Imóveis</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar Imóveis"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por código, endereço..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="finalidade">Finalidade</Label>
            <Select value={finalidadeFilter} onValueChange={setFinalidadeFilter}>
              <SelectTrigger id="finalidade">
                <SelectValue placeholder="Todas as finalidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as finalidades</SelectItem>
                {finalidades.map((finalidade) => (
                  <SelectItem key={finalidade} value={finalidade}>
                    {finalidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="grid" className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">Grade</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          <div className="text-sm text-muted-foreground">{filteredProperties.length} imóveis encontrados</div>
        </div>

        <TabsContent value="grid" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.codigo} property={property} />
            ))}
          </div>

          {filteredProperties.length === 0 && (
            <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
              <div className="flex flex-col items-center gap-2 text-center">
                <HomeIcon className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Nenhum imóvel encontrado</h3>
                <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo.</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="flex flex-col gap-4">
            {filteredProperties.map((property) => (
              <PropertyListItem key={property.codigo} property={property} />
            ))}
          </div>

          {filteredProperties.length === 0 && (
            <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
              <div className="flex flex-col items-center gap-2 text-center">
                <HomeIcon className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Nenhum imóvel encontrado</h3>
                <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo.</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PropertyCard({ property }: { property: ArboImovel }) {
  const mainPhoto =
    property.fotos?.find((foto) => foto.principal)?.url ||
    property.fotos?.[0]?.url ||
    "/placeholder.svg?height=200&width=300"

  const endereco = [property.end_logradouro, property.end_bairro, property.end_cidade, property.end_estado]
    .filter(Boolean)
    .join(", ")

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={mainPhoto || "/placeholder.svg"}
          alt={property.descricao || property.codigo}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="px-2 py-1">
            {property.finalidade}
          </Badge>
          <Badge variant="outline" className="px-2 py-1">
            {property.categoria}
          </Badge>
        </div>
        <CardTitle className="line-clamp-1 text-lg">{property.codigo}</CardTitle>
        <CardDescription className="line-clamp-2">{endereco}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 p-4 pt-0 text-sm">
        <div className="flex flex-col items-center gap-1">
          <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          <span>{property.qtd_quartos || 0} Quartos</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <HomeIcon className="h-4 w-4 text-muted-foreground" />
          <span>{property.qtd_suites || 0} Suítes</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <SquareIcon className="h-4 w-4 text-muted-foreground" />
          <span>{property.area_total || 0} m²</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div className="font-semibold">
          {property.finalidade === "Venda"
            ? formatCurrency(property.valor_venda)
            : formatCurrency(property.valor_aluguel)}
        </div>
        <ScheduleVisitButton propertyId={property.codigo} />
      </CardFooter>
    </Card>
  )
}

function PropertyListItem({ property }: { property: ArboImovel }) {
  const mainPhoto =
    property.fotos?.find((foto) => foto.principal)?.url ||
    property.fotos?.[0]?.url ||
    "/placeholder.svg?height=100&width=100"

  const endereco = [property.end_logradouro, property.end_bairro, property.end_cidade, property.end_estado]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border sm:flex-row">
      <div className="aspect-video h-48 w-full overflow-hidden sm:h-auto sm:w-48">
        <img
          src={mainPhoto || "/placeholder.svg"}
          alt={property.descricao || property.codigo}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className="px-2 py-1">
            {property.finalidade}
          </Badge>
          <Badge variant="outline" className="px-2 py-1">
            {property.categoria}
          </Badge>
          <span className="ml-auto font-semibold">
            {property.finalidade === "Venda"
              ? formatCurrency(property.valor_venda)
              : formatCurrency(property.valor_aluguel)}
          </span>
        </div>
        <h3 className="text-lg font-semibold">{property.codigo}</h3>
        <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">
          <MapPinIcon className="mr-1 inline-block h-4 w-4" />
          {endereco}
        </p>
        <p className="mb-4 line-clamp-2 text-sm">{property.descricao}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <BuildingIcon className="h-4 w-4 text-muted-foreground" />
              <span>{property.qtd_quartos || 0} Quartos</span>
            </div>
            <div className="flex items-center gap-1">
              <HomeIcon className="h-4 w-4 text-muted-foreground" />
              <span>{property.qtd_suites || 0} Suítes</span>
            </div>
            <div className="flex items-center gap-1">
              <SquareIcon className="h-4 w-4 text-muted-foreground" />
              <span>{property.area_total || 0} m²</span>
            </div>
          </div>
          <ScheduleVisitButton propertyId={property.codigo} />
        </div>
      </div>
    </div>
  )
}

interface ScheduleVisitButtonProps {
  propertyId: number
}

function ScheduleVisitButton({ propertyId }: ScheduleVisitButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Agendar Visita
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Agendar Visita</SheetTitle>
          <SheetDescription>
            Preencha os dados abaixo para agendar uma visita.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <ScheduleVisitForm 
            propertyId={propertyId} 
            onSuccess={() => setIsOpen(false)} 
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

