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

interface DeleteCallingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  calling: any | null
  onSuccess?: () => void
}

export function DeleteCallingDialog({ open, onOpenChange, calling, onSuccess }: DeleteCallingDialogProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!calling) return

    setIsDeleting(true)

    try {
      // Delete the calling
      const { error } = await supabase.from("callings").delete().eq("id", calling.id)

      if (error) throw error

      toast({
        title: "Calling Deleted",
        description: `The ${calling.title} calling has been deleted.`,
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error deleting calling:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error deleting the calling.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Calling</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the {calling?.title} calling? This action cannot be undone.
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
