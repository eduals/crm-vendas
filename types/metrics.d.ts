export interface DashboardMetrics {
  visits: {
    total: number
    withProposals: number
    monthlyChange: number
  }
  brokers: {
    total: number
    monthlyChange: number
  }
  properties: {
    total: number
    monthlyChange: number
  }
}
