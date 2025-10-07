import { useState } from 'react'
import { useAdminUsers, useUpdateUserRole, useDeactivateUser } from '@/hooks/use-admin'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Badge } from '@/ui/badge'
import { Card, CardContent } from '@/ui/card'
import { Skeleton } from '@/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Users, Search, AlertTriangle, Loader2 } from 'lucide-react'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)

  const { data, isLoading, isError, error } = useAdminUsers({ search, role: roleFilter })
  const updateRole = useUpdateUserRole()
  const deactivateUser = useDeactivateUser()

  const handleRoleUpdate = async (userId: string, newRole: 'employee' | 'manager' | 'admin' | 'hr') => {
    try {
      await updateRole.mutateAsync({ user_id: userId, new_role: newRole })
    } catch (err) {
      console.error('Failed to update role:', err)
    }
  }

  const openDeactivateDialog = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName })
    setDeactivateDialogOpen(true)
  }

  const handleDeactivate = async () => {
    if (!selectedUser) return
    
    try {
      await deactivateUser.mutateAsync(selectedUser.id)
      setDeactivateDialogOpen(false)
      setSelectedUser(null)
    } catch (err) {
      console.error('Failed to deactivate user:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
        <Card>
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-8 p-6 md:p-8">
        <PageHeader
          title="User Management"
          description="View and manage user roles and access"
        />
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Failed to load users</p>
                <p className="text-sm text-destructive/80 mt-1">
                  {error instanceof Error ? error.message : 'Failed to load users'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="User Management"
          description="View and manage user roles and access"
        />
        <Button
          onClick={() => window.location.href = '/dashboard/admin/users/create'}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Users className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter ?? 'all'} onValueChange={(value) => setRoleFilter(value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="dark:bg-[#1E1E1E] text-white shadow-md border dark:border-[#2E2E2E] rounded-md">
            <SelectItem value="all" className="px-3 py-2 cursor-pointer dark:hover:bg-[#2A2A2A] dark:focus:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-offset-2 ring-blue-400 focus-visible:ring-offset-[#1E1E1E]">All Roles</SelectItem>
            <SelectItem value="employee" className="px-3 py-2 cursor-pointer dark:hover:bg-[#2A2A2A] dark:focus:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-offset-2 ring-blue-400 focus-visible:ring-offset-[#1E1E1E]">Employee</SelectItem>
            <SelectItem value="manager" className="px-3 py-2 cursor-pointer dark:hover:bg-[#2A2A2A] dark:focus:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-offset-2 ring-blue-400 focus-visible:ring-offset-[#1E1E1E]">Manager</SelectItem>
            <SelectItem value="hr" className="px-3 py-2 cursor-pointer dark:hover:bg-[#2A2A2A] dark:focus:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-offset-2 ring-blue-400 focus-visible:ring-offset-[#1E1E1E]">HR</SelectItem>
            <SelectItem value="admin" className="px-3 py-2 cursor-pointer dark:hover:bg-[#2A2A2A] dark:focus:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-offset-2 ring-blue-400 focus-visible:ring-offset-[#1E1E1E]">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      {data?.users && data.users.length > 0 ? (
        <Card className="bg-card border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors border-b">
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{user.department ?? '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleUpdate(user.id, value as 'employee' | 'manager' | 'admin' | 'hr')}
                      disabled={updateRole.isPending}
                    >
                      <SelectTrigger className="w-32 h-9 bg-background border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-[#1E1E1E] text-white shadow-md border dark:border-[#2E2E2E] rounded-md">
                        <SelectItem value="employee" className="px-3 py-2 cursor-pointer dark:hover:bg-[#2A2A2A] dark:focus:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-offset-2 ring-blue-400 focus-visible:ring-offset-[#1E1E1E]">Employee</SelectItem>
                        <SelectItem value="manager" className="px-3 py-2 cursor-pointer dark:hover:bg-[#2A2A2A] dark:focus:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-offset-2 ring-blue-400 focus-visible:ring-offset-[#1E1E1E]">Manager</SelectItem>
                        <SelectItem value="hr" className="px-3 py-2 cursor-pointer dark:hover:bg-[#2A2A2A] dark:focus:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-offset-2 ring-blue-400 focus-visible:ring-offset-[#1E1E1E]">HR</SelectItem>
                        <SelectItem value="admin" className="px-3 py-2 cursor-pointer dark:hover:bg-[#2A2A2A] dark:focus:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-offset-2 ring-blue-400 focus-visible:ring-offset-[#1E1E1E]">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'} className="font-medium bg-background border">
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeactivateDialog(user.id, user.full_name)}
                        disabled={deactivateUser.isPending}
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors bg-background"
                      >
                        Deactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title="No users found"
          description={search || roleFilter ? "Try adjusting your search or filter criteria." : "No users are currently registered in the system."}
        />
      )}

      {/* Deactivate User Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-destructive/10 p-3 shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2 flex-1">
                <DialogTitle className="text-xl">Deactivate User</DialogTitle>
                <DialogDescription className="text-base">
                  Are you sure you want to deactivate <span className="font-semibold text-foreground">{selectedUser?.name}</span>?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4 px-1">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">What happens when you deactivate a user:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>User will no longer be able to access the system</li>
                <li>All pending leave requests will remain unchanged</li>
                <li>User data will be preserved</li>
                <li>This action can be reversed later</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeactivateDialogOpen(false)}
              disabled={deactivateUser.isPending}
              className="sm:min-w-24"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateUser.isPending}
              className="sm:min-w-32"
            >
              {deactivateUser.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Deactivate User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
