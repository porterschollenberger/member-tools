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
import { supabase } from "@/lib/supabase"

interface MemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: any | null
  onSuccess?: () => void
}

export function MemberDialog({ open, onOpenChange, member, onSuccess }: MemberDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    skills: "",
    fheGroup: "",
  })
  const [fheGroups, setFheGroups] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchFheGroups() {
      const { data } = await supabase.from("fhe_groups").select("id, name").order("name")

      setFheGroups(data || [])
    }

    fetchFheGroups()
  }, [])

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || "",
        email: member.email || "",
        phone: member.phone || "",
        address: member.address || "",
        status: member.status || "active",
        skills: member.skills ? member.skills.join(", ") : "",
        fheGroup: member.fhe_group_id || "",
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        status: "active",
        skills: "",
        fheGroup: "",
      })
    }
  }, [member, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const memberData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        status: formData.status,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()) : [],
        fhe_group_id: formData.fheGroup || null,
      }

      if (member) {
        // Update existing member
        const { error } = await supabase.from("members").update(memberData).eq("id", member.id)

        if (error) throw error

        toast({
          title: "Member Updated",
          description: `${formData.name} has been updated successfully.`,
        })
      } else {
        // Create new member
        const { error } = await supabase.from("members").insert([memberData])

        if (error) throw error

        toast({
          title: "Member Added",
          description: `${formData.name} has been added successfully.`,
        })
      }

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error saving member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error saving the member.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{member ? "Edit Member" : "Add New Member"}</DialogTitle>
            <DialogDescription>
              {member ? "Update the member's information below." : "Enter the new member's information below."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
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
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="col-span-3"
              />
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="less-active">Less Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fheGroup" className="text-right">
                FHE Group
              </Label>
              <Select value={formData.fheGroup} onValueChange={(value) => handleSelectChange("fheGroup", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select FHE group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {fheGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="skills" className="text-right">
                Skills/Interests
              </Label>
              <Textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="Music, Teaching, Technology, etc."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : member ? "Update" : "Add"} Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
