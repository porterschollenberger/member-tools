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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"

interface CallingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  calling: any | null
  onSuccess?: () => void
}

export function CallingDialog({ open, onOpenChange, calling, onSuccess }: CallingDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    organization: "Sunday School",
    status: "vacant",
    member_id: "",
    sustainedDate: "",
    isSetApart: false,
    notes: "",
  })
  const [originalData, setOriginalData] = useState({
    sustainedDate: "",
    isSetApart: false,
  })
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const ORGANIZATIONS = [
    "Bishopric",
    "Relief Society",
    "Elders Quorum",
    "Primary",
    "Young Men",
    "Young Women",
    "Sunday School",
    "Ward Missionary",
    "Music",
    "Other",
  ]

  useEffect(() => {
    async function fetchMembers() {
      const { data } = await supabase.from("members").select("id, name").order("name")

      setMembers(data || [])
    }

    fetchMembers()
  }, [])

  useEffect(() => {
    if (calling) {
      setFormData({
        title: calling.title || "",
        organization: calling.organization || "Sunday School",
        status: calling.status || "vacant",
        member_id: calling.member_id || "",
        sustainedDate: calling.sustained_date || "",
        isSetApart: calling.is_set_apart || false,
        notes: calling.notes || "",
      })
      setOriginalData({
        sustainedDate: calling.sustained_date || "",
        isSetApart: calling.is_set_apart || false,
      })
    } else {
      setFormData({
        title: "",
        organization: "Sunday School",
        status: "vacant",
        member_id: "",
        sustainedDate: "",
        isSetApart: false,
        notes: "",
      })
      setOriginalData({
        sustainedDate: "",
        isSetApart: false,
      })
    }
  }, [calling, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const createLcrUpdateTask = async (type: "calling_sustained" | "calling_set_apart") => {
    const selectedMember = members.find((m) => m.id === formData.member_id)

    if (!selectedMember) return

    const taskDescription =
      type === "calling_sustained"
        ? `${selectedMember.name} was sustained as ${formData.title}`
        : `${selectedMember.name} was set apart as ${formData.title}`

    const taskDetails = {
      memberId: formData.member_id,
      memberName: selectedMember.name,
      callingId: calling?.id || "new",
      callingTitle: formData.title,
      date: type === "calling_sustained" ? formData.sustainedDate : new Date().toISOString().split("T")[0],
      notes: type === "calling_sustained" ? "Sustained in Sacrament Meeting" : `Set apart by ${user?.name}`,
    }

    await supabase.from("lcr_update_tasks").insert([
      {
        type,
        description: taskDescription,
        details: taskDetails,
        created_by: user?.name || "System",
        completed: false,
      },
    ])

    toast({
      title: "LCR Update Task Created",
      description: `An LCR update task has been created for the clerk to update ${type === "calling_sustained" ? "sustaining" : "setting apart"} in LCR.`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const callingData = {
        title: formData.title,
        organization: formData.organization,
        status: formData.status,
        member_id: formData.status === "filled" ? formData.member_id : null,
        sustained_date: formData.status === "filled" ? formData.sustainedDate : null,
        is_set_apart: formData.status === "filled" ? formData.isSetApart : false,
        notes: formData.notes,
      }

      if (calling) {
        // Update existing calling
        const { error } = await supabase.from("callings").update(callingData).eq("id", calling.id)

        if (error) throw error

        // Check if sustained date was added or changed
        if (formData.sustainedDate && formData.sustainedDate !== originalData.sustainedDate) {
          await createLcrUpdateTask("calling_sustained")
        }

        // Check if set apart status was changed to true
        if (formData.isSetApart && !originalData.isSetApart) {
          await createLcrUpdateTask("calling_set_apart")
        }

        toast({
          title: "Calling Updated",
          description: `${formData.title} has been updated successfully.`,
        })
      } else {
        // Create new calling
        const { error } = await supabase.from("callings").insert([callingData])

        if (error) throw error

        toast({
          title: "Calling Added",
          description: `${formData.title} has been added successfully.`,
        })
      }

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error saving calling:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error saving the calling.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{calling ? "Edit Calling" : "Add New Calling"}</DialogTitle>
            <DialogDescription>
              {calling ? "Update the calling information below." : "Enter the new calling information below."}
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
              <Label htmlFor="organization" className="text-right">
                Organization
              </Label>
              <Select
                value={formData.organization}
                onValueChange={(value) => handleSelectChange("organization", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATIONS.map((org) => (
                    <SelectItem key={org} value={org}>
                      {org}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filled">Filled</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === "filled" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="member_id" className="text-right">
                    Member
                  </Label>
                  <Select value={formData.member_id} onValueChange={(value) => handleSelectChange("member_id", value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sustainedDate" className="text-right">
                    Sustained Date
                  </Label>
                  <div className="col-span-3 relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sustainedDate"
                      name="sustainedDate"
                      type="date"
                      value={formData.sustainedDate}
                      onChange={handleChange}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isSetApart" className="text-right">
                    Set Apart
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox
                      id="isSetApart"
                      checked={formData.isSetApart}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isSetApart: checked === true }))}
                    />
                    <label
                      htmlFor="isSetApart"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Member has been set apart
                    </label>
                  </div>
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : calling ? "Update" : "Add"} Calling
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
