"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, AlertCircle, AlertTriangle, ClipboardList, UserMinus } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalMembers: 0,
    openCallings: 0,
    membersNeedingCallings: 0,
    recentActivity: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch total members
        const { count: membersCount } = await supabase.from("members").select("*", { count: "exact", head: true })

        // Fetch open callings
        const { count: openCallingsCount } = await supabase
          .from("callings")
          .select("*", { count: "exact", head: true })
          .eq("status", "vacant")

        // Fetch members without callings
        const { data: membersWithCallings } = await supabase
          .from("callings")
          .select("member_id")
          .not("member_id", "is", null)

        const uniqueMembersWithCallings = new Set(membersWithCallings?.map((c) => c.member_id) || [])
        const membersNeedingCallingsCount = (membersCount || 0) - uniqueMembersWithCallings.size

        // Fetch recent activity (could be from various tables)
        const { data: recentSurveys } = await supabase
          .from("survey_responses")
          .select("*")
          .order("submitted_at", { ascending: false })
          .limit(3)

        const { data: recentLcrUpdates } = await supabase
          .from("lcr_update_tasks")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3)

        // Combine and sort recent activity
        const recentActivity = [
          ...(recentSurveys || []).map((survey) => ({
            type: "survey",
            title: "New survey submission",
            description: `${survey.full_name} completed the new member survey`,
            date: survey.submitted_at,
          })),
          ...(recentLcrUpdates || []).map((update) => ({
            type: update.type,
            title: update.description,
            description: update.details?.notes || "",
            date: update.created_at,
          })),
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 4)

        setStats({
          totalMembers: membersCount || 0,
          openCallings: openCallingsCount || 0,
          membersNeedingCallings: membersNeedingCallingsCount,
          recentActivity,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-6 w-16 animate-pulse rounded bg-muted"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Callings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-6 w-16 animate-pulse rounded bg-muted"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.openCallings}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members Needing Callings</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-6 w-16 animate-pulse rounded bg-muted"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.membersNeedingCallings}</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                      <div className="h-3 w-48 animate-pulse rounded bg-muted"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`rounded-full p-2 ${getActivityIconClass(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">{formatRelativeTime(activity.date)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-center text-muted-foreground">
                <p>No recent activity to display</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                      <div className="h-3 w-24 animate-pulse rounded bg-muted"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <UpcomingEvents />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function UpcomingEvents() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    async function fetchEvents() {
      const today = new Date().toISOString().split("T")[0]

      const { data } = await supabase.from("events").select("*").gte("date", today).order("date").order("time").limit(3)

      setEvents(data || [])
    }

    fetchEvents()
  }, [])

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-center text-muted-foreground">
        <p>No upcoming events</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex items-center gap-4">
          <div className="rounded-full bg-purple-100 p-2">
            <AlertCircle className="h-4 w-4 text-purple-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{event.title}</p>
            <p className="text-xs text-muted-foreground">{formatEventDateTime(event.date, event.time)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function getActivityIcon(type) {
  switch (type) {
    case "survey":
      return <ClipboardList className="h-4 w-4" />
    case "new_member":
      return <Users className="h-4 w-4" />
    case "calling_sustained":
    case "calling_set_apart":
      return <Briefcase className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

function getActivityIconClass(type) {
  switch (type) {
    case "survey":
      return "bg-blue-100 text-blue-500"
    case "new_member":
      return "bg-blue-100 text-blue-500"
    case "calling_sustained":
    case "calling_set_apart":
      return "bg-green-100 text-green-500"
    default:
      return "bg-amber-100 text-amber-500"
  }
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

  return date.toLocaleDateString()
}

function formatEventDateTime(dateString, timeString) {
  const date = new Date(`${dateString}T${timeString}`)
  const options = { weekday: "long", hour: "numeric", minute: "2-digit" }
  return date.toLocaleString("en-US", options)
}
