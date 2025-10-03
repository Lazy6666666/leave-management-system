import { describe, it, expect, vi } from 'vitest';
import { calculateBusinessDays } from '@/lib/api-client';

// Mock fetch for API client tests
global.fetch = vi.fn();

describe('calculateBusinessDays', () => {
  it('should return 0 for weekend-only periods', () => {
    const result = calculateBusinessDays('2024-01-13', '2024-01-14'); // Saturday to Sunday
    expect(result).toBe(0);
  });

  it('should return correct number of weekdays', () => {
    const result = calculateBusinessDays('2024-01-15', '2024-01-19'); // Monday to Friday
    expect(result).toBe(5);
  });

  it('should handle single day correctly', () => {
    const result = calculateBusinessDays('2024-01-15', '2024-01-15'); // Monday
    expect(result).toBe(1);
  });
});
