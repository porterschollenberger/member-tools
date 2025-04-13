"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// Define user roles
export type UserRole = "admin" | "bishopric" | "elders_quorum" | "relief_society" | "ward_clerk" | "member"

// Define permission types
export type PermissionAction = "view" | "edit"

export type PermissionResource =
  | "dashboard"
  | "members"
  | "callings"
  | "fhe_groups"
  | "calendar"
  | "survey"
  | "survey_responses"
  | "users"

export type Permission = {
  resource: PermissionResource
  action: PermissionAction
}

// Define user type
export type User = {
  id: string
  email: string
  name: string
  role: UserRole
  permissions?: Permission[]
}

// Define auth context type
type AuthContextType = {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasPermission: (requiredRoles: UserRole[]) => boolean
  hasResourcePermission: (resource: PermissionResource, action: PermissionAction) => boolean
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default permissions based on role
export const getDefaultPermissions = (role: UserRole): Permission[] => {
  const allResources: PermissionResource[] = [
    "dashboard",
    "members",
    "callings",
    "fhe_groups",
    "calendar",
    "survey",
    "survey_responses",
    "users",
  ]

  switch (role) {
    case "admin":
      // Admin has all permissions
      return allResources.flatMap((resource) => [
        { resource, action: "view" },
        { resource, action: "edit" },
      ])

    case "bishopric":
      // Bishopric can view and edit everything except user management (which they can only view)
      return allResources.flatMap((resource) => [
        { resource, action: "view" },
        ...(resource !== "users" ? [{ resource, action: "edit" }] : []),
      ])

    case "ward_clerk":
      // Ward clerk can view and edit most things, but only view some
      return [
        { resource: "dashboard", action: "view" },
        { resource: "members", action: "view" },
        { resource: "members", action: "edit" },
        { resource: "callings", action: "view" },
        { resource: "callings", action: "edit" },
        { resource: "fhe_groups", action: "view" },
        { resource: "calendar", action: "view" },
        { resource: "calendar", action: "edit" },
        { resource: "survey", action: "view" },
        { resource: "survey_responses", action: "view" },
        { resource: "survey_responses", action: "edit" },
      ]

    case "elders_quorum":
    case "relief_society":
      // EQ and RS presidents can view and edit some things
      return [
        { resource: "dashboard", action: "view" },
        { resource: "members", action: "view" },
        { resource: "callings", action: "view" },
        { resource: "fhe_groups", action: "view" },
        { resource: "fhe_groups", action: "edit" },
        { resource: "calendar", action: "view" },
        { resource: "calendar", action: "edit" },
        { resource: "survey", action: "view" },
      ]

    case "member":
      // Regular members can only view certain things
      return [
        { resource: "dashboard", action: "view" },
        { resource: "calendar", action: "view" },
        { resource: "fhe_groups", action: "view" },
        { resource: "survey", action: "view" },
        { resource: "survey", action: "edit" },
      ]

    default:
      return []
  }
}

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    async function getInitialSession() {
      setIsLoading(true)

      try {
        // Get session from Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // Fetch user data from the database
          const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          if (error || !userData) {
            console.error("Error fetching user data:", error)
            setUser(null)
          } else {
            // Set user with permissions
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role as UserRole,
              permissions: (userData.permissions as Permission[]) || getDefaultPermissions(userData.role as UserRole),
            })
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error getting session:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Fetch user data from the database
        const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (error || !userData) {
          console.error("Error fetching user data:", error)
          setUser(null)
        } else {
          // Update last login time
          await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", session.user.id)

          // Set user with permissions
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role as UserRole,
            permissions: (userData.permissions as Permission[]) || getDefaultPermissions(userData.role as UserRole),
          })
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Redirect will happen automatically via the auth state change listener
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // Redirect will happen automatically via the auth state change listener
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  // Check if user has required role
  const hasPermission = (requiredRoles: UserRole[]) => {
    if (!user) return false
    if (user.role === "admin") return true // Admin has access to everything
    return requiredRoles.includes(user.role)
  }

  // Check if user has permission for a specific resource and action
  const hasResourcePermission = (resource: PermissionResource, action: PermissionAction) => {
    if (!user) return false

    // Admin has all permissions
    if (user.role === "admin") return true

    // Check custom permissions
    return (
      user.permissions?.some((permission) => permission.resource === resource && permission.action === action) ?? false
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        hasPermission,
        hasResourcePermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
