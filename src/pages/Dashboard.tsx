import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Plus, Search, BarChart3, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react'

interface Report {
  id: string
  domain: string
  status: string
  overall_score: number | null
  critical_issues: number | null
  created_at: string
  completed_at: string | null
}

export default function Dashboard() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [fetchingReports, setFetchingReports] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFetchingReports(false)
    }
  }

  async function handleStartAudit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      if (res.ok) {
        const report = await res.json()
        toast.success('Audit started')
        navigate(`/reports/${report.id}`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to start audit')
      }
    } catch (err) {
      toast.error('Failed to start audit')
    } finally {
      setLoading(false)
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">SEOCrawler</span>
          </div>
          <div className="flex items-center gap-4">
            {user?.is_admin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">Admin</Button>
              </Link>
            )}
            <Button variant="ghost" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Start New Audit */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Run New Audit</CardTitle>
            <CardDescription>Enter a domain to audit</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartAudit} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  'Starting...'
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Start Audit
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Reports</CardTitle>
            <CardDescription>View and manage your SEO audits</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingReports ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : reports.length === 0 ? (
              <p className="text-muted-foreground">No reports yet. Start your first audit above.</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/reports/${report.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{report.domain}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {report.overall_score !== null && (
                        <div className="text-right">
                          <p className="font-medium">{report.overall_score}/100</p>
                          <p className="text-sm text-muted-foreground">
                            {report.critical_issues} issues
                          </p>
                        </div>
                      )}
                      {getStatusIcon(report.status)}
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}