import Link from 'next/link'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { 
  CheckCircle2, 
  Keyboard, 
  Eye, 
  Smartphone, 
  Monitor,
  ArrowLeft,
  Mail,
  ExternalLink
} from 'lucide-react'

export default function AccessibilityStatement() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container-page">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl font-bold">LeaveFlow</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content was here - Temporarily removed for build debugging */}
    </div>
  )
}