import { NextResponse } from "next/server"
import { syncProperties } from "@/lib/db/properties"
import { revalidatePath } from "next/cache"

export async function POST() {
  try {
    const result = await syncProperties()
    // Revalidate the properties page to show updated data
    revalidatePath("/properties")
    
    return NextResponse.json({
      success: true,
      message: "Properties synchronized successfully",
      stats: result
    })
  } catch (error) {
    console.error("Error in refresh endpoint:", error)
    return NextResponse.json(
      { success: false, error: "Failed to sync properties" },
      { status: 500 }
    )
  }
} 