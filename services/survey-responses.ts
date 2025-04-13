import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

export type SurveyResponse = Database["public"]["Tables"]["survey_responses"]["Row"]
export type SurveyResponseInsert = Database["public"]["Tables"]["survey_responses"]["Insert"]
export type SurveyResponseUpdate = Database["public"]["Tables"]["survey_responses"]["Update"]

// Get all survey responses
export async function getSurveyResponses() {
  const { data, error } = await supabase
    .from("survey_responses")
    .select("*")
    .order("submitted_at", { ascending: false })

  if (error) {
    console.error("Error fetching survey responses:", error)
    throw error
  }

  return data || []
}

// Get a survey response by ID
export async function getSurveyResponseById(id: string) {
  const { data, error } = await supabase.from("survey_responses").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching survey response with ID ${id}:`, error)
    throw error
  }

  return data
}

// Create a new survey response
export async function createSurveyResponse(response: SurveyResponseInsert) {
  const { data, error } = await supabase
    .from("survey_responses")
    .insert([
      {
        ...response,
        submitted_at: new Date().toISOString(),
        processed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating survey response:", error)
    throw error
  }

  return data
}

// Mark a survey response as processed
export async function markSurveyResponseAsProcessed(id: string) {
  const { data, error } = await supabase
    .from("survey_responses")
    .update({
      processed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error marking survey response as processed:`, error)
    throw error
  }

  return data
}

// Mark a survey response as unprocessed
export async function markSurveyResponseAsUnprocessed(id: string) {
  const { data, error } = await supabase
    .from("survey_responses")
    .update({
      processed: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error marking survey response as unprocessed:`, error)
    throw error
  }

  return data
}

// Create a member from a survey response
export async function createMemberFromSurveyResponse(responseId: string) {
  // First, get the survey response
  const { data: response, error: responseError } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("id", responseId)
    .single()

  if (responseError) {
    console.error(`Error fetching survey response:`, responseError)
    throw responseError
  }

  // Create a new member from the survey response
  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert([
      {
        name: response.full_name,
        email: response.email,
        phone: response.phone,
        address: response.address,
        status: "active",
        skills: response.skills ? response.skills.split(",").map((s) => s.trim()) : [],
        notes: response.additional_info,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (memberError) {
    console.error(`Error creating member from survey response:`, memberError)
    throw memberError
  }

  // Mark the survey response as processed
  await markSurveyResponseAsProcessed(responseId)

  return member
}
