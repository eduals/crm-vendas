import { SiteHeader } from "../../components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getArboImoveis } from "@/lib/actions"
import { PropertiesList } from "@/components/properties-list"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Loading skeleton for the properties list
function PropertiesListSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`filter-skeleton-${i}`} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-5 w-32" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`card-skeleton-${i}`} className="rounded-lg border bg-card">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="mt-3 h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-full" />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

async function PropertiesContent() {
  // Nunca fazer refresh automático durante o build ou SSR
  const result = await getArboImoveis({
    perPage: 50,
    skipRefresh: true, // Mantido por compatibilidade
    forceRefresh: false, // Garantimos que nunca fará refresh automático
    fields: [
      "codigo",
      "descricao",
      "categoria",
      "finalidade",
      "end_logradouro",
      "end_bairro",
      "end_cidade",
      "end_estado",
      "area_total",
      "valor_venda",
      "valor_aluguel",
      "qtd_quartos",
      "qtd_suites",
      "qtd_vagas",
      "fotos",
    ],
  })

  // Tratamento seguro para evitar erro de tipagem
  const properties = result.success && 'data' in result ? result.data : [];
  
  return <PropertiesList initialData={properties} />
}

export default function PropertiesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Suspense fallback={<PropertiesListSkeleton />}>
            <PropertiesContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

