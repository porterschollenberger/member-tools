"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Search, MoreHorizontal, Check, Eye, Calendar, User, Briefcase, AlertCircle, Loader2 } from "lucide-react"
import { LcrUpdateDetailsDialog } from "@/components/lcr-update-details-dialog"
import { supabase } from "@/lib/supabase"
import type { LcrUpdateTask } from "@/lib/types"

export default function LcrUpdatesPage() {
  const { user, hasResourcePermission } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LcrUpdateTask | null>(null)
  const [tasks, setTasks] = useState<LcrUpdateTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    async function fetchTasks() {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch tasks based on active tab
        let query = supabase.from("lcr_update_tasks").select("*")

        if (activeTab === "pending") {
          query = query.eq("completed", false)
        } else if (activeTab === "completed") {
          query = query.eq("completed", true)
        }

        const { data, error } = await query.order("created_at", { ascending: false })

        if (error) throw error

        setTasks(data || [])

        // Get count of pending tasks for badge
        const { count, error: countError } = await supabase
          .from("lcr_update_tasks")
          .select("*", { count: "exact", head: true })
          .eq("completed", false)

        if (countError) throw countError

        setPendingCount(count || 0)
      } catch (error) {
        console.error("Error fetching LCR update tasks:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load LCR update tasks.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [user, activeTab, toast])

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the LCR updates page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check if user has view permission
  if (!hasResourcePermission("members", "edit")) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to view the LCR updates page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const filteredTasks = tasks.filter((task) => {
    // Filter by search query
    return (
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.details.memberName && task.details.memberName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.details.callingTitle && task.details.callingTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  const handleViewDetails = (task: LcrUpdateTask) => {
    setSelectedTask(task)
    setIsDetailsDialogOpen(true)
  }

  const handleMarkAsCompleted = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("lcr_update_tasks")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          completed_by: user.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)

      if (error) throw error

      // Update local state
      setTasks(
        tasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              completed: true,
              completed_at: new Date().toISOString(),
              completed_by: user.name,
            }
          }
          return task
        }),
      )

      // Update pending count
      setPendingCount((prev) => prev - 1)

      toast({
        title: "Task Marked as Completed",
        description: "The LCR update task has been marked as completed.",
      })
    } catch (error) {
      console.error("Error marking task as completed:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark task as completed.",
      })
    }
  }

  const handleMarkAsIncomplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("lcr_update_tasks")
        .update({
          completed: false,
          completed_at: null,
          completed_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)

      if (error) throw error

      // Update local state
      setTasks(
        tasks.map((task) => {
          if (task.id === taskId) {
            const { completed_at, completed_by, ...rest } = task
            return {
              ...rest,
              completed: false,
            }
          }
          return task
        }),
      )

      // Update pending count
      setPendingCount((prev) => prev + 1)

      toast({
        title: "Task Marked as Incomplete",
        description: "The LCR update task has been marked as incomplete.",
      })
    } catch (error) {
      console.error("Error marking task as incomplete:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark task as incomplete.",
      })
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "calling_sustained":
        return <Briefcase className="h-4 w-4 text-blue-500" />
      case "calling_set_apart":
        return <Check className="h-4 w-4 text-green-500" />
      case "new_member":
        return <User className="h-4 w-4 text-purple-500" />
      case "released_from_calling":
        return <Calendar className="h-4 w-4 text-amber-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case "calling_sustained":
        return "Sustained"
      case "calling_set_apart":
        return "Set Apart"
      case "new_member":
        return "New Member"
      case "released_from_calling":
        return "Released"
      default:
        return "Other"
    }
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">LCR Updates</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search updates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="secondary" className="ml-2">
              {pendingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTaskIcon(task.type)}
                              <span>{getTaskTypeLabel(task.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{task.description}</TableCell>
                          <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{task.created_by}</TableCell>
                          <TableCell>
                            <Badge variant={task.completed ? "default" : "secondary"}>
                              {task.completed ? "Completed" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewDetails(task)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {!task.completed ? (
                                  <DropdownMenuItem onClick={() => handleMarkAsCompleted(task.id)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as Completed
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleMarkAsIncomplete(task.id)}>
                                    Mark as Incomplete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {searchQuery
                            ? "No LCR update tasks match your search."
                            : activeTab === "pending"
                              ? "No pending LCR update tasks."
                              : activeTab === "completed"
                                ? "No completed LCR update tasks."
                                : "No LCR update tasks found."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LcrUpdateDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        task={selectedTask}
        onMarkCompleted={handleMarkAsCompleted}
        onMarkIncomplete={handleMarkAsIncomplete}
      />
    </div>
  )
}
