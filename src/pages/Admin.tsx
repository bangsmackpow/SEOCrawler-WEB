import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Settings, Users, Key, Save, Trash2, Eye, EyeOff } from 'lucide-react'

interface SettingsData {
  openrouter_api_key: string
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_from: string
  default_agency_name: string
  site_url: string
}

interface UserRecord {
  id: string
  email: string
  name: string
  is_admin: boolean
  created_at: string
}

export default function Admin() {
  const [settings, setSettings] = useState<SettingsData>({
    openrouter_api_key: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_from: '',
    default_agency_name: 'My Agency',
    site_url: '',
  })
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserName, setNewUserName] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [settingsRes, usersRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/users'),
      ])
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data)
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success('Settings saved')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
        }),
      })
      if (res.ok) {
        toast.success('User added')
        setNewUserEmail('')
        setNewUserPassword('')
        setNewUserName('')
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to add user')
      }
    } catch (err) {
      toast.error('Failed to add user')
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('User deleted')
        fetchData()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (err) {
      toast.error('Failed to delete user')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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
            <span className="text-xl font-bold">Admin</span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure API keys and site settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label>OpenRouter API Key</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={settings.openrouter_api_key}
                      onChange={(e) =>
                        setSettings({ ...settings, openrouter_api_key: e.target.value })
                      }
                      placeholder="sk-or-..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Default Agency Name</Label>
                  <Input
                    value={settings.default_agency_name}
                    onChange={(e) =>
                      setSettings({ ...settings, default_agency_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Site URL</Label>
                  <Input
                    value={settings.site_url}
                    onChange={(e) =>
                      setSettings({ ...settings, site_url: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input
                      value={settings.smtp_host}
                      onChange={(e) =>
                        setSettings({ ...settings, smtp_host: e.target.value })
                      }
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input
                      value={settings.smtp_port}
                      onChange={(e) =>
                        setSettings({ ...settings, smtp_port: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>SMTP Username</Label>
                  <Input
                    value={settings.smtp_user}
                    onChange={(e) =>
                      setSettings({ ...settings, smtp_user: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>SMTP From Email</Label>
                  <Input
                    value={settings.smtp_from}
                    onChange={(e) =>
                      setSettings({ ...settings, smtp_from: e.target.value })
                    }
                    placeholder="noreply@example.com"
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Add and manage users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add User Form */}
              <form onSubmit={handleAddUser} className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">Add New User</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <Button type="submit">Add User</Button>
              </form>

              {/* Users List */}
              <div className="space-y-2">
                <h3 className="font-medium">Existing Users</h3>
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.is_admin && (
                        <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                      {!user.is_admin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}