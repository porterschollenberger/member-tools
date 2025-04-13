import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

export type Member = Database["public"]["Tables"]["members"]["Row"]
export type MemberInsert = Database["public"]["Tables"]["members"]["Insert"]
export type MemberUpdate = Database["public"]["Tables"]["members"]["Update"]

// Get all members
export async function getMembers() {
  const { data, error } = await supabase
    .from("members")
    .select(`
      *,
      fhe_groups:fhe_group_id(id, name),
      callings:callings(id, title, organization)
    `)
    .order("name")

  if (error) {
    console.error("Error fetching members:", error)
    throw error
  }

  return data || []
}

// Get a member by ID
export async function getMemberById(id: string) {
  const { data, error } = await supabase
    .from("members")
    .select(`
      *,
      fhe_groups:fhe_group_id(id, name),
      callings:callings(id, title, organization)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching member with ID ${id}:`, error)
    throw error
  }

  return data
}

// Create a new member
export async function createMember(member: MemberInsert) {
  const { data, error } = await supabase
    .from("members")
    .insert([
      {
        ...member,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating member:", error)
    throw error
  }

  return data
}

// Update a member
export async function updateMember(id: string, member: MemberUpdate) {
  const { data, error } = await supabase
    .from("members")
    .update({
      ...member,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating member with ID ${id}:`, error)
    throw error
  }

  return data
}

// Delete a member
export async function deleteMember(id: string) {
  const { error } = await supabase.from("members").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting member with ID ${id}:`, error)
    throw error
  }

  return true
}

// Get unassigned members (not in any FHE group)
export async function getUnassignedMembers() {
  const { data, error } = await supabase.from("members").select("*").is("fhe_group_id", null).order("name")

  if (error) {
    console.error("Error fetching unassigned members:", error)
    throw error
  }

  return data || []
}
