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
import {
  Plus,
  MoreHorizontal,
  Search,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Pencil,
  KeyRound,
  Power,
  Loader2,
} from "lucide-react"
import { UserDialog } from "@/components/user-dialog"
import { DeleteUserDialog } from "@/components/delete-user-dialog"
import { getDefaultPermissions } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"

export default function UsersPage() {
  const { user, hasResourcePermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("users").select("*").order("name")

        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user && hasResourcePermission("users", "view")) {
      fetchUsers()
    }
  }, [user, hasResourcePermission])

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the user management page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check if user has view permission
  if (!hasResourcePermission("users", "view")) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to view the user management page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const canEdit = hasResourcePermission("users", "edit")

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleOpenDialog = (user = null) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleUserChange = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("users").select("*").order("name")

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "bishopric":
        return "default"
      case "ward_clerk":
        return "secondary"
      case "elders_quorum":
      case "relief_society":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "bishopric":
        return "Bishopric"
      case "ward_clerk":
        return "Ward Clerk"
      case "elders_quorum":
        return "Elders Quorum"
      case "relief_society":
        return "Relief Society"
      case "member":
        return "Member"
      default:
        return role
    }
  }

  // Check if user has custom permissions
  const hasCustomPermissions = (userData: any) => {
    if (!userData.permissions) return false

    const defaultPermissions = getDefaultPermissions(userData.role)
    const userPermissions = userData.permissions

    // Compare lengths first for quick check
    if (defaultPermissions.length !== userPermissions.length) return true

    // Sort and stringify for deep comparison
    const sortedDefaults = JSON.stringify(
      [...defaultPermissions].sort((a, b) => `${a.resource}-${a.action}`.localeCompare(`${b.resource}-${b.action}`)),
    )

    const sortedUserPerms = JSON.stringify(
      [...userPermissions].sort((a, b) => `${a.resource}-${a.action}`.localeCompare(`${b.resource}-${b.action}`)),
    )

    return sortedDefaults !== sortedUserPerms
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        {canEdit && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(u.role)}>{getRoleDisplayName(u.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        {hasCustomPermissions(u) ? (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            Custom
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === "active" ? "default" : "secondary"}>
                          {u.status === "active" ? "Active" : "Inactive"}
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(u)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canEdit && (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenDialog(u)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Power className="mr-2 h-4 w-4" />
                                  {u.status === "active" ? "Deactivate" : "Activate"} User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteUser(u)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {searchQuery ? "No users match your search." : "No users found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userData={selectedUser}
        onSuccess={handleUserChange}
      />

      {canEdit && (
        <DeleteUserDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          user={userToDelete}
          onSuccess={handleUserChange}
        />
      )}
    </div>
  )
}
