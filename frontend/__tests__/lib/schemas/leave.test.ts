import { leaveRequestSchema } from '@/lib/schemas/leave';

describe('leaveRequestSchema', () => {
  it('should invalidate a start_date in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const result = leaveRequestSchema.safeParse({
      leave_type_id: '1',
      start_date: pastDate.toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: 'This is a test reason.',
    });

    expect(result.success).toBe(false);
  });
});
