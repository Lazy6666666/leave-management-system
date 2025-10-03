import { useState } from 'react'
import { useAdminUsers, useUpdateUserRole, useDeactivateUser } from '@/hooks/use-admin'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Select } from '@/ui/select'
import { Badge } from '@/ui/badge'
import { Card } from '@/ui/card'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined)
  
  const { data, isLoading, isError, error } = useAdminUsers({ search, role: roleFilter })
  const updateRole = useUpdateUserRole()
  const deactivateUser = useDeactivateUser()

  const handleRoleUpdate = async (userId: string, newRole: 'employee' | 'manager' | 'admin' | 'hr') => {
    try {
      await updateRole.mutateAsync({ user_id: userId, new_role: newRole })
      alert('Role updated successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return
    
    try {
      await deactivateUser.mutateAsync(userId)
      alert('User deactivated successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate user')
    }
  }

  if (isLoading) {
    return <p>Loading users...</p>
  }

  if (isError) {
    return <p className="text-destructive">{error instanceof Error ? error.message : 'Failed to load users'}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">User Management</h2>
        <p className="text-sm text-muted-foreground">View and manage user roles and access.</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={roleFilter ?? ''}
          onChange={(e) => setRoleFilter(e.target.value || undefined)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="hr">HR</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="px-4 py-3">{user.full_name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.department ?? '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleUpdate(user.id, e.target.value as any)}
                      className="rounded border px-2 py-1 text-xs"
                      disabled={updateRole.isPending}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeactivate(user.id)}
                        disabled={deactivateUser.isPending}
                      >
                        Deactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {data?.users.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">No users found.</p>
      )}
    </div>
  )
}
