export interface Visit {
  id: number
  property_id: number
  client_name: string
  client_phone: string
  client_email?: string
  scheduled_date: string
  scheduled_time: string
  status: string
  feedback?: string
  created_at: string
  agent_id: number
  agent_name: string
  property: {
    codigo: string
    titulo: string
    fotos: Array<{
      url: string
      principal: boolean
      sizes: {
        small: string
        medium: string
      }
    }>
    valor_venda?: string
    end_cidade?: string
    end_bairro?: string
    categoria?: string
  }
}
