// import { getBaseUrl } from '@/lib/env'

export async function fetchMetrics() {
  try {
    // const baseUrl = getBaseUrl()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    console.log('baseUrl', baseUrl)
    const url = `${baseUrl}/api/metrics`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 }, // Disable cache for debugging
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching metrics:', error)
    throw error
  }
}