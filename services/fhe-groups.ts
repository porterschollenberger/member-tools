import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

export type FheGroup = Database["public"]["Tables"]["fhe_groups"]["Row"]
export type FheGroupInsert = Database["public"]["Tables"]["fhe_groups"]["Insert"]
export type FheGroupUpdate = Database["public"]["Tables"]["fhe_groups"]["Update"]

// Get all FHE groups with members
export async function getFheGroups() {
  const { data, error } = await supabase
    .from("fhe_groups")
    .select(`
      *,
      leader:leader_id(id, name),
      members:members(id, name, email, phone)
    `)
    .order("name")

  if (error) {
    console.error("Error fetching FHE groups:", error)
    throw error
  }

  return data || []
}

// Get an FHE group by ID
export async function getFheGroupById(id: string) {
  const { data, error } = await supabase
    .from("fhe_groups")
    .select(`
      *,
      leader:leader_id(id, name),
      members:members(id, name, email, phone)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching FHE group with ID ${id}:`, error)
    throw error
  }

  return data
}

// Create a new FHE group
export async function createFheGroup(group: FheGroupInsert) {
  const { data, error } = await supabase
    .from("fhe_groups")
    .insert([
      {
        ...group,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating FHE group:", error)
    throw error
  }

  return data
}

// Update an FHE group
export async function updateFheGroup(id: string, group: FheGroupUpdate) {
  const { data, error } = await supabase
    .from("fhe_groups")
    .update({
      ...group,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating FHE group with ID ${id}:`, error)
    throw error
  }

  return data
}

// Delete an FHE group
export async function deleteFheGroup(id: string) {
  // First, unassign all members from this group
  await supabase.from("members").update({ fhe_group_id: null }).eq("fhe_group_id", id)

  // Then delete the group
  const { error } = await supabase.from("fhe_groups").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting FHE group with ID ${id}:`, error)
    throw error
  }

  return true
}

// Assign a member to an FHE group
export async function assignMemberToFheGroup(memberId: string, groupId: string) {
  const { data, error } = await supabase
    .from("members")
    .update({
      fhe_group_id: groupId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .select()
    .single()

  if (error) {
    console.error(`Error assigning member to FHE group:`, error)
    throw error
  }

  return data
}

// Remove a member from an FHE group
export async function removeMemberFromFheGroup(memberId: string) {
  const { data, error } = await supabase
    .from("members")
    .update({
      fhe_group_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .select()
    .single()

  if (error) {
    console.error(`Error removing member from FHE group:`, error)
    throw error
  }

  return data
}

// Upload an activity image for an FHE group
export async function uploadFheGroupImage(groupId: string, file: File) {
  const fileExt = file.name.split(".").pop()
  const fileName = `${groupId}-${Date.now()}.${fileExt}`
  const filePath = `fhe-groups/${fileName}`

  // Upload the file to Supabase Storage
  const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file)

  if (uploadError) {
    console.error("Error uploading image:", uploadError)
    throw uploadError
  }

  // Get the public URL for the uploaded image
  const { data: publicURL } = supabase.storage.from("images").getPublicUrl(filePath)

  // Update the FHE group with the image URL
  const { data, error } = await supabase
    .from("fhe_groups")
    .update({
      activity_image: publicURL.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .select()
    .single()

  if (error) {
    console.error(`Error updating FHE group with image:`, error)
    throw error
  }

  return data
}
