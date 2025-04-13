import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

export type Calling = Database["public"]["Tables"]["callings"]["Row"]
export type CallingInsert = Database["public"]["Tables"]["callings"]["Insert"]
export type CallingUpdate = Database["public"]["Tables"]["callings"]["Update"]

// Get all callings
export async function getCallings() {
  const { data, error } = await supabase
    .from("callings")
    .select(`
      *,
      member:member_id(id, name)
    `)
    .order("organization")
    .order("title")

  if (error) {
    console.error("Error fetching callings:", error)
    throw error
  }

  return data || []
}

// Get a calling by ID
export async function getCallingById(id: string) {
  const { data, error } = await supabase
    .from("callings")
    .select(`
      *,
      member:member_id(id, name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching calling with ID ${id}:`, error)
    throw error
  }

  return data
}

// Create a new calling
export async function createCalling(calling: CallingInsert) {
  const { data, error } = await supabase
    .from("callings")
    .insert([
      {
        ...calling,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating calling:", error)
    throw error
  }

  return data
}

// Update a calling
export async function updateCalling(id: string, calling: CallingUpdate) {
  const { data, error } = await supabase
    .from("callings")
    .update({
      ...calling,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating calling with ID ${id}:`, error)
    throw error
  }

  return data
}

// Delete a calling
export async function deleteCalling(id: string) {
  const { error } = await supabase.from("callings").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting calling with ID ${id}:`, error)
    throw error
  }

  return true
}

// Assign a member to a calling
export async function assignMemberToCalling(callingId: string, memberId: string) {
  const { data, error } = await supabase
    .from("callings")
    .update({
      member_id: memberId,
      status: "filled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", callingId)
    .select()
    .single()

  if (error) {
    console.error(`Error assigning member to calling:`, error)
    throw error
  }

  return data
}

// Release a member from a calling
export async function releaseMemberFromCalling(callingId: string) {
  const { data, error } = await supabase
    .from("callings")
    .update({
      member_id: null,
      status: "vacant",
      sustained_date: null,
      is_set_apart: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", callingId)
    .select()
    .single()

  if (error) {
    console.error(`Error releasing member from calling:`, error)
    throw error
  }

  return data
}

// Get vacant callings
export async function getVacantCallings() {
  const { data, error } = await supabase
    .from("callings")
    .select("*")
    .eq("status", "vacant")
    .order("organization")
    .order("title")

  if (error) {
    console.error("Error fetching vacant callings:", error)
    throw error
  }

  return data || []
}
