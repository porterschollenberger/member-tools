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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, X, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

interface FheGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: any | null
  onSuccess?: () => void
}

export function FheGroupDialog({ open, onOpenChange, group, onSuccess }: FheGroupDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    leader: "",
    meetingTime: "",
    location: "",
    members: [] as { id: string; name: string }[],
    activityImage: null as string | null,
  })
  const [memberSearchOpen, setMemberSearchOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function fetchMembers() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("members").select("id, name").order("name")

        if (error) throw error
        setMembers(data || [])
      } catch (error) {
        console.error("Error fetching members:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load members.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      fetchMembers()
    }
  }, [open, toast])

  useEffect(() => {
    async function fetchGroupDetails() {
      if (!group) return

      try {
        setIsLoading(true)

        // Get group members
        const { data: groupMembers, error: membersError } = await supabase
          .from("members")
          .select("id, name")
          .eq("fhe_group_id", group.id)
          .order("name")

        if (membersError) throw membersError

        // Get leader name
        let leaderName = ""
        if (group.leader_id) {
          const { data: leader, error: leaderError } = await supabase
            .from("members")
            .select("name")
            .eq("id", group.leader_id)
            .single()

          if (!leaderError && leader) {
            leaderName = leader.name
          }
        }

        setFormData({
          name: group.name || "",
          leader: leaderName || "",
          meetingTime: group.meeting_time || "",
          location: group.location || "",
          members: groupMembers || [],
          activityImage: group.activity_image || null,
        })

        setPreviewImage(group.activity_image)
      } catch (error) {
        console.error("Error fetching group details:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load group details.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (group) {
      fetchGroupDetails()
    } else {
      setFormData({
        name: "",
        leader: "",
        meetingTime: "",
        location: "",
        members: [],
        activityImage: null,
      })
      setPreviewImage(null)
    }
  }, [group, open, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddMember = (member: { id: string; name: string }) => {
    if (!formData.members.some((m) => m.id === member.id)) {
      setFormData((prev) => ({
        ...prev,
        members: [...prev.members, member],
      }))
    }
    setMemberSearchOpen(false)
  }

  const handleRemoveMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setPreviewImage(imageUrl)
        setFormData((prev) => ({ ...prev, activityImage: imageUrl }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setPreviewImage(null)
    setFormData((prev) => ({ ...prev, activityImage: null }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Get leader ID from name
      let leaderId = null
      if (formData.leader && formData.leader !== "none") {
        const { data: leaderData } = await supabase.from("members").select("id").eq("name", formData.leader).single()

        if (leaderData) {
          leaderId = leaderData.id
        }
      }

      const groupData = {
        name: formData.name,
        leader_id: leaderId,
        meeting_time: formData.meetingTime,
        location: formData.location,
        activity_image: formData.activityImage,
        updated_at: new Date().toISOString(),
      }

      if (group) {
        // Update existing group
        const { error } = await supabase.from("fhe_groups").update(groupData).eq("id", group.id)

        if (error) throw error

        // Update member assignments
        // First, remove all current assignments
        await supabase.from("members").update({ fhe_group_id: null }).eq("fhe_group_id", group.id)

        // Then add new assignments
        for (const member of formData.members) {
          await supabase.from("members").update({ fhe_group_id: group.id }).eq("id", member.id)
        }

        toast({
          title: "Group Updated",
          description: `${formData.name} has been updated successfully.`,
        })
      } else {
        // Create new group
        const { data: newGroup, error } = await supabase
          .from("fhe_groups")
          .insert({
            ...groupData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error

        // Assign members to the new group
        for (const member of formData.members) {
          await supabase.from("members").update({ fhe_group_id: newGroup.id }).eq("id", member.id)
        }

        toast({
          title: "Group Added",
          description: `${formData.name} has been added successfully.`,
        })
      }

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error saving FHE group:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error saving the FHE group.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{group ? "Edit FHE Group" : "Add New FHE Group"}</DialogTitle>
              <DialogDescription>
                {group ? "Update the FHE group information below." : "Enter the new FHE group information below."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Group Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="leader" className="text-right">
                  Leader
                </Label>
                <Select value={formData.leader} onValueChange={(value) => handleSelectChange("leader", value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select leader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="meetingTime" className="text-right">
                  Meeting Time
                </Label>
                <Input
                  id="meetingTime"
                  name="meetingTime"
                  value={formData.meetingTime}
                  onChange={handleChange}
                  placeholder="e.g., Monday, 7:00 PM"
                  className="col-span-3"
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
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Activity Flyer</Label>
                <div className="col-span-3 space-y-2">
                  {previewImage ? (
                    <div className="relative">
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Activity Flyer"
                        className="w-full h-auto rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="activity-image"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG or GIF</p>
                        </div>
                        <input
                          id="activity-image"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Members</Label>
                <div className="col-span-3 space-y-2">
                  <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={memberSearchOpen}
                        className="w-full justify-between"
                      >
                        Add members
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search members..." />
                        <CommandList>
                          <CommandEmpty>No member found.</CommandEmpty>
                          <CommandGroup>
                            {members
                              .filter((member) => !formData.members.some((m) => m.id === member.id))
                              .map((member) => (
                                <CommandItem key={member.id} onSelect={() => handleAddMember(member)}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.members.some((m) => m.id === member.id) ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {member.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2">
                    {formData.members.map((member) => (
                      <Badge key={member.id} variant="secondary" className="flex items-center gap-1">
                        {member.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="rounded-full h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {member.name}</span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : group ? "Update" : "Add"} Group
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
