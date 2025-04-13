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
import { Plus, MoreHorizontal, Search, Trash2, Eye, Pencil } from "lucide-react"
import { MemberDialog } from "@/components/member-dialog"
import { LcrComparison } from "@/components/lcr-comparison"
import { DeleteMemberDialog } from "@/components/delete-member-dialog"
import { MemberDetailsDialog } from "@/components/member-details-dialog"
import { supabase } from "@/lib/supabase"

export default function MembersPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("members")
          .select(`
            *,
            fhe_groups:fhe_group_id(id, name),
            callings:callings(id, title, organization)
          `)
          .order(sortField, { ascending: sortDirection === "asc" })

        if (error) throw error

        setMembers(data || [])
      } catch (error) {
        console.error("Error fetching members:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchMembers()
    }
  }, [user, sortField, sortDirection])

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the members page.</CardDescription>
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

  const filteredMembers = members.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.callings?.some((calling) => calling.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      member.fhe_groups?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleOpenDialog = (member = null) => {
    setSelectedMember(member)
    setIsDialogOpen(true)
  }

  const handleDeleteMember = (member) => {
    setMemberToDelete(member)
    setIsDeleteDialogOpen(true)
  }

  const handleViewDetails = (member) => {
    setSelectedMember(member)
    setIsDetailsDialogOpen(true)
  }

  const handleMemberChange = async () => {
    // Refresh the members list after a change
    const { data } = await supabase
      .from("members")
      .select(`
        *,
        fhe_groups:fhe_group_id(id, name),
        callings:callings(id, title, organization)
      `)
      .order(sortField, { ascending: sortDirection === "asc" })

    setMembers(data || [])
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Members</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <p>Loading members...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                      Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                      Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Calling</TableHead>
                    <TableHead>FHE Group</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === "active" ? "default" : "secondary"}>
                            {member.status === "active" ? "Active" : "Less Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.callings && member.callings.length > 0
                            ? member.callings.map((c) => c.title).join(", ")
                            : "None"}
                        </TableCell>
                        <TableCell>{member.fhe_groups?.name || "None"}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleViewDetails(member)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDialog(member)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteMember(member)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {searchQuery
                          ? "No members found matching your search."
                          : "No members found. Add your first member!"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <LcrComparison />
        </div>
      </>

      <MemberDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        member={selectedMember}
        onSuccess={handleMemberChange}
      />
      <DeleteMemberDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        member={memberToDelete}
        onSuccess={handleMemberChange}
      />
      <MemberDetailsDialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} member={selectedMember} />
    </div>
  )
}
