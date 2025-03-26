import { AgentsTable } from "@/components/agents-table"
import { Suspense } from "react"
import { getAgents } from "@/lib/db/agents"

// export type Agent = z.infer<typeof schema>

export default async function AgentsPage() {
  const agents = await getAgents()

  return (

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Suspense fallback={<div>Loading...</div>}>
                <AgentsTable data={agents} />
              </Suspense>
            </div>
          </div>
        </div>
  )
}

