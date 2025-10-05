/**
 * Accessibility Audit Script
 * Run this script to check for common accessibility issues in the application
 */

import { checkColorContrast } from '../lib/accessibility-utils'

// Color palette to test (from globals.css)
const colorPalette = {
  light: {
    background: '#FFFFFF',
    foreground: '#0A0A0A',
    primary: '#3B82F6',
    'primary-foreground': '#FAFAFA',
    secondary: '#F4F4F5',
    'secondary-foreground': '#18181B',
    muted: '#F4F4F5',
    'muted-foreground': '#71717A',
    destructive: '#EF4444',
    'destructive-foreground': '#FAFAFA',
    success: '#22C55E',
    'success-foreground': '#FAFAFA',
    warning: '#EAB308',
    'warning-foreground': '#FAFAFA',
    info: '#3B82F6',
    'info-foreground': '#1E293B',
  },
  dark: {
    background: '#0A0A0A',
    foreground: '#FAFAFA',
    primary: '#EBEBEB',
    'primary-foreground': '#18181B',
    secondary: '#27272A',
    'secondary-foreground': '#FAFAFA',
    muted: '#27272A',
    'muted-foreground': '#A1A1AA',
    destructive: '#DC2626',
    'destructive-foreground': '#FAFAFA',
    success: '#22C55E',
    'success-foreground': '#FAFAFA',
    warning: '#EAB308',
    'warning-foreground': '#18181B',
    info: '#3B82F6',
    'info-foreground': '#FAFAFA',
  },
}

interface ContrastResult {
  combination: string
  ratio: number
  passesAA: boolean
  passesAAA: boolean
  status: 'pass' | 'fail'
}

function auditColorContrast(): ContrastResult[] {
  const results: ContrastResult[] = []

  // Test light mode
  const lightTests = [
    { fg: 'foreground', bg: 'background', name: 'Body text' },
    { fg: 'primary-foreground', bg: 'primary', name: 'Primary button' },
    { fg: 'secondary-foreground', bg: 'secondary', name: 'Secondary button' },
    { fg: 'muted-foreground', bg: 'background', name: 'Muted text' },
    { fg: 'destructive-foreground', bg: 'destructive', name: 'Destructive button' },
    { fg: 'success-foreground', bg: 'success', name: 'Success badge' },
    { fg: 'warning-foreground', bg: 'warning', name: 'Warning badge' },
    { fg: 'info-foreground', bg: 'info', name: 'Info badge' },
  ]

  lightTests.forEach((test) => {
    const fg = colorPalette.light[test.fg as keyof typeof colorPalette.light]
    const bg = colorPalette.light[test.bg as keyof typeof colorPalette.light]
    const result = checkColorContrast(fg, bg)

    results.push({
      combination: `Light: ${test.name} (${test.fg} on ${test.bg})`,
      ratio: result.ratio,
      passesAA: result.passesAA,
      passesAAA: result.passesAAA,
      status: result.passesAA ? 'pass' : 'fail',
    })
  })

  // Test dark mode
  const darkTests = [
    { fg: 'foreground', bg: 'background', name: 'Body text' },
    { fg: 'primary-foreground', bg: 'primary', name: 'Primary button' },
    { fg: 'secondary-foreground', bg: 'secondary', name: 'Secondary button' },
    { fg: 'muted-foreground', bg: 'background', name: 'Muted text' },
    { fg: 'destructive-foreground', bg: 'destructive', name: 'Destructive button' },
    { fg: 'success-foreground', bg: 'success', name: 'Success badge' },
    { fg: 'warning-foreground', bg: 'warning', name: 'Warning badge' },
    { fg: 'info-foreground', bg: 'info', name: 'Info badge' },
  ]

  darkTests.forEach((test) => {
    const fg = colorPalette.dark[test.fg as keyof typeof colorPalette.dark]
    const bg = colorPalette.dark[test.bg as keyof typeof colorPalette.dark]
    const result = checkColorContrast(fg, bg)

    results.push({
      combination: `Dark: ${test.name} (${test.fg} on ${test.bg})`,
      ratio: result.ratio,
      passesAA: result.passesAA,
      passesAAA: result.passesAAA,
      status: result.passesAA ? 'pass' : 'fail',
    })
  })

  return results
}

function printAuditResults() {
  console.log('='.repeat(80))
  console.log('ACCESSIBILITY AUDIT RESULTS')
  console.log('='.repeat(80))
  console.log()

  console.log('COLOR CONTRAST AUDIT')
  console.log('-'.repeat(80))

  const contrastResults = auditColorContrast()
  const passed = contrastResults.filter((r) => r.status === 'pass').length
  const failed = contrastResults.filter((r) => r.status === 'fail').length

  contrastResults.forEach((result) => {
    const status = result.status === 'pass' ? '✓' : '✗'
    const aaStatus = result.passesAA ? 'AA ✓' : 'AA ✗'
    const aaaStatus = result.passesAAA ? 'AAA ✓' : 'AAA ✗'

    console.log(
      `${status} ${result.combination.padEnd(50)} ${result.ratio.toFixed(2)}:1 ${aaStatus} ${aaaStatus}`
    )
  })

  console.log()
  console.log(`Summary: ${passed} passed, ${failed} failed`)
  console.log()

  console.log('KEYBOARD NAVIGATION CHECKLIST')
  console.log('-'.repeat(80))
  console.log('☐ All interactive elements are keyboard accessible')
  console.log('☐ Tab order is logical and follows visual flow')
  console.log('☐ Focus indicators are visible on all interactive elements')
  console.log('☐ Skip links are present and functional')
  console.log('☐ Modal dialogs trap focus appropriately')
  console.log('☐ Dropdown menus can be navigated with arrow keys')
  console.log('☐ Forms can be submitted with Enter key')
  console.log('☐ Escape key closes modals and dropdowns')
  console.log()

  console.log('ARIA LABELS CHECKLIST')
  console.log('-'.repeat(80))
  console.log('☐ All icon-only buttons have aria-label')
  console.log('☐ All form inputs have associated labels')
  console.log('☐ All images have alt text')
  console.log('☐ Navigation landmarks are properly labeled')
  console.log('☐ Dynamic content changes are announced to screen readers')
  console.log('☐ Error messages are associated with form fields')
  console.log('☐ Loading states are announced')
  console.log()

  console.log('SEMANTIC HTML CHECKLIST')
  console.log('-'.repeat(80))
  console.log('☐ Proper heading hierarchy (h1 -> h2 -> h3)')
  console.log('☐ Lists use <ul>, <ol>, or <dl> elements')
  console.log('☐ Navigation uses <nav> element')
  console.log('☐ Main content uses <main> element')
  console.log('☐ Buttons use <button> element')
  console.log('☐ Links use <a> element with href')
  console.log()

  console.log('SCREEN READER TESTING')
  console.log('-'.repeat(80))
  console.log('☐ Test with NVDA (Windows)')
  console.log('☐ Test with JAWS (Windows)')
  console.log('☐ Test with VoiceOver (macOS/iOS)')
  console.log('☐ Test with TalkBack (Android)')
  console.log()

  console.log('='.repeat(80))
  console.log('END OF AUDIT')
  console.log('='.repeat(80))
}

// Run the audit
printAuditResults()
