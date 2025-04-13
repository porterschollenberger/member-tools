"use client"

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
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface MemberDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: any | null
}

export function MemberDetailsDialog({ open, onOpenChange, member }: MemberDetailsDialogProps) {
  const [memberDetails, setMemberDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchMemberDetails() {
      if (!member) return

      setIsLoading(true)

      try {
        // Fetch member with related data
        const { data, error } = await supabase
          .from("members")
          .select(`
            *,
            fhe_groups:fhe_group_id(id, name),
            callings:callings(id, title, organization)
          `)
          .eq("id", member.id)
          .single()

        if (error) throw error

        setMemberDetails(data)
      } catch (error) {
        console.error("Error fetching member details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (open && member) {
      fetchMemberDetails()
    }
  }, [member, open])

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
          <DialogDescription>Detailed information about {member.name}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <p>Loading member details...</p>
          </div>
        ) : memberDetails ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Name:</div>
                    <div className="col-span-2">{memberDetails.name}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Email:</div>
                    <div className="col-span-2">{memberDetails.email || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Phone:</div>
                    <div className="col-span-2">{memberDetails.phone || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Address:</div>
                    <div className="col-span-2">{memberDetails.address || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Status:</div>
                    <div className="col-span-2">
                      <Badge variant={memberDetails.status === "active" ? "default" : "secondary"}>
                        {memberDetails.status === "active" ? "Active" : "Less Active"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Church Information</h3>
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Callings:</div>
                    <div className="col-span-2">
                      {memberDetails.callings && memberDetails.callings.length > 0 ? (
                        <div className="space-y-1">
                          {memberDetails.callings.map((calling: any) => (
                            <Badge key={calling.id} className="mr-1">
                              {calling.title}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "None"
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">FHE Group:</div>
                    <div className="col-span-2">{memberDetails.fhe_groups?.name || "None"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Skills and Interests</h3>
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Skills:</div>
                    <div className="col-span-2">
                      {memberDetails.skills && memberDetails.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {memberDetails.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "None listed"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Notes</h3>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {memberDetails.notes || "No notes available for this member."}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center p-8">
            <p>Member details not available</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
