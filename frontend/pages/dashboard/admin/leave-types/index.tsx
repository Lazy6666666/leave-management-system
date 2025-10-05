import { useState } from 'react'
import { useLeaveTypes, useUpsertLeaveType, useDeleteLeaveType } from '@/hooks/use-admin'
import { LeaveType } from '@/lib/types'
import type { UpsertLeaveTypePayload } from '@/lib/schemas/admin'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { Skeleton } from '@/ui/skeleton'
import { Checkbox } from '@/ui/checkbox'
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
import { FileText, Plus, AlertTriangle, Loader2, Edit, Trash2 } from 'lucide-react'

export default function AdminLeaveTypesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLeaveType, setSelectedLeaveType] = useState<{ id: string; name: string } | null>(null)
  const [formData, setFormData] = useState<Partial<UpsertLeaveTypePayload>>({
    name: '',
    code: '',
    description: '',
    default_allocation_days: 0,
    max_carryover_days: 0,
    requires_approval: true,
    is_active: true,
  })

  const { data, isLoading, isError, error } = useLeaveTypes({ includeInactive: true })
  const upsertLeaveType = useUpsertLeaveType()
  const deleteLeaveType = useDeleteLeaveType()

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      default_allocation_days: 0,
      max_carryover_days: 0,
      requires_approval: true,
      is_active: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await upsertLeaveType.mutateAsync({
        id: editingId ?? undefined,
        name: formData.name!,
        code: formData.code!,
        description: formData.description,
        default_allocation_days: formData.default_allocation_days!,
        max_carryover_days: formData.max_carryover_days!,
        requires_approval: formData.requires_approval ?? true,
        is_active: formData.is_active ?? true,
      })
      resetForm()
    } catch (err) {
      console.error('Failed to save leave type:', err)
    }
  }

  const handleEdit = (leaveType: LeaveType) => {
    setEditingId(leaveType.id)
    setFormData({
      name: leaveType.name,
      code: '',  // Not in database schema
      description: leaveType.description ?? undefined,
      default_allocation_days: leaveType.default_allocation_days,
      max_carryover_days: 0,  // Not in database schema
      requires_approval: true,  // Not in database schema
      is_active: leaveType.is_active ?? undefined,
    })
    setShowForm(true)
  }

  const openDeleteDialog = (id: string, name: string) => {
    setSelectedLeaveType({ id, name })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedLeaveType) return

    try {
      await deleteLeaveType.mutateAsync(selectedLeaveType.id)
      setDeleteDialogOpen(false)
      setSelectedLeaveType(null)
    } catch (err) {
      console.error('Failed to delete leave type:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40 ml-auto" />
        <Card>
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
          title="Leave Types"
          description="Manage leave type configurations and policies"
        />
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Failed to load leave types</p>
                <p className="text-sm text-destructive/80 mt-1">
                  {error instanceof Error ? error.message : 'Failed to load leave types'}
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
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Leave Types"
          description="Manage leave type configurations and policies"
        />
        <Button onClick={() => setShowForm(!showForm)} size="default">
          {showForm ? (
            'Cancel'
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Leave Type
            </>
          )}
        </Button>
      </div>

      {/* Leave Type Form */}
      {showForm && (
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">
              {editingId ? 'Edit Leave Type' : 'Create New Leave Type'}
            </CardTitle>
            <CardDescription>
              {editingId ? 'Update the leave type details below' : 'Fill in the details to create a new leave type'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Annual Leave"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., AL"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Short code for internal reference</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this leave type"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="allocation">Default Allocation (days) *</Label>
                  <Input
                    id="allocation"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.default_allocation_days}
                    onChange={(e) => setFormData({ ...formData, default_allocation_days: Number(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Days allocated per year</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carryover">Max Carryover (days) *</Label>
                  <Input
                    id="carryover"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.max_carryover_days}
                    onChange={(e) => setFormData({ ...formData, max_carryover_days: Number(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Days that can carry over to next year</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="requires_approval"
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: checked as boolean })}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="requires_approval" className="cursor-pointer font-medium">
                      Requires Approval
                    </Label>
                    <p className="text-xs text-muted-foreground">Leave requests must be approved by a manager</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active" className="cursor-pointer font-medium">
                      Active
                    </Label>
                    <p className="text-xs text-muted-foreground">Leave type is available for use</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={upsertLeaveType.isPending}>
                  {upsertLeaveType.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingId ? 'Update Leave Type' : 'Create Leave Type'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={upsertLeaveType.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Types Table */}
      {data?.leaveTypes && data.leaveTypes.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold text-right">Allocation</TableHead>
                <TableHead className="font-semibold text-right">Carryover</TableHead>
                <TableHead className="font-semibold">Approval</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.leaveTypes.map((lt) => (
                <TableRow key={lt.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{lt.name}</TableCell>
                  <TableCell>
                    <code className="rounded-md bg-muted px-2 py-1 text-xs font-mono">
                      {lt.name.toUpperCase().slice(0, 3)}
                    </code>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className="text-muted-foreground">{lt.default_allocation_days} days</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className="text-muted-foreground">N/A</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="font-medium">
                      Required
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lt.is_active ? 'default' : 'secondary'} className="font-medium">
                      {lt.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(lt)}
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                      >
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteDialog(lt.id, lt.name)}
                        disabled={deleteLeaveType.isPending}
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={FileText}
          title="No leave types found"
          description="Create your first leave type to get started with leave management"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-destructive/10 p-3 shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2 flex-1">
                <DialogTitle className="text-xl">Delete Leave Type</DialogTitle>
                <DialogDescription className="text-base">
                  Are you sure you want to delete <span className="font-semibold text-foreground">{selectedLeaveType?.name}</span>?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4 px-1">
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-2">
              <p className="text-sm font-medium text-destructive">Warning: This action cannot be undone</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>All associated leave allocations will be affected</li>
                <li>Historical leave requests will remain unchanged</li>
                <li>This leave type will no longer be available for new requests</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLeaveType.isPending}
              className="sm:min-w-24"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLeaveType.isPending}
              className="sm:min-w-32"
            >
              {deleteLeaveType.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Leave Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
