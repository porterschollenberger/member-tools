"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  type UserRole,
  type Permission,
  type PermissionResource,
  type PermissionAction,
  getDefaultPermissions,
} from "@/context/auth-context"
import { createUser, updateUser, updateUserPermissions } from "@/services/users"
import { Loader2 } from "lucide-react"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userData: any | null
  onSuccess?: () => void
}

export function UserDialog({ open, onOpenChange, userData, onSuccess }: UserDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member" as UserRole,
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  })
  const [activeTab, setActiveTab] = useState("general")
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [useCustomPermissions, setUseCustomPermissions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Resources for permissions
  const resources: { id: PermissionResource; name: string }[] = [
    { id: "dashboard", name: "Dashboard" },
    { id: "members", name: "Members" },
    { id: "callings", name: "Callings" },
    { id: "fhe_groups", name: "FHE Groups" },
    { id: "calendar", name: "Calendar" },
    { id: "survey", name: "New Member Survey" },
    { id: "survey_responses", name: "Survey Responses" },
    { id: "users", name: "User Management" },
  ]

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        role: (userData.role as UserRole) || "member",
        password: "",
        confirmPassword: "",
      })

      // Set permissions from user data or default permissions
      const userPermissions = userData.permissions || getDefaultPermissions(userData.role)
      setPermissions(userPermissions)

      // Check if using custom permissions
      const defaultPermissions = getDefaultPermissions(userData.role)
      const isCustom = JSON.stringify(userPermissions.sort()) !== JSON.stringify(defaultPermissions.sort())
      setUseCustomPermissions(isCustom)
    } else {
      setFormData({
        name: "",
        email: "",
        role: "member" as UserRole,
        password: "",
        confirmPassword: "",
      })
      setPermissions(getDefaultPermissions("member"))
      setUseCustomPermissions(false)
    }

    setErrors({
      password: "",
      confirmPassword: "",
    })

    setActiveTab("general")
    setIsSubmitting(false)
  }, [userData, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear errors when typing
    if (name === "password" || name === "confirmPassword") {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserRole }))

    // Update permissions based on role if not using custom permissions
    if (!useCustomPermissions) {
      setPermissions(getDefaultPermissions(value as UserRole))
    }
  }

  const handlePermissionChange = (resource: PermissionResource, action: PermissionAction, checked: boolean) => {
    if (checked) {
      // Add permission
      setPermissions((prev) => [...prev, { resource, action }])
    } else {
      // Remove permission
      setPermissions((prev) => prev.filter((p) => !(p.resource === resource && p.action === action)))
    }
  }

  const handleUseCustomPermissions = (checked: boolean) => {
    setUseCustomPermissions(checked)

    // If switching back to role-based permissions, reset to defaults
    if (!checked) {
      setPermissions(getDefaultPermissions(formData.role))
    }
  }

  const hasPermission = (resource: PermissionResource, action: PermissionAction) => {
    return permissions.some((p) => p.resource === resource && p.action === action)
  }

  const validateForm = () => {
    let valid = true
    const newErrors = { ...errors }

    // Only validate password fields for new users
    if (!userData) {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters"
        valid = false
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
        valid = false
      }
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      if (userData) {
        // Update existing user
        await updateUser(userData.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        })

        // Update permissions if using custom permissions
        if (useCustomPermissions) {
          await updateUserPermissions(userData.id, permissions)
        } else {
          // Reset to default permissions
          await updateUserPermissions(userData.id, getDefaultPermissions(formData.role))
        }

        toast({
          title: "User Updated",
          description: `${formData.name} has been updated successfully.`,
        })
      } else {
        // Create new user
        await createUser(
          {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            permissions: useCustomPermissions ? permissions : undefined,
            status: "active",
          },
          formData.password,
        )

        toast({
          title: "User Added",
          description: `${formData.name} has been added successfully.`,
        })
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: `Failed to ${userData ? "update" : "add"} user. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{userData ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {userData ? "Update the user's information below." : "Enter the new user's information below."}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={handleSelectChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bishopric">Bishopric</SelectItem>
                    <SelectItem value="ward_clerk">Ward Clerk</SelectItem>
                    <SelectItem value="elders_quorum">Elders Quorum</SelectItem>
                    <SelectItem value="relief_society">Relief Society</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!userData && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!userData}
                      />
                      {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="confirmPassword" className="text-right">
                      Confirm Password
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required={!userData}
                      />
                      {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="permissions" className="py-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="customPermissions"
                  checked={useCustomPermissions}
                  onCheckedChange={handleUseCustomPermissions}
                />
                <label
                  htmlFor="customPermissions"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Use custom permissions (override role-based permissions)
                </label>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-6">
                  {resources.map((resource) => (
                    <div key={resource.id} className="space-y-2">
                      <h3 className="text-sm font-medium">{resource.name}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${resource.id}-view`}
                            checked={hasPermission(resource.id, "view")}
                            onCheckedChange={(checked) => handlePermissionChange(resource.id, "view", checked === true)}
                            disabled={!useCustomPermissions}
                          />
                          <label
                            htmlFor={`${resource.id}-view`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            View
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${resource.id}-edit`}
                            checked={hasPermission(resource.id, "edit")}
                            onCheckedChange={(checked) => handlePermissionChange(resource.id, "edit", checked === true)}
                            disabled={!useCustomPermissions}
                          />
                          <label
                            htmlFor={`${resource.id}-edit`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Edit
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <p className="text-sm text-muted-foreground mt-4">
                {useCustomPermissions
                  ? "Custom permissions are applied. These override the default role-based permissions."
                  : `Using default permissions for role: ${formData.role}. Enable custom permissions to modify.`}
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {userData ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>{userData ? "Update" : "Add"} User</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
