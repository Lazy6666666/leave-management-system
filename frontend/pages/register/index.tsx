import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  CalendarDays, 
  Shield, 
  AlertTriangle, 
  ArrowLeft,
  Clock,
  Users,
  Mail,
  Phone
} from 'lucide-react'

export default function Register() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login after 5 seconds
    const timer = setTimeout(() => {
      router.push('/login')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <CalendarDays className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">LeaveFlow</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  Enterprise
                </Badge>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Security Badge */}
          <div className="text-center">
            <Badge variant="destructive" className="px-4 py-2">
              <Shield className="mr-2 h-4 w-4" />
              Access Restricted
            </Badge>
          </div>

          <Card className="border-2 border-destructive/20 shadow-lg">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Registration Restricted
              </CardTitle>
              <CardDescription className="text-base">
                Employee accounts must be created by authorized administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Security Policy</p>
                    <p className="text-sm mt-1 opacity-90">
                      For security and compliance reasons, only HR administrators can create new employee accounts in our system.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">To request an account:</h3>
                <div className="grid gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Contact HR Department</p>
                      <p className="text-xs text-muted-foreground">Your HR team can create your account</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Email IT Support</p>
                      <p className="text-xs text-muted-foreground">Request account creation assistance</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Contact Your Manager</p>
                      <p className="text-xs text-muted-foreground">They can initiate the account request</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Link href="/login">
                  <Button className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Return to Home
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Redirecting to login in 5 seconds...</span>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This portal is monitored for security. All access attempts are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}