/**
 * Component Tests for AvatarUpload
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AvatarUpload from '@/components/features/AvatarUpload'

const mockUpload = vi.fn()
const mockRemove = vi.fn()

vi.mock('@/lib/supabase-client', () => ({
  getBrowserClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: () => ({ data: { publicUrl: 'http://example.com/avatar.jpg' } }),
      }),
    },
    from: () => ({
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  }),
}))

describe('AvatarUpload', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should render upload button', () => {
    render(<AvatarUpload userId="1" currentAvatarUrl={null} />, { wrapper })
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should display current avatar if provided', () => {
    render(<AvatarUpload userId="1" currentAvatarUrl="http://example.com/current.jpg" />, {
      wrapper,
    })
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', expect.stringContaining('current.jpg'))
  })

  it('should accept file input', async () => {
    render(<AvatarUpload userId="1" currentAvatarUrl={null} />, { wrapper })

    const input = screen.getByLabelText(/upload avatar/i) as HTMLInputElement
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(input.files?.[0]).toBe(file)
  })

  it('should show file size limit', () => {
    render(<AvatarUpload userId="1" currentAvatarUrl={null} />, { wrapper })
    expect(screen.getByText(/max.*mb/i)).toBeInTheDocument()
  })
})
