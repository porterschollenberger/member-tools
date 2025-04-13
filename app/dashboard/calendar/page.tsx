"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Plus, Clock, MapPin, Users, Info, Trash2, Loader2 } from "lucide-react"
import { EventDialog } from "@/components/event-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getEvents, deleteEvent } from "@/services/events"

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string | null
  attendees: string[]
  type: string
}

export default function CalendarPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const isAuthenticated = !!user

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        const data = await getEvents()
        setEvents(data || [])
      } catch (error) {
        console.error("Error fetching events:", error)
        toast({
          title: "Error",
          description: "Failed to load events. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [toast])

  // Get events for the selected date
  const selectedDateStr = date ? date.toISOString().split("T")[0] : ""
  const eventsForSelectedDate = events.filter((event) => event.date === selectedDateStr)

  // Get all dates with events for highlighting in the calendar
  const datesWithEvents = events.map((event) => {
    const [year, month, day] = event.date.split("-").map(Number)
    return new Date(year, month - 1, day) // Month is 0-indexed in JavaScript Date
  })

  const handleOpenDialog = (event: Event | null = null) => {
    setSelectedEvent(event)
    setIsDialogOpen(true)
  }

  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return

    try {
      await deleteEvent(eventToDelete.id)

      setEvents(events.filter((e) => e.id !== eventToDelete.id))

      toast({
        title: "Event Deleted",
        description: `${eventToDelete.title} has been deleted successfully.`,
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800"
      case "activity":
        return "bg-green-100 text-green-800"
      case "service":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Custom CSS for dates with events
  const modifiersStyles = {
    event: {
      fontWeight: "bold",
      color: "var(--primary)",
    },
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading calendar events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        {user && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-4">
        <Card className="md:h-fit">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                event: datesWithEvents,
              }}
              modifiersStyles={modifiersStyles}
              styles={{
                day_today: { fontWeight: "bold" },
                day_selected: { color: "white" },
              }}
              classNames={{
                day_event:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Events for{" "}
              {date
                ? date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                : "Selected Date"}
            </CardTitle>
            <CardDescription>
              {eventsForSelectedDate.length === 0
                ? "No events scheduled for this date."
                : `${eventsForSelectedDate.length} events scheduled`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventsForSelectedDate.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Info className="h-12 w-12 mb-2" />
                  <p>No events scheduled for this date.</p>
                  {user && <p className="text-sm">Click "Add Event" to schedule something.</p>}
                </div>
              ) : (
                eventsForSelectedDate.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <div className={`h-2 ${getEventTypeColor(event.type)}`} />
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{event.title}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(`${event.date}T${event.time}`).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                          <div className="flex items-start text-sm text-muted-foreground mt-1">
                            <Users className="h-4 w-4 mr-1 mt-0.5" />
                            <span>{event.attendees.join(", ")}</span>
                          </div>
                          {event.description && <p className="mt-2 text-sm">{event.description}</p>}
                        </div>
                        {user && (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(event)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {user && (
        <>
          <EventDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            event={selectedEvent}
            onEventSaved={(savedEvent) => {
              if (selectedEvent) {
                // Update existing event
                setEvents(events.map((e) => (e.id === savedEvent.id ? savedEvent : e)))
              } else {
                // Add new event
                setEvents([...events, savedEvent])
              }
            }}
          />

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteEvent} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
