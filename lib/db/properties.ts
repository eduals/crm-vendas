import { query } from "@/lib/db"
import { getImoveis, type ArboImovel } from "@/lib/arbo-api"

export async function syncProperties() {
  try {
    console.log('syncProperties')
    // Step 1: Get all properties from Arbo API
    const arboProperties = await getAllArboProperties()
    
    // Step 2: Get existing properties from our database
    const existingProperties = await query(
      "SELECT id, code, status FROM properties"
    )
    const existingCodes = new Map(
      existingProperties.rows.map(p => [p.code, { id: p.id, status: p.status }])
    )
    
    // Step 3: Prepare batch operations
    const newProperties = []
    const updateProperties = []
    const arboPropertyCodes = new Set()
    
    for (const arboProperty of arboProperties) {
      arboPropertyCodes.add(arboProperty.codigo)
      
      const propertyData = {
        code: arboProperty.codigo,
        address: `${arboProperty.end_logradouro}, ${arboProperty.end_numero} - ${arboProperty.end_bairro}, ${arboProperty.end_cidade}/${arboProperty.end_estado}`,
        type: arboProperty.tipo_imovel,
        area: arboProperty.area_total,
        price: arboProperty.valor_venda,
        description: arboProperty.descricao,
        status: arboProperty.ativo ? 'Disponível' : 'Indisponível',
        data: arboProperty
      }
      
      if (!existingCodes.has(arboProperty.codigo)) {
        newProperties.push(propertyData)
      } else {
        updateProperties.push({
          ...propertyData,
          id: existingCodes.get(arboProperty.codigo)!.id
        })
      }
    }
    
    // Step 4: Mark properties not in Arbo as unavailable
    const unavailableProperties = Array.from(existingCodes.entries())
      .filter(([code]) => !arboPropertyCodes.has(code))
      .map(([_, { id }]) => id)
    
    // Step 5: Execute batch operations
    const results = await Promise.all([
      // Insert new properties
      newProperties.length > 0 
        ? query(
            `INSERT INTO properties 
             (code, address, type, area, price, description, status, data) 
             VALUES ${newProperties.map((_, i) => 
               `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`
             ).join(', ')}`,
            newProperties.flatMap(p => [
              p.code, p.address, p.type, p.area, p.price, p.description, p.status, p.data
            ])
          )
        : Promise.resolve(),
        
      // Update existing properties
      ...updateProperties.map(p =>
        query(
          `UPDATE properties 
           SET address = $1, type = $2, area = $3, price = $4, 
               description = $5, status = $6, data = $7, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $8`,
          [p.address, p.type, p.area, p.price, p.description, p.status, p.data, p.id]
        )
      ),
      
      // Mark unavailable properties
      unavailableProperties.length > 0
        ? query(
            `UPDATE properties 
             SET status = 'Indisponível', updated_at = CURRENT_TIMESTAMP 
             WHERE id = ANY($1)`,
            [unavailableProperties]
          )
        : Promise.resolve()
    ])
    
    return {
      added: newProperties.length,
      updated: updateProperties.length,
      unavailable: unavailableProperties.length
    }
  } catch (error) {
    console.error("Error syncing properties:", error)
    throw new Error("Failed to sync properties")
  }
}

async function getAllArboProperties(): Promise<ArboImovel[]> {
  const properties: ArboImovel[] = []
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const response = await getImoveis({ page, perPage: 100 })
    properties.push(...response.data)
    hasMore = page < response.lastPage
    page++
  }
  
  return properties
}

export async function migrateVisits() {
  try {
    // Get all visits with property_codigo
    const visits = await query(
      "SELECT id, property_codigo FROM visits WHERE property_id IS NULL"
    )
    
    if (visits.rows.length === 0) {
      return { migrated: 0 }
    }
    
    // Get property IDs by code
    const properties = await query(
      "SELECT id, code FROM properties"
    )
    const propertyIdsByCode = new Map(
      properties.rows.map(p => [p.code, p.id])
    )
    
    // Update visits with property_id
    const updates = visits.rows.map(visit => {
      const propertyId = propertyIdsByCode.get(visit.property_codigo)
      if (!propertyId) return null
      
      return query(
        "UPDATE visits SET property_id = $1 WHERE id = $2",
        [propertyId, visit.id]
      )
    }).filter(Boolean)
    
    await Promise.all(updates)
    
    return { migrated: updates.length }
  } catch (error) {
    console.error("Error migrating visits:", error)
    throw new Error("Failed to migrate visits")
  }
} 