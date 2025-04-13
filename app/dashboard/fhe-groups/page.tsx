"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Settings, Loader2 } from "lucide-react"
import { FheGroupDialog } from "@/components/fhe-group-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getFheGroups, assignMemberToFheGroup } from "@/services/fhe-groups"
import { getMembers } from "@/services/members"

interface Member {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
}

interface FheGroup {
  id: string
  name: string
  leader: string
  members: Member[]
  location: string
  meetingTime: string
  activityImage: string | null
}

export default function FheGroupsPage() {
  const { user, hasResourcePermission } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<FheGroup | null>(null)
  const [groups, setGroups] = useState<FheGroup[]>([])
  const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const canEdit = hasResourcePermission("fhe_groups", "edit")
  const isAuthenticated = !!user

  // Check if user has view permission or if it's a public page
  const hasViewAccess = !isAuthenticated || hasResourcePermission("fhe_groups", "view")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch FHE groups with members
        const groupsData = await getFheGroups()
        setGroups(groupsData || [])

        // Fetch all members
        const allMembers = await getMembers()

        // Get all assigned member IDs
        const assignedMemberIds = new Set(groupsData.flatMap((group) => group.members.map((member) => member.id)))

        // Filter out assigned members
        const unassigned = allMembers
          .filter((member) => !assignedMemberIds.has(member.id))
          .map((m) => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phone: m.phone,
          }))

        setUnassignedMembers(unassigned)
      } catch (error) {
        console.error("Error fetching FHE groups data:", error)
        toast({
          title: "Error",
          description: "Failed to load FHE groups data. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (hasViewAccess) {
      fetchData()
    }
  }, [hasViewAccess, toast])

  if (isAuthenticated && !hasViewAccess) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to view FHE groups.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading FHE groups...</p>
        </div>
      </div>
    )
  }

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.members.some((member) =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  )

  const filteredUnassignedMembers = unassignedMembers.filter(
    (member) =>
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleOpenDialog = (group: FheGroup | null = null) => {
    setSelectedGroup(group)
    setIsDialogOpen(true)
  }

  // Helper function to get full name
  const getFullName = (member: { firstName: string; lastName: string }) => {
    return `${member.firstName} ${member.lastName}`
  }

  const handleAssignToGroup = async (memberId: string, groupId: string) => {
    try {
      await assignMemberToFheGroup(memberId, groupId)

      // Update local state
      // Find the member
      const member = unassignedMembers.find((m) => m.id === memberId)
      if (!member) return

      // Add member to the group
      setGroups(
        groups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              members: [...group.members, member],
            }
          }
          return group
        }),
      )

      // Remove from unassigned
      setUnassignedMembers(unassignedMembers.filter((m) => m.id !== memberId))

      toast({
        title: "Member Assigned",
        description: "Member has been assigned to the FHE group successfully.",
      })
    } catch (error) {
      console.error("Error assigning member to group:", error)
      toast({
        title: "Error",
        description: "Failed to assign member to group. Please try again later.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">FHE Groups</h2>
        {canEdit && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Group
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search groups or members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          {canEdit && <TabsTrigger value="unassigned">Unassigned Members</TabsTrigger>}
        </TabsList>
        <TabsContent value="grid" className="space-y-4">
          {filteredGroups.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No FHE Groups</CardTitle>
                <CardDescription>
                  {searchQuery ? "No groups match your search criteria." : "There are no FHE groups created yet."}
                </CardDescription>
              </CardHeader>
              {canEdit && !searchQuery && (
                <CardContent>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Create First Group
                  </Button>
                </CardContent>
              )}
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{group.name}</CardTitle>
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(group)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                    <CardDescription>
                      <div className="flex items-center justify-between">
                        <span>Leader: {group.leader}</span>
                        <Badge variant="outline">{group.members.length} members</Badge>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Meeting Time:</span> {group.meetingTime}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Location:</span> {group.location}
                      </div>
                      {group.activityImage && (
                        <div className="pt-2">
                          <h4 className="text-sm font-medium mb-2">Activity Flyer:</h4>
                          <img
                            src={group.activityImage || "/placeholder.svg"}
                            alt="Activity Flyer"
                            className="w-full h-auto rounded-md border"
                          />
                        </div>
                      )}
                      <div className="pt-2">
                        <h4 className="text-sm font-medium mb-2">Members:</h4>
                        <div className="space-y-1">
                          {group.members
                            .sort((a, b) => a.lastName.localeCompare(b.lastName))
                            .map((member) => (
                              <div key={member.id} className="text-sm">
                                {member.firstName} {member.lastName}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        {canEdit && (
          <TabsContent value="unassigned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Unassigned Members</CardTitle>
                <CardDescription>
                  These members are not currently assigned to any FHE group. Select a group to assign them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Assign To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnassignedMembers.length > 0 ? (
                      filteredUnassignedMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.firstName} {member.lastName}
                          </TableCell>
                          <TableCell>{member.email || "-"}</TableCell>
                          <TableCell>{member.phone || "-"}</TableCell>
                          <TableCell>
                            <Select onValueChange={(value) => handleAssignToGroup(member.id, value)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                              <SelectContent>
                                {groups.map((group) => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No unassigned members found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {canEdit && (
        <FheGroupDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          group={selectedGroup}
          onGroupSaved={(savedGroup) => {
            if (selectedGroup) {
              // Update existing group
              setGroups(groups.map((g) => (g.id === savedGroup.id ? savedGroup : g)))
            } else {
              // Add new group
              setGroups([...groups, savedGroup])
            }
          }}
        />
      )}
    </div>
  )
}
