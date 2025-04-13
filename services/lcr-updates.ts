import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

export type LcrUpdateTask = Database["public"]["Tables"]["lcr_update_tasks"]["Row"]
export type LcrUpdateTaskInsert = Database["public"]["Tables"]["lcr_update_tasks"]["Insert"]
export type LcrUpdateTaskUpdate = Database["public"]["Tables"]["lcr_update_tasks"]["Update"]

// Get all LCR update tasks
export async function getLcrUpdateTasks() {
  const { data, error } = await supabase.from("lcr_update_tasks").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching LCR update tasks:", error)
    throw error
  }

  return data || []
}

// Get pending LCR update tasks
export async function getPendingLcrUpdateTasks() {
  const { data, error } = await supabase
    .from("lcr_update_tasks")
    .select("*")
    .eq("completed", false)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending LCR update tasks:", error)
    throw error
  }

  return data || []
}

// Get completed LCR update tasks
export async function getCompletedLcrUpdateTasks() {
  const { data, error } = await supabase
    .from("lcr_update_tasks")
    .select("*")
    .eq("completed", true)
    .order("completed_at", { ascending: false })

  if (error) {
    console.error("Error fetching completed LCR update tasks:", error)
    throw error
  }

  return data || []
}

// Get an LCR update task by ID
export async function getLcrUpdateTaskById(id: string) {
  const { data, error } = await supabase.from("lcr_update_tasks").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching LCR update task with ID ${id}:`, error)
    throw error
  }

  return data
}

// Create a new LCR update task
export async function createLcrUpdateTask(task: LcrUpdateTaskInsert) {
  const { data, error } = await supabase
    .from("lcr_update_tasks")
    .insert([
      {
        ...task,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating LCR update task:", error)
    throw error
  }

  return data
}

// Mark an LCR update task as completed
export async function markLcrUpdateTaskAsCompleted(id: string, completedBy: string) {
  const { data, error } = await supabase
    .from("lcr_update_tasks")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: completedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error marking LCR update task as completed:`, error)
    throw error
  }

  return data
}

// Mark an LCR update task as incomplete
export async function markLcrUpdateTaskAsIncomplete(id: string) {
  const { data, error } = await supabase
    .from("lcr_update_tasks")
    .update({
      completed: false,
      completed_at: null,
      completed_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error marking LCR update task as incomplete:`, error)
    throw error
  }

  return data
}
