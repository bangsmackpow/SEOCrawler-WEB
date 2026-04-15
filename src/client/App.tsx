import { Link, Outlet, createRootRoute } from '@tanstack/react-start'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <nav className="container flex h-16 items-center justify-between px-4">
            <Link to="/" className="text-xl font-bold">
              SEOCrawler
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-sm hover:underline">
                Dashboard
              </Link>
              <Link to="/login" className="text-sm hover:underline">
                Login
              </Link>
            </div>
          </nav>
        </header>
        <main className="container py-8">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  )
}

function Index() {
  return (
    <div className="text-center py-24">
      <h1 className="text-4xl font-bold">SEO Audit Platform</h1>
      <p className="mt-4 text-muted-foreground">
        Run comprehensive SEO audits on any domain
      </p>
      <Link
        to="/register"
        className="mt-8 inline-block rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
      >
        Get Started
      </Link>
    </div>
  )
}

export const route = createRootRoute({
  component: Root,
  staticData: {
    path: '/',
  },
  routes: [
    {
      path: '/',
      component: Index,
    },
    {
      path: '/dashboard',
      component: function Dashboard() {
        return <div>Dashboard - Coming Soon</div>
      },
    },
    {
      path: '/login',
      component: function Login() {
        return <div>Login - Coming Soon</div>
      },
    },
    {
      path: '/register',
      component: function Register() {
        return <div>Register - Coming Soon</div>
      },
    },
  ],
})

export default route