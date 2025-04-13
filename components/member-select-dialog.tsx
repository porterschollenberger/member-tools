"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"

interface MemberSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  calling: any | null
  onSuccess?: () => void
}

export function MemberSelectDialog({ open, onOpenChange, calling, onSuccess }: MemberSelectDialogProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    async function fetchMembers() {
      if (!open || !calling) return

      try {
        setIsLoading(true)

        // Fetch members who don't already have this calling
        const { data, error } = await supabase.from("members").select("*").order("name")

        if (error) throw error

        setMembers(data || [])
        setSelectedMemberId(null)
      } catch (error) {
        console.error("Error fetching members:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [open, calling])

  const filteredMembers = members.filter((member) => member.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleAssign = async () => {
    if (!selectedMemberId) {
      toast({
        variant: "destructive",
        title: "No Member Selected",
        description: "Please select a member to assign to this calling.",
      })
      return
    }

    if (!calling) return

    setIsAssigning(true)

    try {
      // Get the selected member
      const selectedMember = members.find((m) => m.id === selectedMemberId)

      // Create LCR update task for sustaining
      await supabase.from("lcr_update_tasks").insert([
        {
          type: "calling_sustained",
          description: `${selectedMember.name} was sustained as ${calling.title}`,
          details: {
            memberId: selectedMemberId,
            memberName: selectedMember.name,
            callingId: calling.id,
            callingTitle: calling.title,
            date: new Date().toISOString().split("T")[0],
            notes: "Sustained in Sacrament Meeting",
          },
          created_by: "System",
          completed: false,
        },
      ])

      // Update the calling
      await supabase
        .from("callings")
        .update({
          member_id: selectedMemberId,
          status: "filled",
          sustained_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", calling.id)

      toast({
        title: "Member Assigned",
        description: `${selectedMember.name} has been assigned to the ${calling.title} calling.`,
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error assigning member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error assigning the member to the calling.",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Member to Calling</DialogTitle>
          <DialogDescription>Select a member to assign to the {calling?.title} calling.</DialogDescription>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <p>Loading members...</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-2">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center rounded-md p-2 cursor-pointer transition-colors ${
                      selectedMemberId === member.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedMemberId(member.id)}
                  >
                    {member.name}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {searchQuery ? "No members found matching your search." : "No members found."}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedMemberId || isAssigning}>
            {isAssigning ? "Assigning..." : "Assign Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
