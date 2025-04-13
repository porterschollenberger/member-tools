"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Check, RefreshCw, UserPlus, UserMinus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function LcrComparison() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [comparisonData, setComparisonData] = useState({
    missingInLocal: [],
    missingInLCR: [],
    lastSyncDate: null,
  })

  // In a real implementation, this would fetch data from an API that compares
  // your local database with LCR data. For now, we'll just show an empty state.
  useEffect(() => {
    // This would be replaced with actual data fetching
    setComparisonData({
      missingInLocal: [],
      missingInLCR: [],
      lastSyncDate: null,
    })
  }, [])

  const handleSync = async () => {
    setIsLoading(true)

    try {
      // This would be replaced with actual sync logic
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update with new data
      setComparisonData({
        ...comparisonData,
        lastSyncDate: new Date().toISOString(),
      })

      toast({
        title: "Sync Completed",
        description: "Member data has been synchronized with LCR.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "There was an error synchronizing with LCR. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>LCR Data Comparison</span>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Sync with LCR
          </Button>
        </CardTitle>
        <CardDescription>
          Compare local member data with LCR to ensure records are up to date.
          {comparisonData.lastSyncDate && (
            <span> Last synchronized: {new Date(comparisonData.lastSyncDate).toLocaleString()}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Members in LCR but missing locally ({comparisonData.missingInLocal.length})
          </h3>
          {comparisonData.missingInLocal.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Record Number</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.missingInLocal.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.recordNumber}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <UserPlus className="h-4 w-4" />
                        <span className="sr-only">Import</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center p-4 border rounded-md bg-muted/50">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>No discrepancies found with LCR</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Members locally but missing from LCR ({comparisonData.missingInLCR.length})
          </h3>
          {comparisonData.missingInLCR.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Record Number</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.missingInLCR.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.recordNumber}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <UserMinus className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center p-4 border rounded-md bg-muted/50">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>No discrepancies found with LCR</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
