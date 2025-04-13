"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export default function SurveyPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    familyMembers: "",
    churchBackground: "active",
    interests: [] as string[],
    callingPreferences: "",
    additionalInfo: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, churchBackground: value }))
  }

  const handleCheckboxChange = (interest: string, checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        return { ...prev, interests: [...prev.interests, interest] }
      } else {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("survey_responses").insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        family_members: formData.familyMembers,
        church_background: formData.churchBackground,
        interests: formData.interests,
        calling_preferences: formData.callingPreferences,
        additional_info: formData.additionalInfo,
        submitted_at: new Date().toISOString(),
        processed: false,
      })

      if (error) throw error

      setIsSubmitted(true)
      toast({
        title: "Survey Submitted",
        description: "Thank you for submitting the new member survey!",
      })
    } catch (error) {
      console.error("Error submitting survey:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error submitting your survey. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Thank You!</CardTitle>
            <CardDescription>Your survey has been submitted successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              We appreciate you taking the time to fill out our new member survey. A ward leader will be in touch with
              you soon.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => (window.location.href = "/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">New Member Survey</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Ward!</CardTitle>
          <CardDescription>
            Please fill out this survey to help us get to know you better and find ways for you to get involved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyMembers">Family Members (names and ages)</Label>
                <Textarea
                  id="familyMembers"
                  name="familyMembers"
                  value={formData.familyMembers}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Church Background</Label>
                <RadioGroup value={formData.churchBackground} onValueChange={handleRadioChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="active" />
                    <Label htmlFor="active">Active Member</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="returning" id="returning" />
                    <Label htmlFor="returning">Returning Member</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="convert" id="convert" />
                    <Label htmlFor="convert">Recent Convert</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="investigating" id="investigating" />
                    <Label htmlFor="investigating">Investigating the Church</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Interests and Talents (select all that apply)</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    "Music",
                    "Teaching",
                    "Leadership",
                    "Service",
                    "Youth Programs",
                    "Sports",
                    "Family History",
                    "Temple Work",
                  ].map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={(checked) => handleCheckboxChange(interest, checked as boolean)}
                      />
                      <Label htmlFor={interest}>{interest}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="callingPreferences">Calling Preferences or Experience</Label>
                <Textarea
                  id="callingPreferences"
                  name="callingPreferences"
                  value={formData.callingPreferences}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Please share any previous callings or areas you'd like to serve in."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Additional Information</Label>
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Is there anything else you'd like us to know?"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Survey"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
