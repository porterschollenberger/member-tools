"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users,
  Briefcase,
  Home,
  UserCog,
  Settings,
  ClipboardList,
  Calendar,
  ClipboardCheck,
  FileText,
} from "lucide-react"
import { useAuth, type PermissionResource } from "@/context/auth-context"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  resource: PermissionResource
  public: boolean
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    resource: "dashboard",
    public: false,
  },
  {
    title: "Members",
    href: "/dashboard/members",
    icon: Users,
    resource: "members",
    public: false,
  },
  {
    title: "Callings",
    href: "/dashboard/callings",
    icon: Briefcase,
    resource: "callings",
    public: false,
  },
  {
    title: "FHE Groups",
    href: "/dashboard/fhe-groups",
    icon: UserCog,
    resource: "fhe_groups",
    public: true,
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    resource: "calendar",
    public: true,
  },
  {
    title: "New Member Survey",
    href: "/dashboard/survey",
    icon: ClipboardList,
    resource: "survey",
    public: false,
  },
  {
    title: "Survey Responses",
    href: "/dashboard/survey-responses",
    icon: ClipboardCheck,
    resource: "survey_responses",
    public: false,
  },
  {
    title: "LCR Updates",
    href: "/dashboard/lcr-updates",
    icon: FileText,
    resource: "members",
    public: false,
  },
  {
    title: "User Management",
    href: "/dashboard/users",
    icon: Settings,
    resource: "users",
    public: false,
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, hasResourcePermission } = useAuth()

  if (!user) return null

  return (
    <ScrollArea className="h-full py-6 pr-6">
      <nav className="grid gap-2 px-2">
        {navItems
          .filter((item) => {
            // Public pages are always shown
            if (item.public) return true

            // Special case for LCR Updates - only show to users with edit permission on members
            if (item.href === "/dashboard/lcr-updates") {
              return hasResourcePermission("members", "edit")
            }
            return hasResourcePermission(item.resource, "view")
          })
          .map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  pathname === item.href ? "bg-muted font-medium" : "font-normal",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
      </nav>
    </ScrollArea>
  )
}
