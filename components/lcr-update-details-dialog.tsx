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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Calendar, User, Briefcase, AlertCircle } from "lucide-react"
import type { LcrUpdateTask } from "@/lib/types"

interface LcrUpdateDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: LcrUpdateTask | null
  onMarkCompleted: (taskId: string) => void
  onMarkIncomplete: (taskId: string) => void
}

export function LcrUpdateDetailsDialog({
  open,
  onOpenChange,
  task,
  onMarkCompleted,
  onMarkIncomplete,
}: LcrUpdateDetailsDialogProps) {
  if (!task) return null

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "calling_sustained":
        return <Briefcase className="h-5 w-5 text-blue-500" />
      case "calling_set_apart":
        return <Check className="h-5 w-5 text-green-500" />
      case "new_member":
        return <User className="h-5 w-5 text-purple-500" />
      case "released_from_calling":
        return <Calendar className="h-5 w-5 text-amber-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case "calling_sustained":
        return "Calling Sustained"
      case "calling_set_apart":
        return "Calling Set Apart"
      case "new_member":
        return "New Member Record"
      case "released_from_calling":
        return "Released from Calling"
      default:
        return "Other Update"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getTaskIcon(task.type)}
            <DialogTitle>{getTaskTypeLabel(task.type)}</DialogTitle>
          </div>
          <DialogDescription>
            Created on {new Date(task.createdAt).toLocaleString()} by {task.createdBy}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Description</h3>
              <p className="mt-2">{task.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium">Details</h3>
              <div className="mt-2 space-y-2">
                {task.details.memberName && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Member:</div>
                    <div className="col-span-2">{task.details.memberName}</div>
                  </div>
                )}
                {task.details.callingTitle && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Calling:</div>
                    <div className="col-span-2">{task.details.callingTitle}</div>
                  </div>
                )}
                {task.details.date && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Date:</div>
                    <div className="col-span-2">{new Date(task.details.date).toLocaleDateString()}</div>
                  </div>
                )}
                {task.details.notes && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Notes:</div>
                    <div className="col-span-2">{task.details.notes}</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Status</h3>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={task.completed ? "default" : "secondary"}>
                  {task.completed ? "Completed" : "Pending"}
                </Badge>
                {task.completed && (
                  <span className="text-sm text-muted-foreground">
                    Completed on {new Date(task.completedAt!).toLocaleString()} by {task.completedBy}
                  </span>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!task.completed ? (
            <Button onClick={() => onMarkCompleted(task.id)}>
              <Check className="mr-2 h-4 w-4" />
              Mark as Completed in LCR
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onMarkIncomplete(task.id)}>
              Mark as Incomplete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
