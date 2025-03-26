import type { ReactNode } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ 
  title, 
  description, 
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`flex h-full flex-col items-center justify-center p-6 text-center ${className}`}>
      <CardHeader className="items-center space-y-2 p-0">
        <CardTitle className="text-lg font-semibold tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </Card>
  )
}
