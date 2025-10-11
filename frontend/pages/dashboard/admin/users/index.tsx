import Link from 'next/link'
import { useState } from 'react'
import { useAdminUsers, useUpdateUserRole, useDeactivateUser, useAddUser, AdminUsersResponse } from '@/hooks/use-admin'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
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
import { Users, Search, AlertTriangle, Loader2, Edit } from 'lucide-react'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addUserRole, setAddUserRole] = useState<'employee' | 'manager' | 'admin' | 'hr'>('employee')
  const [editDialogOpen, setEditDialogOpen] = useState(false)

// ...
const [userToEdit, setUserToEdit] = useState<AdminUsersResponse['users'][number] | null>(null)

  const { data, isLoading, isError, error } = useAdminUsers({ search, role: roleFilter })
  const updateRole = useUpdateUserRole()
  const deactivateUser = useDeactivateUser()
  const addUserMutation = useAddUser()

  const handleAddUserSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const full_name = formData.get('full_name') as string;
    const department = formData.get('department') as string;
    const is_active = formData.get('is_active') === 'on';

    try {
      await addUserMutation.mutateAsync({
        email,
        password,
        full_name,
        role: addUserRole,
        department: department || undefined,
        is_active,
      });
      setAddDialogOpen(false);
      form.reset();
      setAddUserRole('employee');
    } catch (err) {
      console.error('Failed to add user:', err);
    }
  }

  const handleEditUserSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userToEdit) return;

    try {
      await updateRole.mutateAsync({
        user_id: userToEdit.supabase_id,
        new_role: userToEdit.role,
        full_name: userToEdit.name,
        department: userToEdit.department || undefined,
        is_active: userToEdit.is_active,
      });
      setEditDialogOpen(false);
      setUserToEdit(null);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

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
          onClick={() => setAddDialogOpen(true)}
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
                <Link href={`/dashboard/admin/users/${user.id}`} key={user.supabase_id}>
                  <TableRow className="hover:bg-muted/50 transition-colors border-b cursor-pointer">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{user.department ?? '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleUpdate(user.supabase_id, value as 'employee' | 'manager' | 'admin' | 'hr')}
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
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        setUserToEdit(user);
                        setEditDialogOpen(true);
                      }}
                      className="hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          openDeactivateDialog(user.supabase_id, user.name);
                        }}
                        disabled={deactivateUser.isPending}
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors bg-background"
                      >
                        Deactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                </Link>
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

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Register a new user and assign their initial role and department.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUserSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">Full Name</Label>
              <Input id="full_name" name="full_name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" type="email" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Password</Label>
              <Input id="password" name="password" type="password" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">Department</Label>
              <Input id="department" name="department" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select name="role" defaultValue="employee" onValueChange={(value) => setAddUserRole(value as 'employee' | 'manager' | 'admin' | 'hr')}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">Active</Label>
              <input id="is_active" name="is_active" type="checkbox" defaultChecked className="col-span-3 ml-3" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addUserMutation.isPending}>
                {addUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Edit the user's profile information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUserSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-full_name" className="text-right">Full Name</Label>
              <Input id="edit-full_name" name="full_name" className="col-span-3" value={userToEdit?.name || ''} onChange={(e) => setUserToEdit(prev => prev ? { ...prev, name: e.target.value } : null)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">Email</Label>
              <Input id="edit-email" name="email" type="email" className="col-span-3" value={userToEdit?.email || ''} onChange={(e) => setUserToEdit(prev => prev ? { ...prev, email: e.target.value } : null)} disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-department" className="text-right">Department</Label>
              <Input id="edit-department" name="department" className="col-span-3" value={userToEdit?.department || ''} onChange={(e) => setUserToEdit(prev => prev ? { ...prev, department: e.target.value } : null)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">Role</Label>
              <Select name="role" value={userToEdit?.role} onValueChange={(value) => setUserToEdit(prev => prev ? { ...prev, role: value as 'employee' | 'manager' | 'admin' | 'hr' } : null)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is_active" className="text-right">Active</Label>
              <input id="edit-is_active" name="is_active" type="checkbox" checked={userToEdit?.is_active} onChange={(e) => setUserToEdit(prev => prev ? { ...prev, is_active: e.target.checked } : null)} className="col-span-3 ml-3" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
