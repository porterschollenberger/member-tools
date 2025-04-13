"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface AssignFheGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: any | null
  onSuccess?: () => void
}

export function AssignFheGroupDialog({ open, onOpenChange, member, onSuccess }: AssignFheGroupDialogProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [fheGroups, setFheGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    async function fetchFheGroups() {
      if (!open || !member) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("fhe_groups")
          .select(`
            *,
            members:members(id)
          `)
          .order("name")

        if (error) throw error

        // Transform the data to include member count
        const transformedData = data.map((group) => ({
          ...group,
          memberCount: group.members ? group.members.length : 0,
        }))

        setFheGroups(transformedData || [])
        setSelectedGroupId(null)
      } catch (error) {
        console.error("Error fetching FHE groups:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load FHE groups.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFheGroups()
  }, [open, member, toast])

  if (!member) return null

  const filteredGroups = fheGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.leader_name && group.leader_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (group.location && group.location.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleAssign = async () => {
    if (!selectedGroupId) {
      toast({
        variant: "destructive",
        title: "No Group Selected",
        description: "Please select an FHE group to assign to this member.",
      })
      return
    }

    setIsAssigning(true)

    try {
      // Update the member's FHE group
      const { error } = await supabase.from("members").update({ fhe_group_id: selectedGroupId }).eq("id", member.id)

      if (error) throw error

      const selectedGroup = fheGroups.find((g) => g.id === selectedGroupId)

      toast({
        title: "FHE Group Assigned",
        description: `${member.name} has been assigned to ${selectedGroup.name}.`,
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error assigning FHE group:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign member to FHE group.",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign FHE Group to {member.name}</DialogTitle>
          <DialogDescription>Select an FHE group to assign to this member.</DialogDescription>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search FHE groups..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-2">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex flex-col rounded-md p-3 cursor-pointer transition-colors ${
                      selectedGroupId === group.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{group.name}</h4>
                      <Badge variant="outline">{group.memberCount} members</Badge>
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        selectedGroupId === group.id ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      Leader: {group.leader_name || "None assigned"}
                    </p>
                    <p
                      className={`text-sm ${
                        selectedGroupId === group.id ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      Meeting: {group.meeting_time || "Not specified"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {searchQuery ? "No FHE groups match your search." : "No FHE groups found"}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedGroupId || isAssigning}>
            {isAssigning ? "Assigning..." : "Assign to Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
