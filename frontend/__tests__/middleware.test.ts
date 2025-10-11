import { middleware } from '../middleware';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { vi } from 'vitest';

// Mocking Supabase client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('middleware', () => {
  let request: NextRequest;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock NextRequest
    request = {
      cookies: {
        get: vi.fn(),
      },
      headers: new Headers(),
      nextUrl: {
        pathname: '/dashboard',
      },
    } as unknown as NextRequest;
  });

  it('should handle errors when fetching user profile', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch profile');
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: '123' } } }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      }),
    };
    (createServerClient as any).mockReturnValue(mockSupabase);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await middleware(request);

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching user profile in middleware:',
      mockError
    );
    consoleErrorSpy.mockRestore();
  });
});