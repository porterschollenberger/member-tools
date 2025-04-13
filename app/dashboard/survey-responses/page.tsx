"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, MoreHorizontal, Eye, Check, X, Loader2 } from "lucide-react"
import { SurveyResponseDialog } from "@/components/survey-response-dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export default function SurveyResponsesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState(null)
  const [sortField, setSortField] = useState("submitted_at")
  const [sortDirection, setSortDirection] = useState("desc")
  const [responses, setResponses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSurveyResponses() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("survey_responses")
          .select("*")
          .order(sortField, { ascending: sortDirection === "asc" })

        if (error) throw error
        setResponses(data || [])
      } catch (error) {
        console.error("Error fetching survey responses:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load survey responses. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchSurveyResponses()
    }
  }, [user, sortField, sortDirection, toast])

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the survey responses.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check if user has appropriate role
  if (user.role !== "admin" && user.role !== "bishopric" && user.role !== "ward_clerk") {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access the survey responses.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Add sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredResponses = responses.filter(
    (response) =>
      response.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewResponse = (response) => {
    setSelectedResponse(response)
    setIsDialogOpen(true)
  }

  const handleMarkAsProcessed = async (response) => {
    try {
      const { error } = await supabase.from("survey_responses").update({ processed: true }).eq("id", response.id)

      if (error) throw error

      setResponses(responses.map((r) => (r.id === response.id ? { ...r, processed: true } : r)))

      toast({
        title: "Survey Marked as Processed",
        description: `${response.full_name}'s survey has been marked as processed.`,
      })
    } catch (error) {
      console.error("Error marking survey as processed:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark survey as processed. Please try again.",
      })
    }
  }

  const handleUnmarkAsProcessed = async (response) => {
    try {
      const { error } = await supabase.from("survey_responses").update({ processed: false }).eq("id", response.id)

      if (error) throw error

      setResponses(responses.map((r) => (r.id === response.id ? { ...r, processed: false } : r)))

      toast({
        title: "Survey Unmarked as Processed",
        description: `${response.full_name}'s survey has been unmarked as processed.`,
      })
    } catch (error) {
      console.error("Error unmarking survey as processed:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unmark survey as processed. Please try again.",
      })
    }
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Survey Responses</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search responses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

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
                  <TableHead className="cursor-pointer" onClick={() => handleSort("full_name")}>
                    Name {sortField === "full_name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                    Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("phone")}>
                    Phone {sortField === "phone" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("submitted_at")}>
                    Submitted {sortField === "submitted_at" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("processed")}>
                    Status {sortField === "processed" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.length > 0 ? (
                  filteredResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell className="font-medium">{response.full_name}</TableCell>
                      <TableCell>{response.email}</TableCell>
                      <TableCell>{response.phone}</TableCell>
                      <TableCell>{new Date(response.submitted_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={response.processed ? "default" : "secondary"}>
                          {response.processed ? "Processed" : "Pending"}
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
                            <DropdownMenuItem onClick={() => handleViewResponse(response)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!response.processed ? (
                              <DropdownMenuItem onClick={() => handleMarkAsProcessed(response)}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Processed
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUnmarkAsProcessed(response)}>
                                <X className="mr-2 h-4 w-4" />
                                Unmark as Processed
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
                      {searchQuery ? "No responses match your search." : "No survey responses found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SurveyResponseDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} response={selectedResponse} />
    </div>
  )
}
