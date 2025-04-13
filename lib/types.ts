// Member types
export interface Member {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: "active" | "less-active"
  callings: string[]
  skills: string[]
  fheGroup: string
}

// Calling types
export interface Calling {
  id: string
  title: string
  organization: string
  status: "filled" | "vacant"
  member: string
  sustainedDate: string
  isSetApart: boolean
  notes: string
}

// FHE Group types
export interface FheGroup {
  id: string
  name: string
  leader: string
  members: string[]
  location: string
  meetingTime: string
}

// When we integrate with Supabase, we'll add database types here
export type Database = {}

// Add a new interface for survey submissions
export interface SurveySubmission {
  id: string
  fullName: string
  recordNumber: string
  birthDate: string
  email: string
  phone: string
  address: string
  familyMembers: string
  maritalStatus: string
  previousWard: string
  previousStake: string
  moveInDate: string
  isHomeowner: boolean
  isRenting: boolean
  skills: string
  interests: string
  callingPreferences: string
  additionalInfo: string
  submittedAt: string
  processed: boolean
}

export type UserRole = "admin" | "member" | "guest"

// Add a new interface for user accounts
export interface UserAccount {
  id: string
  name: string
  email: string
  role: UserRole
  lastLogin: string
  status: "active" | "inactive"
}

// New interface for LCR update tasks
export interface LcrUpdateTask {
  id: string
  type: "calling_sustained" | "calling_set_apart" | "new_member" | "released_from_calling" | "other"
  description: string
  details: {
    memberId?: string
    memberName?: string
    callingId?: string
    callingTitle?: string
    date?: string
    notes?: string
    [key: string]: any
  }
  createdAt: string
  createdBy: string
  completed: boolean
  completedAt?: string
  completedBy?: string
}
