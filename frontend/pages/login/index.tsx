import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { getBrowserClient } from '@/lib/supabase-client'
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  AlertCircle,
  CheckCircle2,
  CalendarDays
} from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = getBrowserClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Login successful - wait for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col" suppressHydrationWarning>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" suppressHydrationWarning>
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" suppressHydrationWarning>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary" suppressHydrationWarning>
                <CalendarDays className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xl font-bold text-foreground">LeaveFlow</span>
                <Badge variant="secondary" className="text-xs w-fit">
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
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md space-y-4 md:space-y-6">
          {/* Security Badge */}
          <div className="text-center">
            <Badge variant="outline" className="px-4 py-2">
              <Shield className="mr-2 h-4 w-4" />
              Secure Employee Portal
            </Badge>
          </div>

          <Card className="border-2 border-primary/20 shadow-lg shadow-primary/10">
            <CardHeader className="text-center space-y-1.5 md:space-y-2 p-4 md:p-6">
              <CardTitle className="text-xl md:text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Sign in to access your leave management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSignIn} className="space-y-3 md:space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Sign in failed</p>
                      <p className="text-sm opacity-90">{error}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Work Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-primary/20 focus:border-primary focus:ring-primary/20"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10 border-primary/20 focus:border-primary focus:ring-primary/20"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Sign In</span>
                    </div>
                  )}
                </Button>
              </form>

                <div className="text-center space-y-3">
                  <div className="border-t border-border pt-4">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide font-medium mb-3">
                      Need help?
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Forgot your password? Contact your IT administrator.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Need an account? Contact your HR department.
                      </p>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This is a secure employee portal. All access is logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}