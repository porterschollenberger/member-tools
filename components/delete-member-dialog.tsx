"use client"

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
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useState } from "react"

interface DeleteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: any | null
  onSuccess?: () => void
}

export function DeleteMemberDialog({ open, onOpenChange, member, onSuccess }: DeleteMemberDialogProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!member) return

    setIsDeleting(true)

    try {
      // First check if member has any callings
      const { data: callings } = await supabase.from("callings").select("id").eq("member_id", member.id)

      if (callings && callings.length > 0) {
        // Update callings to vacant
        await supabase
          .from("callings")
          .update({
            member_id: null,
            status: "vacant",
            sustained_date: null,
            is_set_apart: false,
          })
          .eq("member_id", member.id)
      }

      // Delete the member
      const { error } = await supabase.from("members").delete().eq("id", member.id)

      if (error) throw error

      toast({
        title: "Member Deleted",
        description: `${member.name} has been removed from the ward directory.`,
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error deleting member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error deleting the member.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {member?.name} from the ward directory? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
