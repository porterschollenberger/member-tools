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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MoreHorizontal, Search, Check, Trash2, Pencil, Eye, UserMinus, UserPlus } from "lucide-react"
import { CallingDialog } from "@/components/calling-dialog"
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
import { MemberSelectDialog } from "@/components/member-select-dialog"
import { DeleteCallingDialog } from "@/components/delete-calling-dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export default function CallingsPage() {
  const [sortField, setSortField] = useState("title")
  const [sortDirection, setSortDirection] = useState("asc")
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCalling, setSelectedCalling] = useState(null)
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false)
  const [callingToRelease, setCallingToRelease] = useState(null)
  const [isMemberSelectOpen, setIsMemberSelectOpen] = useState(false)
  const [callingToAssign, setCallingToAssign] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [callingToDelete, setCallingToDelete] = useState(null)
  const [callings, setCallings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCallings() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("callings")
          .select(`
            *,
            member:member_id(id, name)
          `)
          .order(sortField, { ascending: sortDirection === "asc" })

        if (error) throw error

        setCallings(data || [])
      } catch (error) {
        console.error("Error fetching callings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchCallings()
    }
  }, [user, sortField, sortDirection])

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the callings page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredCallings = callings.filter(
    (calling) =>
      calling.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      calling.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (calling.member?.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleOpenDialog = (calling = null) => {
    setSelectedCalling(calling)
    setIsDialogOpen(true)
  }

  const handleReleaseMember = (calling) => {
    setCallingToRelease(calling)
    setIsReleaseDialogOpen(true)
  }

  const confirmReleaseMember = async () => {
    if (!callingToRelease) return

    try {
      // Create LCR update task for releasing a member
      await supabase.from("lcr_update_tasks").insert([
        {
          type: "released_from_calling",
          description: `${callingToRelease.member.name} was released from ${callingToRelease.title}`,
          details: {
            memberId: callingToRelease.member_id,
            memberName: callingToRelease.member.name,
            callingId: callingToRelease.id,
            callingTitle: callingToRelease.title,
            date: new Date().toISOString().split("T")[0],
            notes: "Released in Sacrament Meeting",
          },
          created_by: user.name,
          completed: false,
        },
      ])

      // Update the calling
      await supabase
        .from("callings")
        .update({
          member_id: null,
          status: "vacant",
          sustained_date: null,
          is_set_apart: false,
        })
        .eq("id", callingToRelease.id)

      toast({
        title: "Member Released",
        description: `${callingToRelease.member.name} has been released from the ${callingToRelease.title} calling.`,
      })

      // Refresh callings
      const { data } = await supabase
        .from("callings")
        .select(`
          *,
          member:member_id(id, name)
        `)
        .order(sortField, { ascending: sortDirection === "asc" })

      setCallings(data || [])
    } catch (error) {
      console.error("Error releasing member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error releasing the member from the calling.",
      })
    }

    setIsReleaseDialogOpen(false)
  }

  const handleAssignMember = (calling) => {
    setCallingToAssign(calling)
    setIsMemberSelectOpen(true)
  }

  const handleDeleteCalling = (calling) => {
    setCallingToDelete(calling)
    setIsDeleteDialogOpen(true)
  }

  const handleCallingChange = async () => {
    // Refresh callings
    const { data } = await supabase
      .from("callings")
      .select(`
        *,
        member:member_id(id, name)
      `)
      .order(sortField, { ascending: sortDirection === "asc" })

    setCallings(data || [])
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Callings</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Calling
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search callings..."
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
              <p>Loading callings...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                    Title {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("organization")}>
                    Organization {sortField === "organization" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Sustained</TableHead>
                  <TableHead>Set Apart</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCallings.length > 0 ? (
                  filteredCallings.map((calling) => (
                    <TableRow key={calling.id}>
                      <TableCell className="font-medium">{calling.title}</TableCell>
                      <TableCell>{calling.organization}</TableCell>
                      <TableCell>
                        <Badge variant={calling.status === "filled" ? "default" : "destructive"}>
                          {calling.status === "filled" ? "Filled" : "Vacant"}
                        </Badge>
                      </TableCell>
                      <TableCell>{calling.member?.name || "—"}</TableCell>
                      <TableCell>
                        {calling.sustained_date ? new Date(calling.sustained_date).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>{calling.is_set_apart ? <Check className="h-4 w-4 text-green-500" /> : "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{calling.notes || "—"}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(calling)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(calling)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {calling.status === "vacant" ? (
                              <DropdownMenuItem onClick={() => handleAssignMember(calling)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign Member
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleReleaseMember(calling)}>
                                <UserMinus className="mr-2 h-4 w-4" />
                                Release Member
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDeleteCalling(calling)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Calling
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {searchQuery
                        ? "No callings found matching your search."
                        : "No callings found. Add your first calling!"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CallingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        calling={selectedCalling}
        onSuccess={handleCallingChange}
      />

      <AlertDialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Member from Calling</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to release {callingToRelease?.member?.name} from the {callingToRelease?.title}{" "}
              calling? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReleaseMember}>Release</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MemberSelectDialog
        open={isMemberSelectOpen}
        onOpenChange={setIsMemberSelectOpen}
        calling={callingToAssign}
        onSuccess={handleCallingChange}
      />

      <DeleteCallingDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        calling={callingToDelete}
        onSuccess={handleCallingChange}
      />
    </div>
  )
}
