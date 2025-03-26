import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createVisit } from "@/lib/actions"
import { AgentSelect } from "@/components/agent-select"

const formSchema = z.object({
  client_name: z.string().min(1, "Nome é obrigatório"),
  client_phone: z.string().min(1, "Telefone é obrigatório"),
  client_email: z.string().email("Email inválido"),
  agent_id: z.string().min(1, "Corretor é obrigatório"),
  notes: z.string().optional(),
  visit_date: z.string().min(1, "Data é obrigatória"),
  visit_time: z.string().min(1, "Hora é obrigatória"),
  status: z.string().min(1, "Status é obrigatório"),
})

interface ScheduleVisitFormProps {
  propertyId: number
  onSuccess?: () => void
}

export function ScheduleVisitForm({ propertyId, onSuccess }: ScheduleVisitFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: "",
      client_phone: "",
      client_email: "",
      agent_id: "",
      notes: "",
      visit_date: "",
      visit_time: "",
      status: "Agendada",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const formData = new FormData()
      formData.append("property_codigo", propertyId.toString())
      formData.append("agent_id", values.agent_id)
      formData.append("client_name", values.client_name)
      formData.append("client_phone", values.client_phone)
      formData.append("client_email", values.client_email)
      formData.append("scheduled_date", values.visit_date)
      formData.append("scheduled_time", values.visit_time)
      formData.append("feedback", values.notes || "")
      formData.append("status", "Agendada")

      const result = await createVisit(formData)

      if (result.success) {
        toast.success("Visita agendada com sucesso!")
        form.reset()
        onSuccess?.()
      } else {
        toast.error(result.error || "Erro ao agendar visita")
      }
    } catch (error) {
      console.error("Error creating visit:", error)
      toast.error("Erro ao agendar visita")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agent_id"
          render={({ field }) => (
            <FormItem>
              <AgentSelect field={field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="visit_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visit_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora</FormLabel>
                <FormControl>
                  <Input {...field} type="time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Agendar Visita
        </Button>
      </form>
    </Form>
  )
} 