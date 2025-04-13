import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { getDefaultPermissions, type Permission, type UserRole } from "@/context/auth-context"

export type User = Database["public"]["Tables"]["users"]["Row"]
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"]
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"]

// Get all users
export async function getUsers() {
  const { data, error } = await supabase.from("users").select("*").order("name")

  if (error) {
    console.error("Error fetching users:", error)
    throw error
  }

  return data || []
}

// Get a user by ID
export async function getUserById(id: string) {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching user with ID ${id}:`, error)
    throw error
  }

  return data
}

// Create a new user
export async function createUser(user: UserInsert, password: string) {
  // First, create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
  })

  if (authError) {
    console.error("Error creating auth user:", authError)
    throw authError
  }

  // Then, create the user record
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        id: authData.user.id,
        ...user,
        permissions: user.permissions || getDefaultPermissions(user.role as UserRole),
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating user:", error)
    throw error
  }

  return data
}

// Update a user
export async function updateUser(id: string, user: UserUpdate) {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...user,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating user with ID ${id}:`, error)
    throw error
  }

  return data
}

// Delete a user
export async function deleteUser(id: string) {
  // First, delete the user record
  const { error: recordError } = await supabase.from("users").delete().eq("id", id)

  if (recordError) {
    console.error(`Error deleting user record with ID ${id}:`, recordError)
    throw recordError
  }

  // Then, delete the auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(id)

  if (authError) {
    console.error(`Error deleting auth user with ID ${id}:`, authError)
    throw authError
  }

  return true
}

// Reset a user's password
export async function resetUserPassword(id: string, newPassword: string) {
  const { error } = await supabase.auth.admin.updateUserById(id, { password: newPassword })

  if (error) {
    console.error(`Error resetting password for user with ID ${id}:`, error)
    throw error
  }

  return true
}

// Activate or deactivate a user
export async function setUserStatus(id: string, active: boolean) {
  const { data, error } = await supabase
    .from("users")
    .update({
      status: active ? "active" : "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error ${active ? "activating" : "deactivating"} user with ID ${id}:`, error)
    throw error
  }

  return data
}

// Update a user's permissions
export async function updateUserPermissions(id: string, permissions: Permission[]) {
  const { data, error } = await supabase
    .from("users")
    .update({
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating permissions for user with ID ${id}:`, error)
    throw error
  }

  return data
}
