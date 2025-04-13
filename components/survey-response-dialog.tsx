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
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface SurveyResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  response: any | null
}

export function SurveyResponseDialog({ open, onOpenChange, response }: SurveyResponseDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [fullResponseData, setFullResponseData] = useState<any>(null)

  useEffect(() => {
    async function fetchFullResponse() {
      if (!response) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("survey_responses").select("*").eq("id", response.id).single()

        if (error) throw error
        setFullResponseData(data)
      } catch (error) {
        console.error("Error fetching full survey response:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load survey response details.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (open && response) {
      fetchFullResponse()
    }
  }, [open, response, toast])

  if (!response) return null

  const handleMarkAsProcessed = async () => {
    try {
      const { error } = await supabase.from("survey_responses").update({ processed: true }).eq("id", response.id)

      if (error) throw error

      toast({
        title: "Survey Marked as Processed",
        description: `${response.full_name}'s survey has been marked as processed.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error marking survey as processed:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark survey as processed.",
      })
    }
  }

  const handleCreateMember = async () => {
    try {
      // Create a new member from the survey response
      const { data, error } = await supabase
        .from("members")
        .insert([
          {
            name: fullResponseData.full_name,
            email: fullResponseData.email,
            phone: fullResponseData.phone,
            address: fullResponseData.address,
            status: "active",
            skills: fullResponseData.skills ? fullResponseData.skills.split(",").map((s) => s.trim()) : [],
            notes: fullResponseData.additional_info,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()

      if (error) throw error

      // Mark the survey as processed
      await supabase.from("survey_responses").update({ processed: true }).eq("id", response.id)

      toast({
        title: "Member Created",
        description: `${fullResponseData.full_name} has been added to the ward directory.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error creating member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create member from survey response.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Survey Response Details</DialogTitle>
          <DialogDescription>Submitted on {new Date(response.submitted_at).toLocaleString()}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : fullResponseData ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Name:</div>
                    <div className="col-span-2">{fullResponseData.full_name}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Birth Date:</div>
                    <div className="col-span-2">
                      {fullResponseData.birth_date ? new Date(fullResponseData.birth_date).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Marital Status:</div>
                    <div className="col-span-2">
                      {fullResponseData.marital_status
                        ? fullResponseData.marital_status.charAt(0).toUpperCase() +
                        fullResponseData.marital_status.slice(1)
                        : "—"}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Family Members:</div>
                    <div className="col-span-2">{fullResponseData.family_members || "—"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Email:</div>
                    <div className="col-span-2">{fullResponseData.email || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Phone:</div>
                    <div className="col-span-2">{fullResponseData.phone || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Address:</div>
                    <div className="col-span-2">{fullResponseData.address || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Housing Status:</div>
                    <div className="col-span-2">
                      {fullResponseData.is_homeowner ? "Homeowner" : ""}
                      {fullResponseData.is_renting ? "Renting" : ""}
                      {!fullResponseData.is_homeowner && !fullResponseData.is_renting ? "—" : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Previous Ward Information</h3>
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Previous Ward:</div>
                    <div className="col-span-2">{fullResponseData.previous_ward || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Previous Stake:</div>
                    <div className="col-span-2">{fullResponseData.previous_stake || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Move-in Date:</div>
                    <div className="col-span-2">
                      {fullResponseData.move_in_date
                        ? new Date(fullResponseData.move_in_date).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Skills and Interests</h3>
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Skills:</div>
                    <div className="col-span-2">{fullResponseData.skills || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Interests:</div>
                    <div className="col-span-2">{fullResponseData.interests || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Calling Preferences:</div>
                    <div className="col-span-2">{fullResponseData.calling_preferences || "—"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Additional Information</h3>
                <div className="mt-2">
                  <p>{fullResponseData.additional_info || "—"}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center p-8">
            <p>Survey response details not available</p>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCreateMember}>
              Create Member
            </Button>
            {response && !response.processed && <Button onClick={handleMarkAsProcessed}>Mark as Processed</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
