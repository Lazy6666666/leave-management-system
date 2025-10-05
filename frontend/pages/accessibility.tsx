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

      {/* Main Content */}
      <main id="main-content" className="container-page py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-2">
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
              WCAG 2.1 Level AA Compliant
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Accessibility Statement
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              LeaveFlow is committed to ensuring digital accessibility for people with disabilities. 
              We continually improve the user experience for everyone and apply relevant accessibility standards.
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>

          {/* Conformance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Conformance Status</CardTitle>
              <CardDescription>
                Our commitment to web accessibility standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Fully Conformant</p>
                  <p className="text-sm text-muted-foreground">
                    The content fully conforms to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standard.
                  </p>
                </div>
              </div>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <p>This means our website:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Is perceivable - Information and user interface components are presentable to users in ways they can perceive</li>
                  <li>Is operable - User interface components and navigation are operable</li>
                  <li>Is understandable - Information and operation of the user interface are understandable</li>
                  <li>Is robust - Content can be interpreted reliably by a wide variety of user agents, including assistive technologies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Features */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Accessibility Features</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Keyboard Navigation */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg">Keyboard Navigation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>All features accessible via keyboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Visible focus indicators</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Skip navigation links</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Logical tab order</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Screen Reader Support */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Eye className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg">Screen Reader Support</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Semantic HTML structure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>ARIA labels and landmarks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Alternative text for images</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Status announcements</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Visual Design */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Monitor className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg">Visual Design</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>WCAG AA color contrast ratios</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Dark and light mode support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Resizable text up to 200%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Reduced motion support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Mobile Accessibility */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg">Mobile Accessibility</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Touch targets 44x44px minimum</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Responsive design</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Mobile screen reader support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Portrait and landscape modes</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Compatible Technologies */}
          <Card>
            <CardHeader>
              <CardTitle>Compatible Technologies</CardTitle>
              <CardDescription>
                Our website is designed to work with the following assistive technologies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Screen Readers</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• NVDA (Windows)</li>
                    <li>• JAWS (Windows)</li>
                    <li>• VoiceOver (macOS, iOS)</li>
                    <li>• TalkBack (Android)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Browsers</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Chrome (latest)</li>
                    <li>• Firefox (latest)</li>
                    <li>• Safari (latest)</li>
                    <li>• Edge (latest)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testing and Evaluation */}
          <Card>
            <CardHeader>
              <CardTitle>Testing and Evaluation</CardTitle>
              <CardDescription>
                How we ensure accessibility compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Automated Testing</h3>
                <p className="text-sm text-muted-foreground">
                  We use automated accessibility testing tools including axe DevTools, Lighthouse, and WAVE 
                  to identify and fix accessibility issues during development.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Manual Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Our team regularly tests the website using keyboard navigation, screen readers, and other 
                  assistive technologies to ensure a quality experience for all users.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">User Testing</h3>
                <p className="text-sm text-muted-foreground">
                  We conduct usability testing with people who use assistive technologies to gather real-world 
                  feedback and continuously improve accessibility.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback and Contact</CardTitle>
              <CardDescription>
                We welcome your feedback on the accessibility of LeaveFlow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you encounter any accessibility barriers while using our website, please let us know. 
                We are committed to providing an accessible experience for all users and will work to address 
                any issues promptly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="default" asChild>
                  <a href="mailto:accessibility@leaveflow.com">
                    <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                    Email Accessibility Team
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a 
                    href="https://github.com/leaveflow/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Report Issue on GitHub
                    <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                We aim to respond to accessibility feedback within 2 business days.
              </p>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
              <CardDescription>
                Standards and technologies used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Accessibility Standard:</span>
                  <span className="text-muted-foreground ml-2">WCAG 2.1 Level AA</span>
                </div>
                <div>
                  <span className="font-medium">Technologies:</span>
                  <span className="text-muted-foreground ml-2">HTML5, CSS3, JavaScript, ARIA</span>
                </div>
                <div>
                  <span className="font-medium">Framework:</span>
                  <span className="text-muted-foreground ml-2">Next.js with React</span>
                </div>
                <div>
                  <span className="font-medium">Testing Tools:</span>
                  <span className="text-muted-foreground ml-2">axe DevTools, Lighthouse, WAVE, Playwright</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limitations and Alternatives */}
          <Card>
            <CardHeader>
              <CardTitle>Known Limitations</CardTitle>
              <CardDescription>
                Current limitations and planned improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We are not currently aware of any significant accessibility limitations. However, we continuously 
                monitor and test our website to identify and address any issues that may arise.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                If you discover any accessibility barriers, please contact us so we can work to resolve them.
              </p>
            </CardContent>
          </Card>

          {/* Formal Complaints */}
          <Card>
            <CardHeader>
              <CardTitle>Formal Complaints</CardTitle>
              <CardDescription>
                Process for filing accessibility complaints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you are not satisfied with our response to your accessibility concern, you may file a formal complaint:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Contact our accessibility team at accessibility@leaveflow.com</li>
                <li>Provide details about the accessibility barrier you encountered</li>
                <li>Include information about the assistive technology you were using</li>
                <li>We will investigate and respond within 5 business days</li>
              </ol>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>
              This accessibility statement was last reviewed and updated on January 2025.
            </p>
            <p className="mt-2">
              We are committed to maintaining and improving the accessibility of our website.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
