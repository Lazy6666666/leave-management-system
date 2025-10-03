import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMocks, RequestMethod } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as createLeaveHandler } from '@/app/api/leaves/route';
import { createClient } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';

// Mock Supabase client
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}));

// Mock auth utilities
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}));

describe('Authentication API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should create user successfully', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'profile-123', full_name: 'Test User' },
          error: null,
        }),
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
          department: 'Engineering',
        },
      });

      await signupHandler(req as any);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.user.id).toBe('user-123');
    });

    it('should handle signup errors', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'existing@example.com',
          password: 'password123',
          fullName: 'Test User',
        },
      });

      await signupHandler(req as any);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error.message).toBe('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user successfully', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123',
          },
        },
        error: null,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      await loginHandler(req as any);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.user.id).toBe('user-123');
      expect(responseData.access_token).toBe('token-123');
    });

    it('should handle invalid credentials', async () => {
      const mockSupabase = createClient() as any;
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'wrong@example.com',
          password: 'wrongpassword',
        },
      });

      await loginHandler(req as any);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error.message).toBe('Invalid login credentials');
    });
  });
});

describe('Leave Management API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/leaves', () => {
    it('should create leave request for authenticated user', async () => {
      const mockUser = { id: 'user-123', role: 'employee' };
      (getUser as any).mockResolvedValue(mockUser);

      const mockSupabase = createClient() as any;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'leave_types') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { default_allocation_days: 25 },
              error: null,
            }),
          };
        }
        if (table === 'leaves') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'leave-123',
                requester_id: 'user-123',
                status: 'pending',
                days_count: 5,
              },
              error: null,
            }),
          };
        }
        return {};
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          leave_type_id: 'annual',
          start_date: '2024-01-15',
          end_date: '2024-01-19',
          reason: 'Vacation',
        },
      });

      await createLeaveHandler(req as any);

      expect(getUser).toHaveBeenCalledWith(req);
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.id).toBe('leave-123');
    });

    it('should reject unauthenticated requests', async () => {
      (getUser as any).mockResolvedValue(null);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          leave_type_id: 'annual',
          start_date: '2024-01-15',
          end_date: '2024-01-19',
        },
      });

      await createLeaveHandler(req as any);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should handle insufficient leave balance', async () => {
      const mockUser = { id: 'user-123', role: 'employee' };
      (getUser as any).mockResolvedValue(mockUser);

      const mockSupabase = createClient() as any;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'leave_types') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { default_allocation_days: 25 },
              error: null,
            }),
          };
        }
        if (table === 'leaves') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            // Simulate that the user has already taken 23 days of annual leave
            reduce: vi.fn().mockReturnValue(23),
          };
        }
        return {};
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          leave_type_id: 'annual',
          start_date: '2024-01-15',
          end_date: '2024-01-19', // 5 business days
        },
      });

      await createLeaveHandler(req as any);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error.code).toBe('INSUFFICIENT_BALANCE');
    });
  });
});
