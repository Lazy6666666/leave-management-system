/**
 * Test User Fixtures
 *
 * Pre-configured test users for different roles
 * These should match users seeded in the test database
 */

export interface TestUser {
  email: string
  password: string
  role: 'employee' | 'manager' | 'hr' | 'admin'
  name: string
  department?: string
}

export const TEST_USERS: Record<string, TestUser> = {
  employee: {
    email: 'employee@test.com',
    password: 'Test123!@#',
    role: 'employee',
    name: 'Test Employee',
    department: 'Engineering',
  },
  manager: {
    email: 'manager@test.com',
    password: 'Test123!@#',
    role: 'manager',
    name: 'Test Manager',
    department: 'Engineering',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123!@#',
    role: 'hr',
    name: 'Test HR',
    department: 'Human Resources',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123!@#',
    role: 'admin',
    name: 'Test Admin',
    department: 'Management',
  },
}

export const getTestUser = (role: keyof typeof TEST_USERS): TestUser => {
  return TEST_USERS[role]
}
