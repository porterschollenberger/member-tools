import { supabase } from "@/lib/supabase"

export interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string | null
  attendees: string[]
  type: string
}

export interface EventInput {
  title: string
  date: string
  time: string
  location: string
  description: string | null
  attendees: string[]
  type: string
}

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase.from("events").select("*")

  if (error) {
    throw error
  }

  return data || []
}

export async function getEvent(id: string): Promise<Event> {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single()

  if (error) {
    throw error
  }

  return data
}

export async function createEvent(event: EventInput): Promise<Event> {
  const { data, error } = await supabase.from("events").insert(event).select().single()

  if (error) {
    throw error
  }

  return data
}

export async function updateEvent(id: string, event: EventInput): Promise<Event> {
  const { data, error } = await supabase.from("events").update(event).eq("id", id).select().single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id)

  if (error) {
    throw error
  }
}
