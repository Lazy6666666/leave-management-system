import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { 
  CalendarDays, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle, 
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Star,
  Sparkles,
  Globe,
  Smartphone,
  TrendingUp
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="relative z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <CalendarDays className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">LeaveFlow</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  Enterprise
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90">
                  Employee Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Trusted by 10,000+ organizations worldwide
              </Badge>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Streamline Your
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}Leave Management
              </span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Empower your team with intelligent leave tracking, seamless approvals, 
              and comprehensive workforce planning. Built for modern organizations that value efficiency.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-3 text-base w-full sm:w-auto">
                  <Zap className="mr-2 h-5 w-5" />
                  Access Your Account
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-3 text-base w-full sm:w-auto">
                <Globe className="mr-2 h-5 w-5" />
                View Demo
              </Button>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Need an account? Contact your HR department for secure access.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">10k+</div>
                <div className="text-sm text-muted-foreground">Organizations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">500k+</div>
                <div className="text-sm text-muted-foreground">Employees</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Star className="mr-2 h-4 w-4" />
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to manage leave
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comprehensive tools designed for HR teams, managers, and employees
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Cards */}
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors">
                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">Smart Requests</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Intelligent leave requests with automatic balance checking, 
                  conflict detection, and policy compliance validation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20 group-hover:bg-green-200 dark:group-hover:bg-green-900/40 transition-colors">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl">Instant Approvals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Streamlined approval workflows with mobile notifications, 
                  delegation options, and comprehensive audit trails.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/40 transition-colors">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl">Team Calendar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Visual team availability with capacity planning, 
                  holiday management, and intelligent resource allocation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/40 transition-colors">
                    <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-xl">Advanced Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Comprehensive reporting with leave trends, utilization metrics, 
                  and actionable workforce insights powered by AI.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 group-hover:bg-red-200 dark:group-hover:bg-red-900/40 transition-colors">
                    <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-xl">Document Hub</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Centralized document management with expiry tracking, 
                  automated notifications, and compliance monitoring.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/20 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/40 transition-colors">
                    <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-xl">Enterprise Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Role-based access control, end-to-end encryption, 
                  and compliance with GDPR, SOC 2, and ISO 27001 standards.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary/5 dark:bg-primary/10 border-y">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4">
                <TrendingUp className="mr-2 h-4 w-4" />
                Ready to get started?
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Transform your leave management today
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Join thousands of organizations already using LeaveFlow to streamline 
                their workforce management and improve employee satisfaction.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-3 text-base w-full sm:w-auto">
                    <Zap className="mr-2 h-5 w-5" />
                    Access Your Account
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8 py-3 text-base w-full sm:w-auto">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Mobile App
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <CalendarDays className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">LeaveFlow</span>
              <Badge variant="secondary" className="text-xs">
                Enterprise
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 LeaveFlow. All rights reserved. Built with ❤️ for modern teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}