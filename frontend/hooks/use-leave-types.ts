import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LeaveType } from '@/types';

interface LeaveTypesResponse {
  leave_types: LeaveType[];
}

interface LeaveTypeResponse {
  leave_type: LeaveType;
  message: string;
}

interface CreateLeaveTypeData {
  name: string;
  description?: string;
  default_allocation_days: number;
  is_active?: boolean;
}

interface UpdateLeaveTypeData {
  name?: string;
  description?: string;
  default_allocation_days?: number;
  is_active?: boolean;
}

export function useLeaveTypes(includeInactive = false) {
  return useQuery({
    queryKey: ['leave-types', includeInactive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeInactive) {
        params.append('include_inactive', 'true');
      }

      const response = await fetch(`/api/leave-types?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch leave types');
      }

      const data: LeaveTypesResponse = await response.json();
      return data.leave_types;
    },
    staleTime: 1000 * 60 * 60, // 1 hour - leave types rarely change
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLeaveTypeData) => {
      const response = await fetch('/api/leave-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create leave type');
      }

      const result: LeaveTypeResponse = await response.json();
      return result;
    },
    onSuccess: () => {
      // Invalidate all leave types queries
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    },
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLeaveTypeData }) => {
      const response = await fetch(`/api/leave-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update leave type');
      }

      const result: LeaveTypeResponse = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    },
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leave-types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete leave type');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    },
  });
}
