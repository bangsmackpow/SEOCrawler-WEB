import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { ArrowLeft, Download, Share2, RefreshCw, BarChart3, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ReportDetail {
  id: string
  domain: string
  client_name: string
  status: string
  overall_score: number | null
  critical_issues: number | null
  high_issues: number | null
  medium_issues: number | null
  created_at: string
  completed_at: string | null
  files: string[]
}

export default function ReportView() {
  const { id } = useParams()
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchReport()
  }, [id])

  async function fetchReport() {
    try {
      const res = await fetch(`/api/reports/${id}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      } else {
        toast.error('Report not found')
      }
    } catch (err) {
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  async function handleShare(email: string) {
    setSharing(true)
    try {
      const res = await fetch(`/api/reports/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success('Report shared')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to share')
      }
    } catch (err) {
      toast.error('Failed to share')
    } finally {
      setSharing(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'failed':
        return 'text-red-500'
      case 'running':
        return 'text-blue-500'
      default:
        return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Report not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">{report.domain}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={getStatusColor(report.status)}>
              {report.status === 'completed' && <CheckCircle className="mr-2 inline h-4 w-4" />}
              {report.status === 'failed' && <XCircle className="mr-2 inline h-4 w-4" />}
              {report.status === 'running' && <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />}
              {report.status}
            </span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {report.status === 'completed' ? (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Score Card */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-6xl font-bold">{report.overall_score}/100</p>
                </div>
              </CardContent>
            </Card>

            {/* Issues Card */}
            <Card>
              <CardHeader>
                <CardTitle>Issues Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-500">{report.critical_issues}</p>
                    <p className="text-sm text-muted-foreground">Critical</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-500">{report.high_issues}</p>
                    <p className="text-sm text-muted-foreground">High</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-500">{report.medium_issues}</p>
                    <p className="text-sm text-muted-foreground">Medium</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Files */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Download Reports</CardTitle>
                <CardDescription>Files generated from this audit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.files.map((file) => (
                    <a
                      key={file}
                      href={`/api/reports/${id}/download/${file}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <span className="font-mono text-sm">{file}</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Share Report</CardTitle>
                <CardDescription>Share this report with others via email</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const email = (e.target as HTMLFormElement).email.value
                    handleShare(email)
                  }}
                  className="flex gap-4"
                >
                  <input
                    name="email"
                    type="email"
                    placeholder="colleague@example.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                  <Button type="submit" disabled={sharing}>
                    {sharing ? 'Sharing...' : 'Share'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : report.status === 'running' ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h2 className="mt-4 text-xl font-semibold">Audit in Progress</h2>
              <p className="mt-2 text-muted-foreground">
                Running SEO crawl on {report.domain}. This typically takes 2-5 minutes.
              </p>
              <Button className="mt-4" onClick={fetchReport} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Status
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-xl font-semibold">Audit Failed</h2>
              <p className="mt-2 text-muted-foreground">
                Something went wrong. Please try again.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}