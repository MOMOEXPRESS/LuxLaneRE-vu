"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-client"
import { ShieldAlert, CheckCircle, XCircle } from "lucide-react"

export function ModerationDashboard() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    const res = await api.getReports()
    const data = res.data as { reports?: any[] } | undefined
    setReports(data?.reports || [])
    setLoading(false)
  }

  const handleAction = async (reportId: string, action: "dismiss" | "resolve") => {
    await api.updateReport(reportId, action === "resolve" ? "RESOLVED" : "DISMISSED")
    loadReports()
  }

  if (loading) return <div className="p-4 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Reports</h2>
        <Badge variant="secondary">{reports.length}</Badge>
      </div>
      {reports.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No pending reports</p>
      ) : (
        reports.map(report => (
          <Card key={report.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">Report: {report.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reported by {report.reporterUsername} · Target: {report.targetUsername}
                </p>
                {report.details && (
                  <p className="text-sm text-muted-foreground mt-2">{report.details}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleAction(report.id, "dismiss")}>
                  <XCircle className="w-3 h-3 mr-1" /> Dismiss
                </Button>
                <Button size="sm" onClick={() => handleAction(report.id, "resolve")}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
