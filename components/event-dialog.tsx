"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createEvent, updateEvent } from "@/services/events"

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

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  onEventSaved: (event: Event) => void
}

export function EventDialog({ open, onOpenChange, event, onEventSaved }: EventDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    attendees: "",
    type: "meeting",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        description: event.description || "",
        attendees: event.attendees.join(", "),
        type: event.type,
      })
    } else {
      // Set default values for a new event
      const today = new Date()
      const formattedDate = today.toISOString().split("T")[0]

      setFormData({
        title: "",
        date: formattedDate,
        time: "12:00",
        location: "",
        description: "",
        attendees: "",
        type: "meeting",
      })
    }
  }, [event, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert attendees string to array
      const attendeesArray = formData.attendees
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")

      const eventData = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        description: formData.description || null,
        attendees: attendeesArray,
        type: formData.type,
      }

      let savedEvent: Event

      if (event) {
        // Update existing event
        savedEvent = await updateEvent(event.id, eventData)

        toast({
          title: "Event Updated",
          description: `${formData.title} has been updated successfully.`,
        })
      } else {
        // Create new event
        savedEvent = await createEvent(eventData)

        toast({
          title: "Event Added",
          description: `${formData.title} has been added successfully.`,
        })
      }

      onEventSaved(savedEvent)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Error",
        description: "Failed to save event. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{event ? "Edit Event" : "Add New Event"}</DialogTitle>
            <DialogDescription>
              {event ? "Update the event information below." : "Enter the new event information below."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="attendees" className="text-right">
                Attendees
              </Label>
              <Input
                id="attendees"
                name="attendees"
                value={formData.attendees}
                onChange={handleChange}
                placeholder="Comma-separated list of attendees"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : event ? "Update" : "Add"} Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
