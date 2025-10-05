/**
 * Accessibility utility functions for WCAG compliance
 */

/**
 * Calculate relative luminance of a color
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @returns Relative luminance value
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * (rs || 0) + 0.7152 * (gs || 0) + 0.0722 * (bs || 0)
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 First color in hex format (e.g., '#ffffff')
 * @param color2 Second color in hex format (e.g., '#000000')
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')

  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)

  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)

  const lum1 = getLuminance(r1, g1, b1)
  const lum2 = getLuminance(r2, g2, b2)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio Contrast ratio
 * @param level 'AA' or 'AAA'
 * @param isLargeText Whether the text is large (18pt+ or 14pt+ bold)
 * @returns Whether the contrast meets the standard
 */
export function meetsWCAGStandard(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * ARIA live region announcer for dynamic content
 * Useful for announcing status changes to screen readers
 */
export class LiveRegionAnnouncer {
  private static instance: LiveRegionAnnouncer
  private liveRegion: HTMLDivElement | null = null

  private constructor() {
    if (typeof window !== 'undefined') {
      this.createLiveRegion()
    }
  }

  static getInstance(): LiveRegionAnnouncer {
    if (!LiveRegionAnnouncer.instance) {
      LiveRegionAnnouncer.instance = new LiveRegionAnnouncer()
    }
    return LiveRegionAnnouncer.instance
  }

  private createLiveRegion() {
    this.liveRegion = document.createElement('div')
    this.liveRegion.setAttribute('role', 'status')
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')
    this.liveRegion.className = 'sr-only'
    document.body.appendChild(this.liveRegion)
  }

  /**
   * Announce a message to screen readers
   * @param message Message to announce
   * @param priority 'polite' (default) or 'assertive'
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) {
      this.createLiveRegion()
    }

    if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority)
      this.liveRegion.textContent = message

      // Clear after announcement
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = ''
        }
      }, 1000)
    }
  }
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnouncer() {
  const announcer = LiveRegionAnnouncer.getInstance()
  return {
    announce: (message: string, priority?: 'polite' | 'assertive') =>
      announcer.announce(message, priority),
  }
}

/**
 * Check color contrast and WCAG compliance
 * @param foreground Foreground color in hex format
 * @param background Background color in hex format
 * @returns Object with contrast ratio and WCAG compliance
 */
export function checkColorContrast(foreground: string, background: string) {
  const ratio = getContrastRatio(foreground, background)
  return {
    ratio,
    passesAA: meetsWCAGStandard(ratio, 'AA'),
    passesAAA: meetsWCAGStandard(ratio, 'AAA'),
  }
}

/**
 * Generate a unique ID for accessibility attributes
 * @param prefix Prefix for the ID
 * @returns Unique ID string
 */
export function generateA11yId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Check if an element is keyboard accessible
 * @param element HTML element to check
 * @returns Whether the element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  const interactiveElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']

  if (interactiveElements.includes(element.tagName)) {
    return true
  }

  if (element.hasAttribute('tabindex')) {
    const tabindex = element.getAttribute('tabindex')
    return tabindex !== '-1'
  }

  return false
}

/**
 * Get accessible name of an element
 * @param element HTML element
 * @returns Accessible name or null
 */
export function getAccessibleName(element: HTMLElement): string | null {
  // Check aria-label first
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  // Check title attribute
  const title = element.getAttribute('title')
  if (title) return title

  // Check text content
  const textContent = element.textContent?.trim()
  if (textContent) return textContent

  return null
}

/**
 * Validate field accessibility
 * @param element Form field element
 * @returns Validation result with issues
 */
export function validateFieldAccessibility(element: HTMLElement) {
  const issues: string[] = []

  // Check for label
  const hasLabel = getAccessibleName(element) !== null
  if (!hasLabel) {
    issues.push('Field is missing a label')
  }

  // Check required field has aria-required
  if ((element as HTMLInputElement).required && !element.hasAttribute('aria-required')) {
    issues.push('Required field should have aria-required attribute')
  }

  // Check invalid field has error message
  if (element.getAttribute('aria-invalid') === 'true' && !element.hasAttribute('aria-describedby')) {
    issues.push('Invalid field should have associated error message via aria-describedby')
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

/**
 * Check if an element is keyboard focusable
 * @param element HTML element to check
 * @returns Whether the element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ]

  return focusableElements.some((selector) => element.matches(selector))
}

/**
 * Trap focus within a container (useful for modals)
 * @param container Container element
 * @returns Cleanup function
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  // Focus first element
  firstElement?.focus()

  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}
